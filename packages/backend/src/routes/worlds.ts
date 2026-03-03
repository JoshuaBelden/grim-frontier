import type { FastifyInstance } from "fastify"
import { ObjectId } from "mongodb"
import { worlds, regions, territories, players, camps } from "../models/collections.js"
import { authenticate } from "../middleware/authenticate.js"

/** World membership routes — joining an existing world. */
export async function worldRoutes(app: FastifyInstance) {
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
}
