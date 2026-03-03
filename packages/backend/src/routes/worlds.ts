import type { FastifyInstance } from "fastify"
import { ObjectId } from "mongodb"
import { worlds, regions, territories, towns, players, camps, npcs } from "../models/collections.js"
import { authenticate } from "../middleware/authenticate.js"

/** World membership routes — joining an existing world. */
export async function worldRoutes(app: FastifyInstance) {
  app.get("/worlds", { preHandler: authenticate }, async () => {
    const activeWorlds = await worlds.find({ status: "active" }).toArray()
    return activeWorlds.map(world => ({
      id: world._id!.toString(),
      name: world.name,
      inWorldDate: world.inWorldDate,
    }))
  })

  app.post<{ Params: { id: string } }>(
    "/worlds/:id/join",
    { preHandler: authenticate },
    async (request, reply) => {
      const { playerId } = request.user
      const worldId = request.params.id

      let worldObjectId: ObjectId
      try {
        worldObjectId = new ObjectId(worldId)
      } catch {
        return reply.status(400).send({ error: "Invalid world id" })
      }

      const world = await worlds.findOne({ _id: worldObjectId })
      if (!world) {
        return reply.status(404).send({ error: "World not found" })
      }

      const player = await players.findOne({ _id: new ObjectId(playerId) })
      if (!player) {
        return reply.status(404).send({ error: "Player not found" })
      }

      if (player.worldId) {
        return reply.status(409).send({ error: "Already in a world" })
      }

      const region = await regions.findOne({ worldId })
      const territory = region ? await territories.findOne({ regionId: region._id!.toString() }) : null

      if (!territory) {
        return reply.status(500).send({ error: "World is not fully initialized" })
      }

      const now = new Date()
      const campId = new ObjectId()

      await camps.insertOne({
        _id: campId,
        ownerId: playerId,
        worldId,
        territoryId: territory._id!.toString(),
        name: `${player.username}'s Camp`,
        resources: { food: 10, supplies: 5 },
        stability: 50,
        posture: "open",
        reputation: 0,
        wealth: 0,
        notoriety: 0,
        createdAt: now,
        updatedAt: now,
      })

      await players.updateOne(
        { _id: new ObjectId(playerId) },
        { $set: { worldId, campId: campId.toString(), updatedAt: now } }
      )

      return reply.status(201).send({ campId: campId.toString(), worldId })
    }
  )

  app.get<{ Params: { id: string } }>(
    "/worlds/:id/map",
    { preHandler: authenticate },
    async (request, reply) => {
      const { playerId } = request.user
      const worldId = request.params.id

      const region = await regions.findOne({ worldId })
      if (!region) {
        return reply.status(404).send({ error: "World map not found" })
      }

      const territory = await territories.findOne({ regionId: region._id!.toString() })
      if (!territory) {
        return reply.status(404).send({ error: "Territory not found" })
      }

      const town = await towns.findOne({ territoryId: territory._id!.toString() })
      const camp = await camps.findOne({ worldId, ownerId: playerId })

      return {
        territory: {
          id: territory._id!.toString(),
          name: territory.name,
          town: town ? { id: town._id!.toString(), name: town.name } : null,
          camp: camp ? { id: camp._id!.toString(), name: camp.name } : null,
        },
      }
    }
  )

  app.get<{ Params: { id: string } }>(
    "/towns/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      let townId: ObjectId
      try {
        townId = new ObjectId(request.params.id)
      } catch {
        return reply.status(400).send({ error: "Invalid town id" })
      }

      const town = await towns.findOne({ _id: townId })
      if (!town) {
        return reply.status(404).send({ error: "Town not found" })
      }

      return { id: town._id!.toString(), name: town.name, territoryId: town.territoryId }
    }
  )

  app.get<{ Params: { id: string } }>(
    "/camps/:id",
    { preHandler: authenticate },
    async (request, reply) => {
      let campId: ObjectId
      try {
        campId = new ObjectId(request.params.id)
      } catch {
        return reply.status(400).send({ error: "Invalid camp id" })
      }

      const camp = await camps.findOne({ _id: campId })
      if (!camp) {
        return reply.status(404).send({ error: "Camp not found" })
      }

      const campNpcs = await npcs.find({ campId: camp._id!.toString() }).toArray()

      return {
        id: camp._id!.toString(),
        name: camp.name,
        ownerId: camp.ownerId,
        resources: camp.resources,
        stability: camp.stability,
        posture: camp.posture,
        reputation: camp.reputation,
        wealth: camp.wealth,
        notoriety: camp.notoriety,
        npcs: campNpcs.map(npc => ({ id: npc._id!.toString(), name: npc.name, career: npc.career })),
      }
    }
  )
}
