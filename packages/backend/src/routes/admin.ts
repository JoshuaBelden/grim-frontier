import type { FastifyInstance } from "fastify"
import { generateNpcPool } from "../core/npcGenerator.js"
import worldTopology from "../core/topology.js"
import { INITIAL_IN_WORLD_DATE, seedWorld } from "../core/world.js"
import { WorldClock } from "../core/worldClock.js"
import {
  camps,
  encounters,
  gameClocks,
  npcs,
  players,
  regions,
  stores,
  tasks,
  territories,
  towns,
  worlds,
} from "../models/collections.js"

/** Request body for NPC pool generation. */
interface GenerateNpcsBody {
  count?: number
}

/** Request body for world creation. */
interface CreateWorldBody {
  name: string
}

/** Admin routes for world management. No auth required in MVP — admin ops via curl. */
export async function adminRoutes(app: FastifyInstance, opts: { clock: WorldClock }) {
  const { clock } = opts
  app.post<{ Body: CreateWorldBody }>("/admin/worlds", async (request, reply) => {
    const { name } = request.body

    if (!name) {
      return reply.status(400).send({ error: "name is required" })
    }

    const result = await seedWorld(name, worldTopology)

    return reply.status(201).send(result)
  })

  app.post("/admin/worlds/reset", async (_request, reply) => {
    await Promise.all([
      worlds.deleteMany({}),
      regions.deleteMany({}),
      territories.deleteMany({}),
      towns.deleteMany({}),
      camps.deleteMany({}),
      npcs.deleteMany({ ownerId: { $exists: true } }),
      encounters.deleteMany({}),
      tasks.deleteMany({}),
      gameClocks.deleteMany({}),
      stores.deleteMany({}),
      players.updateMany({}, { $unset: { campId: "" }, $set: { npcIds: [] } }),
    ])

    clock.clearAll()
    const result = await seedWorld("Grim Frontier", worldTopology)
    clock.setDate(result.worldId, INITIAL_IN_WORLD_DATE)

    const townIds = Object.values(result.landmarkIds)
    const unownedNpcs = await npcs.find({ ownerId: { $exists: false } }).toArray()
    const bulkOps = unownedNpcs.map(npc => {
      const randomTownId = townIds[Math.floor(Math.random() * townIds.length)]
      return {
        updateOne: {
          filter: { _id: npc._id },
          update: {
            $set: {
              worldId: result.worldId,
              locationId: randomTownId,
              locationType: "town" as const,
              status: "drifting" as const,
              health: 10,
              morale: 10,
              hunger: 0,
              fatigue: 0,
              updatedAt: new Date(),
            },
            $unset: { campId: "" as const, currentAction: "" as const },
          },
        },
      }
    })

    if (bulkOps.length > 0) {
      await npcs.bulkWrite(bulkOps)
    }

    return reply.status(201).send(result)
  })

  app.post<{ Body: GenerateNpcsBody }>("/admin/npcs/generate", async (request, reply) => {
    const rawCount = request.body?.count ?? 20
    const count = Math.max(1, Math.min(50, rawCount))

    let pool
    try {
      pool = await generateNpcPool(count)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes("ANTHROPIC_API_KEY")) {
        return reply.status(503).send({ error: "Claude API key not configured" })
      }
      return reply.status(502).send({ error: message })
    }

    const result = await npcs.insertMany(pool)
    const ids = Object.values(result.insertedIds).map(id => id.toString())

    return reply.status(201).send({ generated: count, ids })
  })
}
