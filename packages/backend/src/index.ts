import fastifyJwt from "@fastify/jwt"
import fastifyStatic from "@fastify/static"
import { GAME_HOUR_INTERVAL_MS } from "@grim-frontier/shared"
import Fastify from "fastify"
import { consumeFireWood } from "./core/hourlyUpdaters/consumeFireWood.js"
import { fireMoraleBoost } from "./core/hourlyUpdaters/fireMoraleBoost.js"
import { consumeFood } from "./core/hourlyUpdaters/consumeFood.js"
import { gatherFood } from "./core/hourlyUpdaters/gatherFood.js"
import { gatherFuel } from "./core/hourlyUpdaters/gatherWood.js"
import { drifterAI } from "./core/hourlyUpdaters/drifterAI.js"
import { npcTravel } from "./core/hourlyUpdaters/npcTravel.js"
import { restFatigue } from "./core/hourlyUpdaters/restFatigue.js"
import { standWatch } from "./core/hourlyUpdaters/standWatch.js"
import { createWeatherUpdater } from "./core/hourlyUpdaters/updateWeather.js"
import { generateDailyWeather } from "./core/weatherGenerator.js"
import { WorldClock } from "./core/worldClock.js"
import { closeMongo, connectMongo, mongo } from "./db/mongo.js"
import { redis } from "./db/redis.js"
import { worlds } from "./models/collections.js"
import { adminRoutes } from "./routes/admin.js"
import { authRoutes } from "./routes/auth.js"
import { characterRoutes } from "./routes/characters.js"
import { worldRoutes } from "./routes/worlds.js"
import { broadcastToWorld, registerWebSocket } from "./ws/plugin.js"

const app = Fastify({ logger: true })
const clock = new WorldClock()
const port = Number(process.env.PORT ?? 3000)
const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-in-production"

await app.register(fastifyJwt, { secret: jwtSecret })
await app.register(fastifyStatic, { root: "/portraits", prefix: "/portraits/" })
await registerWebSocket(app, clock)

app.get("/health", async () => {
  const mongoStatus = await mongo
    .db()
    .command({ ping: 1 })
    .then(() => "connected")
    .catch(() => "disconnected")

  const redisStatus = redis.status === "ready" ? "connected" : redis.status

  return { status: "ok", mongo: mongoStatus, redis: redisStatus }
})

await app.register(authRoutes)
await app.register(characterRoutes)
await app.register(adminRoutes, { clock, broadcast: broadcastToWorld, intervalMs: GAME_HOUR_INTERVAL_MS })
await app.register(worldRoutes)

app.addHook("onReady", async () => {
  const activeWorlds = await worlds.find({ status: "active" }).toArray()
  if (activeWorlds.length === 0) {
    console.warn("No active worlds found at startup — clock not seeded")
    return
  }
  for (const world of activeWorlds) {
    if (world._id) {
      const worldId = world._id.toString()
      clock.setDate(worldId, world.inWorldDate)

      if (world.weather) {
        clock.setWeather(worldId, world.weather)
      } else {
        const weather = generateDailyWeather(world.inWorldDate)
        clock.setWeather(worldId, weather)
        worlds.updateOne({ _id: world._id }, { $set: { weather, updatedAt: new Date() } })
      }
    }
  }
  console.log(`Clock seeded for ${activeWorlds.length} world(s)`)
})

async function start() {
  await connectMongo()

  clock.registerHourlyUpdater(createWeatherUpdater(clock))
  clock.registerHourlyUpdater(gatherFood)
  clock.registerHourlyUpdater(gatherFuel)
  clock.registerHourlyUpdater(consumeFood)
  clock.registerHourlyUpdater(consumeFireWood)
  clock.registerHourlyUpdater(fireMoraleBoost)
  clock.registerHourlyUpdater(restFatigue)
  clock.registerHourlyUpdater(standWatch)
  clock.registerHourlyUpdater(drifterAI)
  clock.registerHourlyUpdater(npcTravel)

  await app.listen({ port, host: "0.0.0.0" })
}

async function shutdown() {
  await app.close()
  await closeMongo()
  await redis.quit()
  process.exit(0)
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)

start().catch(err => {
  console.error(err)
  process.exit(1)
})
