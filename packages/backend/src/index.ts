import fastifyJwt from "@fastify/jwt"
import Fastify from "fastify"
import { setWorldDate, startClockTick } from "./core/clockTick.js"
import { closeMongo, connectMongo, mongo } from "./db/mongo.js"
import { worlds } from "./models/collections.js"
import { redis } from "./db/redis.js"
import { adminRoutes } from "./routes/admin.js"
import { authRoutes } from "./routes/auth.js"
import { worldRoutes } from "./routes/worlds.js"
import { broadcastToWorld, registerWebSocket } from "./ws/plugin.js"

const app = Fastify({ logger: true })
const port = Number(process.env.PORT ?? 3000)
const jwtSecret = process.env.JWT_SECRET ?? "dev-secret-change-in-production"

await app.register(fastifyJwt, { secret: jwtSecret })
await registerWebSocket(app)

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
await app.register(adminRoutes)
await app.register(worldRoutes)

app.addHook("onReady", async () => {
  const activeWorlds = await worlds.find({ status: "active" }).toArray()
  if (activeWorlds.length === 0) {
    console.warn("No active worlds found at startup — clock not seeded")
    return
  }
  for (const world of activeWorlds) {
    if (world._id) {
      setWorldDate(world._id.toString(), world.inWorldDate)
    }
  }
  console.log(`Clock seeded for ${activeWorlds.length} world(s)`)
})

async function start() {
  await connectMongo()
  startClockTick(broadcastToWorld)
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
