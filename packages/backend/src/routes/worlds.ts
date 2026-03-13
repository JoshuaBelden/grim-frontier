import { emptyFoodStores, emptyFuelStores } from "@grim-frontier/shared"
import type { FastifyInstance } from "fastify"
import { ObjectId } from "mongodb"
import { defaultCharacteristics, defaultNature, defaultOrigin } from "../core/character.js"
import worldTopology from "../core/topology.js"
import { authenticate } from "../middleware/authenticate.js"
import { camps, npcs, players, regions, territories, towns, worlds } from "../models/collections.js"

/** World membership routes — listing and joining worlds (pre-WebSocket). */
export async function worldRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>("/npcs/:id", { preHandler: authenticate }, async (request, reply) => {
    let npcId: ObjectId
    try {
      npcId = new ObjectId(request.params.id)
    } catch {
      return reply.status(400).send({ error: "Invalid NPC id" })
    }

    const npc = await npcs.findOne({ _id: npcId })
    if (!npc) {
      return reply.status(404).send({ error: "NPC not found" })
    }

    let locationName: string | null = null
    if (npc.locationId) {
      if (npc.locationType === "camp") {
        const camp = await camps.findOne({ _id: new ObjectId(npc.locationId) })
        locationName = camp?.name ?? null
      } else if (npc.locationType === "town") {
        const town = await towns.findOne({ _id: new ObjectId(npc.locationId) })
        locationName = town?.name ?? null
      }
    }

    return {
      id: npc._id!.toString(),
      worldId: npc.worldId ?? null,
      locationId: npc.locationId ?? null,
      locationType: npc.locationType ?? null,
      locationName,
      name: npc.name,
      career: npc.career,
      status: npc.status,
      characteristics: npc.characteristics,
      nature: npc.nature,
      traits: npc.traits,
      skills: npc.skills,
      origin: npc.origin,
    }
  })


  app.get("/worlds", { preHandler: authenticate }, async () => {
    const activeWorlds = await worlds.find({ status: "active" }).toArray()
    return activeWorlds.map(world => ({
      id: world._id!.toString(),
      name: world.name,
      inWorldDate: world.inWorldDate,
    }))
  })

  app.post<{ Params: { id: string } }>("/worlds/:id/join", { preHandler: authenticate }, async (request, reply) => {
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

    const now = new Date()
    const npcId = new ObjectId()
    const playerNpc = {
      _id: npcId,
      ownerId: playerId,
      name: player.username,
      health: 10,
      morale: 10,
      hunger: 0,
      fatigue: 0,
      characteristics: defaultCharacteristics(),
      nature: defaultNature(),
      traits: [],
      career: "cowboy" as const,
      skills: {},
      origin: defaultOrigin(),
      relationships: [],
      inventory: [],
      money: 50,
      status: "drifting" as const,
      createdAt: now,
      updatedAt: now,
    }
    await npcs.insertOne(playerNpc)
    await players.updateOne({ _id: new ObjectId(playerId) }, { $push: { npcIds: npcId.toString() } })

    const region = await regions.findOne({ worldId })
    const territory = region ? await territories.findOne({ regionId: region._id!.toString() }) : null

    if (!territory) {
      return reply.status(500).send({ error: "World is not fully initialized" })
    }

    const territoryNode = worldTopology.regions
      .flatMap(region => region.territories)
      .find(node => node.key === territory.nodeKey)

    const landmarks = territoryNode?.landmarks ?? []
    const nearestLandmark = landmarks[Math.floor(Math.random() * landmarks.length)]
    const nearestLandmarkKey = nearestLandmark?.key ?? "dustercreek"
    const distanceToLandmark = Math.floor(Math.random() * 3) + 3

    const campId = new ObjectId()

    await camps.insertOne({
      _id: campId,
      ownerId: playerId,
      worldId,
      territoryId: territory._id!.toString(),
      name: `${player.username}'s Camp`,
      nearestLandmarkKey,
      distanceToLandmark,
      foodStores: emptyFoodStores(),
      fuelStores: emptyFuelStores(),
      storage: [],
      preferredFood: "raw",
      amenities: { firePit: "burned_out", activeFuelSource: "sticks" },
      suspendJoinRequests: false,
      notoriety: 0,
      money: 0,
      createdAt: now,
      updatedAt: now,
    })

    await npcs.updateOne(
      { _id: playerNpc._id },
      {
        $set: {
          worldId,
          status: "at_camp",
          locationId: campId.toString(),
          locationType: "camp",
          campId: campId.toString(),
          updatedAt: now,
        },
      },
    )

    await players.updateOne({ _id: new ObjectId(playerId) }, { $set: { campId: campId.toString(), updatedAt: now } })

    return reply.status(201).send({ campId: campId.toString(), worldId, npcId: npcId.toString() })
  })
}
