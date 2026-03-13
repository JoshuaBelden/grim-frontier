import { ObjectId } from "mongodb"
import { camps, npcs, players, towns } from "../../models/collections.js"
import { findDistance } from "../../core/routeDistance.js"
import { toAbsoluteHour } from "../../core/drifterActions/travelAction.js"
import type { HandlerContext } from "./index.js"

const WALKING_SPEED_MPH = 3

/** Handles a player request to send their NPC from a town back to camp. */
export async function handleReturnToCamp(context: HandlerContext): Promise<void> {
  const player = await players.findOne({ _id: new ObjectId(context.playerId) })
  if (!player) {
    context.send({ type: "error", command: "returnToCamp", message: "Player not found" })
    return
  }

  const camp = await camps.findOne({ _id: new ObjectId(player.campId!), ownerId: context.playerId })
  if (!camp) {
    context.send({ type: "error", command: "returnToCamp", message: "No camp found" })
    return
  }

  const npc = await npcs.findOne({ campId: camp._id!.toString(), ownerId: context.playerId })
  if (!npc) {
    context.send({ type: "error", command: "returnToCamp", message: "No NPC found" })
    return
  }

  if (npc.status !== "in_town") {
    context.send({ type: "error", command: "returnToCamp", message: "NPC is not in a town" })
    return
  }

  const currentTown = await towns.findOne({ _id: new ObjectId(npc.locationId!) })
  if (!currentTown) {
    context.send({ type: "error", command: "returnToCamp", message: "Current town not found" })
    return
  }

  // Calculate distance: town → nearest camp landmark + camp offset
  let totalDistance = camp.distanceToLandmark
  let routeName = `${currentTown.name} to ${camp.name}`

  if (currentTown.nodeKey !== camp.nearestLandmarkKey) {
    const route = findDistance(currentTown.nodeKey, camp.nearestLandmarkKey)
    if (!route) {
      context.send({ type: "error", command: "returnToCamp", message: "No route to camp" })
      return
    }
    totalDistance += route.distance
    routeName = route.routeName
  }

  const currentDate = context.clock.getDate(context.worldId)
  if (!currentDate) {
    context.send({ type: "error", command: "returnToCamp", message: "World clock not running" })
    return
  }

  const travelHours = Math.ceil(totalDistance / WALKING_SPEED_MPH)
  const departedHour = toAbsoluteHour(currentDate)

  const travelState = {
    fromLandmarkKey: currentTown.nodeKey,
    toLandmarkKey: camp.nearestLandmarkKey,
    routeName,
    departedHour,
    arrivalHour: departedHour + travelHours,
    distanceMiles: totalDistance,
    returningToCamp: true,
  }

  await npcs.updateOne(
    { _id: npc._id },
    {
      $set: {
        status: "travelling" as const,
        travelState,
        updatedAt: new Date(),
      },
      $unset: { locationId: "", locationType: "", currentAction: "" },
    },
  )

  context.send({
    type: "playerTravelStarted",
    travelState,
    destinationName: camp.name,
  })

  console.log(`[travel] ${npc.name} returning to camp ${camp.name} (${totalDistance} mi, ${travelHours}h)`)
}
