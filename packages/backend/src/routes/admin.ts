import type { FastifyInstance } from "fastify"
import { ObjectId } from "mongodb"
import { worlds, regions, territories, towns } from "../models/collections.js"
import worldTopology from "../data/world.js"

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

    const now = new Date()
    const worldId = new ObjectId()

    await worlds.insertOne({
      _id: worldId,
      name,
      status: "active",
      inWorldDate: { year: 1875, month: 4, day: 1, hour: 6 },
      createdAt: now,
      updatedAt: now,
    })

    const regionData = worldTopology.regions[0]
    const regionId = new ObjectId()

    await regions.insertOne({
      _id: regionId,
      worldId: worldId.toString(),
      name: regionData.name,
      resourceProfile: regionData.resourceProfile,
      createdAt: now,
      updatedAt: now,
    })

    const territoryData = regionData.territories[0]
    const territoryId = new ObjectId()

    await territories.insertOne({
      _id: territoryId,
      regionId: regionId.toString(),
      name: territoryData.name,
      createdAt: now,
      updatedAt: now,
    })

    const townData = territoryData.towns[0]
    const townId = new ObjectId()

    await towns.insertOne({
      _id: townId,
      territoryId: territoryId.toString(),
      name: townData.name,
      nodeKey: townData.key,
      createdAt: now,
      updatedAt: now,
    })

    return reply.status(201).send({
      worldId: worldId.toString(),
      regionId: regionId.toString(),
      territoryId: territoryId.toString(),
      townId: townId.toString(),
    })
  })
}
