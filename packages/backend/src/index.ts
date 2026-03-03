import Fastify from "fastify"
import fastifyJwt from "@fastify/jwt"
import { connectMongo, closeMongo, mongo } from "./db/mongo.js"
import { redis } from "./db/redis.js"
import { registerWebSocket } from "./ws/plugin.js"
import { authRoutes } from "./routes/auth.js"
import { adminRoutes } from "./routes/admin.js"
import { worldRoutes } from "./routes/worlds.js"

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

async function start() {
  await connectMongo()
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
