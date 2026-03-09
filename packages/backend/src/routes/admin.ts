import type { FastifyInstance } from "fastify"
import { clearAllWorldDates, setWorldDate } from "../core/clockTick.js"
import worldTopology from "../core/topology.js"
import { INITIAL_IN_WORLD_DATE, seedWorld } from "../core/world.js"
import {
  camps,
  encounters,
  gameClocks,
  npcs,
  players,
  regions,
  tasks,
  territories,
  towns,
  worlds,
} from "../models/collections.js"

/** Request body for world creation. */
interface CreateWorldBody {
  name: string
}

/** Admin routes for world management. No auth required in MVP — admin ops via curl. */
export async function adminRoutes(app: FastifyInstance) {
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
      npcs.deleteMany({}),
      encounters.deleteMany({}),
      tasks.deleteMany({}),
      gameClocks.deleteMany({}),
      players.updateMany({}, { $set: { npcIds: [] }, $unset: { campId: "" } }),
    ])

    clearAllWorldDates()
    const result = await seedWorld("Grim Frontier", worldTopology)
    setWorldDate(result.worldId, INITIAL_IN_WORLD_DATE)

    return reply.status(201).send(result)
  })
}
