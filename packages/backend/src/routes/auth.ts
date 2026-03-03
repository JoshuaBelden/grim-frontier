import type { FastifyInstance } from "fastify"
import { ObjectId } from "mongodb"
import { players } from "../models/collections.js"
import { redis } from "../db/redis.js"
import type { Player, Characteristics, Nature, CharacterOrigin } from "@grim-frontier/shared"

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

/** Request body for player registration and login. */
interface RegisterBody {
  username: string
  password: string
}

/** Returns a random integer between min and max, inclusive. */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Generates randomized starting characteristics for a new player. */
function defaultCharacteristics(): Characteristics {
  return {
    strength: randomInt(3, 8),
    hand: randomInt(3, 8),
    presence: randomInt(3, 8),
    wit: randomInt(3, 8),
    temper: randomInt(3, 8),
    grit: randomInt(3, 8),
    nerve: randomInt(3, 8),
    luck: randomInt(3, 8),
  }
}

/** Returns neutral starting nature values for a new player. */
function defaultNature(): Nature {
  return {
    disposition: {
      generosity: 0,
      mercy: 0,
      courage: 0,
      contentment: 0,
      honesty: 0,
    },
    outlook: {
      idealism: 0,
      willfulness: 0,
      trust: 0,
      humility: 0,
    },
  }
}

/** Returns a generic frontier origin for a new player. */
function defaultOrigin(): CharacterOrigin {
  return {
    background: {
      origin: "frontier",
      family: "settled",
      formativeEvent: "Left home young, rode west with nothing but a bedroll and a name.",
    },
    scars: [],
    pursuits: {},
  }
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

    const player: Player & { _id: ObjectId } = {
      _id: playerId,
      username,
      passwordHash,
      characteristics: defaultCharacteristics(),
      nature: defaultNature(),
      traits: [],
      career: "cowboy",
      skills: {},
      origin: defaultOrigin(),
      relationships: [],
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
}
