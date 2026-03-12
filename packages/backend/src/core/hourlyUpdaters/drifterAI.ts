import type { InWorldDate, LandmarkNode, TopologyConnection } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps, joinRequests, npcs, towns } from "../../models/collections.js"
import topology from "../topology.js"
import { drifterActions, type DrifterActionContext, type NpcDocument } from "../drifterActions/index.js"
import { toAbsoluteHour } from "../drifterActions/travelAction.js"

/** Resolves the topology landmark for a Town document's nodeKey. */
function findLandmarkByKey(nodeKey: string): LandmarkNode | null {
  for (const region of topology.regions) {
    for (const territory of region.territories) {
      for (const landmark of territory.landmarks) {
        if (landmark.key === nodeKey) return landmark
      }
    }
  }
  return null
}

/** Finds all topology connections from a given landmark key. */
function findConnections(landmarkKey: string): Array<{ landmark: LandmarkNode; connection: TopologyConnection }> {
  const results: Array<{ landmark: LandmarkNode; connection: TopologyConnection }> = []

  for (const region of topology.regions) {
    for (const territory of region.territories) {
      for (const connection of territory.connections) {
        let targetKey: string | null = null
        if (connection.from === landmarkKey) targetKey = connection.to
        else if (connection.to === landmarkKey) targetKey = connection.from

        if (targetKey) {
          const landmark = territory.landmarks.find(landmark => landmark.key === targetKey)
          if (landmark) results.push({ landmark, connection })
        }
      }
    }
  }

  return results
}

/** Phase 1: Process arriving NPCs whose travel is complete. */
async function processArrivals(worldId: string, currentDate: InWorldDate): Promise<void> {
  const travellers = await npcs.find({ worldId, status: "travelling", ownerId: { $exists: false } }).toArray()
  if (travellers.length === 0) return

  const currentHour = toAbsoluteHour(currentDate)

  for (const npc of travellers) {
    if (!npc.travelState) continue
    if (currentHour < npc.travelState.arrivalHour) continue

    // Resolve destination town document
    const destinationTown = await towns.findOne({ nodeKey: npc.travelState.toLandmarkKey })
    if (!destinationTown) continue

    await npcs.updateOne(
      { _id: npc._id },
      {
        $set: {
          status: "drifting" as const,
          locationId: destinationTown._id!.toString(),
          locationType: "town" as const,
          updatedAt: new Date(),
        },
        $unset: { travelState: "" },
      },
    )

    console.log(`[drifter] ${npc.name} arrived at ${destinationTown.name}`)
  }
}

const FOOD_PER_PERSON_PER_WEEK = 7

/** Phase 2: Remove pending join requests for camps that can no longer accept. */
async function purgeStaleRequests(worldId: string): Promise<void> {
  const pending = await joinRequests.find({ worldId, status: "pending" }).toArray()
  if (pending.length === 0) return

  const campIds = [...new Set(pending.map(request => request.campId))]
  const campDocs = await camps
    .find({ _id: { $in: campIds.map(id => new ObjectId(id)) } })
    .toArray()

  const campById = new Map(campDocs.map(camp => [camp._id!.toString(), camp]))

  for (const request of pending) {
    const camp = campById.get(request.campId)
    if (!camp) {
      await joinRequests.deleteOne({ _id: request._id })
      console.log(`[drifter] purged join request for ${request.npcName} — camp no longer exists`)
      continue
    }

    if (camp.suspendJoinRequests) {
      await joinRequests.deleteOne({ _id: request._id })
      console.log(`[drifter] purged join request for ${request.npcName} — camp "${camp.name}" suspended requests`)
      continue
    }

    const capacity = Math.floor(camp.resources.food / FOOD_PER_PERSON_PER_WEEK)
    const campIdStr = camp._id!.toString()
    const population = await npcs.countDocuments({
      $or: [{ campId: campIdStr }, { locationId: campIdStr, locationType: "camp" }],
    })

    if (population >= capacity) {
      await joinRequests.deleteOne({ _id: request._id })
      console.log(`[drifter] purged join request for ${request.npcName} — camp "${camp.name}" at capacity (${population}/${capacity})`)
    }
  }
}

