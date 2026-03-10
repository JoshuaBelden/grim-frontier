import type { FastifyInstance } from "fastify"
import { ObjectId } from "mongodb"
import worldTopology from "../core/topology.js"
import { WorldClock } from "../core/worldClock.js"
import { authenticate } from "../middleware/authenticate.js"
import { camps, npcs, players, regions, territories, towns, worlds } from "../models/collections.js"

/** World membership routes — joining an existing world. */
export async function worldRoutes(app: FastifyInstance, opts: { clock: WorldClock }) {
  const { clock } = opts
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

    const playerNpc = await npcs.findOne({ ownerId: playerId, worldId: { $exists: false } })
    if (!playerNpc) {
      return reply.status(409).send({ error: "No available character to join with" })
    }

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

    const now = new Date()
    const campId = new ObjectId()

    await camps.insertOne({
      _id: campId,
      ownerId: playerId,
      worldId,
      territoryId: territory._id!.toString(),
      name: `${player.username}'s Camp`,
      nearestLandmarkKey,
      distanceToLandmark,
      resources: { food: 0, supplies: 5 },
      stability: 50,
      posture: "open",
      reputation: 0,
      wealth: 0,
      notoriety: 0,
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

    const npcId = playerNpc._id!.toString()
    return reply.status(201).send({ campId: campId.toString(), worldId, npcId })
  })

  app.get<{ Params: { id: string } }>("/worlds/:id/map", { preHandler: authenticate }, async (request, reply) => {
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

    const allLandmarks = await towns.find({ territoryId: territory._id!.toString() }).toArray()
    const camp = await camps.findOne({ worldId, ownerId: playerId })

    const territoryNode = worldTopology.regions
      .flatMap(region => region.territories)
      .find(node => node.key === territory.nodeKey)

    const landmarkPositions = new Map(
      (territoryNode?.landmarks ?? []).map(landmark => [landmark.key, landmark.position]),
    )

    return {
      territory: {
        id: territory._id!.toString(),
        name: territory.name,
        landmarks: allLandmarks.map(landmark => ({
          id: landmark._id!.toString(),
          name: landmark.name,
          type: landmark.type ?? "town",
          nodeKey: landmark.nodeKey,
          position: landmarkPositions.get(landmark.nodeKey) ?? { x: 0, y: 0 },
        })),
        connections: territoryNode?.connections ?? [],
        camp: camp
          ? {
              id: camp._id!.toString(),
              name: camp.name,
              nearestLandmarkKey: camp.nearestLandmarkKey,
              distanceToLandmark: camp.distanceToLandmark,
            }
          : null,
      },
    }
  })

  app.get<{ Params: { id: string } }>("/towns/:id", { preHandler: authenticate }, async (request, reply) => {
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
  })

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

  app.get<{ Params: { id: string } }>("/camps/:id", { preHandler: authenticate }, async (request, reply) => {
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

    const campIdStr = camp._id!.toString()
    const campNpcs = await npcs
      .find({ $or: [{ campId: campIdStr }, { locationId: campIdStr, locationType: "camp" }] })
      .toArray()

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
      npcs: campNpcs.map(npc => ({
        id: npc._id!.toString(),
        name: npc.name,
        career: npc.career,
        currentAction: npc.currentAction ?? null,
      })),
    }
  })

  app.post<{ Params: { id: string } }>("/npcs/:id/actions", { preHandler: authenticate }, async (request, reply) => {
    const { playerId } = request.user

    let npcId: ObjectId
    try {
      npcId = new ObjectId(request.params.id)
    } catch {
      return reply.status(400).send({ error: "Invalid NPC id" })
    }

    const npc = await npcs.findOne({ _id: npcId })
    if (!npc) return reply.status(404).send({ error: "NPC not found" })
    if (npc.ownerId !== playerId) return reply.status(403).send({ error: "Not your NPC" })
    if (npc.status !== "at_camp") return reply.status(409).send({ error: "NPC is not at camp" })
    if (npc.currentAction) return reply.status(409).send({ error: "NPC already has an active action" })

    const worldId = npc.worldId
    if (!worldId) return reply.status(409).send({ error: "NPC is not in a world" })

    const currentDate = clock.getDate(worldId)
    if (!currentDate) return reply.status(503).send({ error: "World clock not available" })

    const now = new Date()
    await npcs.updateOne(
      { _id: npcId },
      { $set: { currentAction: { type: "food_gathering", startedAt: currentDate }, updatedAt: now } },
    )

    return reply.status(201).send({ type: "food_gathering", startedAt: currentDate })
  })

  app.delete<{ Params: { id: string } }>("/npcs/:id/actions", { preHandler: authenticate }, async (request, reply) => {
    const { playerId } = request.user

    let npcId: ObjectId
    try {
      npcId = new ObjectId(request.params.id)
    } catch {
      return reply.status(400).send({ error: "Invalid NPC id" })
    }

    const npc = await npcs.findOne({ _id: npcId })
    if (!npc) return reply.status(404).send({ error: "NPC not found" })
    if (npc.ownerId !== playerId) return reply.status(403).send({ error: "Not your NPC" })

    await npcs.updateOne({ _id: npcId }, { $unset: { currentAction: "" }, $set: { updatedAt: new Date() } })

    return reply.status(204).send()
  })
}
