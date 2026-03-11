import type { NPC, Player } from "@grim-frontier/shared"
import type { FastifyInstance } from "fastify"
import { ObjectId } from "mongodb"
import { defaultCharacteristics, defaultNature, defaultOrigin } from "../core/character.js"
import { redis } from "../db/redis.js"
import { authenticate } from "../middleware/authenticate.js"
import { npcs, players } from "../models/collections.js"

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

/** Request body for player registration and login. */
interface RegisterBody {
  username: string
  password: string
}

/** Registers and logs in player accounts. */
export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: RegisterBody }>("/auth/register", async (request, reply) => {
    const { username, password } = request.body

    if (!username || !password) {
      return reply.status(400).send({ error: "username and password are required" })
    }

    const existing = await players.findOne({ username })
    if (existing) {
      return reply.status(409).send({ error: "Username already taken" })
    }

    const passwordHash = await Bun.password.hash(password)
    const now = new Date()
    const playerId = new ObjectId()
    const npcId = new ObjectId()

    const npc: NPC & { _id: ObjectId } = {
      _id: npcId,
      ownerId: playerId.toString(),
      name: username,
      health: 10,
      morale: 10,
      characteristics: defaultCharacteristics(),
      nature: defaultNature(),
      traits: [],
      career: "cowboy",
      skills: {},
      origin: defaultOrigin(),
      relationships: [],
      status: "drifting",
      createdAt: now,
      updatedAt: now,
    }

    await npcs.insertOne(npc)

    const player: Player & { _id: ObjectId } = {
      _id: playerId,
      username,
      passwordHash,
      npcIds: [npcId.toString()],
      createdAt: now,
      updatedAt: now,
    }

    await players.insertOne(player)

    const jti = crypto.randomUUID()
    const token = app.jwt.sign({ playerId: playerId.toString(), jti })
    await redis.set(`session:${jti}`, playerId.toString(), "EX", SESSION_TTL_SECONDS)

    return reply.status(201).send({ token, playerId: playerId.toString() })
  })

  app.post<{ Body: RegisterBody }>("/auth/login", async (request, reply) => {
    const { username, password } = request.body

    if (!username || !password) {
      return reply.status(400).send({ error: "username and password are required" })
    }

    const player = await players.findOne({ username })
    if (!player) {
      return reply.status(401).send({ error: "Invalid credentials" })
    }

    const valid = await Bun.password.verify(password, player.passwordHash)
    if (!valid) {
      return reply.status(401).send({ error: "Invalid credentials" })
    }

    const jti = crypto.randomUUID()
    const token = app.jwt.sign({ playerId: player._id!.toString(), jti })
    await redis.set(`session:${jti}`, player._id!.toString(), "EX", SESSION_TTL_SECONDS)

    return { token, playerId: player._id!.toString() }
  })

  app.get("/players/me", { preHandler: authenticate }, async (request, reply) => {
    const { playerId } = request.user
    const player = await players.findOne({ _id: new ObjectId(playerId) })
    if (!player) {
      return reply.status(404).send({ error: "Player not found" })
    }
    return {
      playerId: player._id!.toString(),
      username: player.username,
      campId: player.campId ?? null,
      npcIds: player.npcIds,
    }
  })
}