/** Phase 3: Run utility AI decisions for all idle drifters. */
async function processDecisions(
  worldId: string,
  currentDate: InWorldDate,
  broadcast: (worldId: string, message: object) => void,
): Promise<void> {
  const drifters = await npcs
    .find({ worldId, status: "drifting", ownerId: { $exists: false } })
    .toArray()

  if (drifters.length === 0) return

  // Batch-check which NPCs have pending join requests
  const drifterIds = drifters.map(npc => npc._id!.toString())
  const pendingRequests = await joinRequests
    .find({ npcId: { $in: drifterIds }, status: "pending" })
    .toArray()
  const npcIdsWithPendingRequests = new Set(pendingRequests.map(request => request.npcId))

  for (const npc of drifters) {
    const npcId = npc._id!.toString()

    // Skip NPCs waiting on a join request response
    if (npcIdsWithPendingRequests.has(npcId)) continue

    const context = await buildActionContext(npc, npcId, worldId, broadcast)

    // Score all actions and pick the best
    let bestAction = drifterActions[0]
    let bestScore = -1
    const scores: string[] = []

    for (const action of drifterActions) {
      const score = await action.score(context)
      scores.push(`${action.name}=${score.toFixed(1)}`)
      if (score > bestScore) {
        bestScore = score
        bestAction = action
      }
    }

    const landmarkName = context.currentLandmark?.name ?? "unknown"
    console.log(`[drifter] ${npc.name} at ${landmarkName}: ${scores.join(", ")} → ${bestAction.name}`)

    // Execute the winning action
    await bestAction.execute(context)

    // If the action set travel state with relative hours, convert to absolute
    if (bestAction.name === "travel") {
      const updated = await npcs.findOne({ _id: npc._id })
      if (updated?.travelState && updated.travelState.departedHour === 0) {
        const absoluteDeparture = toAbsoluteHour(currentDate)
        await npcs.updateOne(
          { _id: npc._id },
          {
            $set: {
              "travelState.departedHour": absoluteDeparture,
              "travelState.arrivalHour": absoluteDeparture + updated.travelState.arrivalHour,
            },
          },
        )
      }
    }
  }
}

/** Builds the action context for a drifter NPC at its current location. */
async function buildActionContext(
  npc: NpcDocument,
  npcId: string,
  worldId: string,
  broadcast: (worldId: string, message: object) => void,
): Promise<DrifterActionContext> {
  let currentLandmark: LandmarkNode | null = null
  let connectedLandmarks: Array<{ landmark: LandmarkNode; connection: TopologyConnection }> = []
  const nearbyCamps = []

  if (npc.locationId) {
    const townDoc = await towns.findOne({ _id: new ObjectId(npc.locationId) })
    if (townDoc?.nodeKey) {
      currentLandmark = findLandmarkByKey(townDoc.nodeKey)
      if (currentLandmark) {
        connectedLandmarks = findConnections(currentLandmark.key)

        // Find camps near this landmark
        const campsNearby = await camps.find({ nearestLandmarkKey: currentLandmark.key, worldId }).toArray()
        nearbyCamps.push(...campsNearby)
      }
    }
  }

  return {
    npc,
    npcId,
    worldId,
    currentLandmark,
    connectedLandmarks,
    nearbyCamps,
    broadcast,
  }
}

/** Hourly updater that drives drifting NPC behavior via utility AI. */
export async function drifterAI(
  worldId: string,
  newDate: InWorldDate,
  broadcast: (worldId: string, message: object) => void,
): Promise<void> {
  await processArrivals(worldId, newDate)
  await purgeStaleRequests(worldId)
  await processDecisions(worldId, newDate, broadcast)
}
