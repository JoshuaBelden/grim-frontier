import type { TravelToTownCommand } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps, npcs, players, towns } from "../../models/collections.js"
import { findDistance } from "../../core/routeDistance.js"
import { toAbsoluteHour } from "../../core/drifterActions/travelAction.js"
import type { HandlerContext } from "./index.js"

const WALKING_SPEED_MPH = 3

/** Handles a player request to send their NPC from camp to a town. */
export async function handleTravelToTown(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as TravelToTownCommand
  const player = await players.findOne({ _id: new ObjectId(context.playerId) })
  if (!player) {
    context.send({ type: "error", command: "travelToTown", message: "Player not found" })
    return
  }

  const camp = await camps.findOne({ _id: new ObjectId(player.campId!), ownerId: context.playerId })
  if (!camp) {
    context.send({ type: "error", command: "travelToTown", message: "No camp found" })
    return
  }

  // Check the player's NPC is at camp and not already travelling
  const campIdStr = camp._id!.toString()
  const npc = await npcs.findOne({ campId: campIdStr, ownerId: context.playerId })
  if (!npc) {
    context.send({ type: "error", command: "travelToTown", message: "No NPC found" })
    return
  }

  if (npc.status === "travelling") {
    context.send({ type: "error", command: "travelToTown", message: "NPC is already travelling" })
    return
  }

  if (npc.status !== "at_camp" && npc.status !== "in_town") {
    context.send({ type: "error", command: "travelToTown", message: "NPC cannot travel right now" })
    return
  }

  const town = await towns.findOne({ _id: new ObjectId(command.townId) })
  if (!town) {
    context.send({ type: "error", command: "travelToTown", message: "Town not found" })
    return
  }

  // Determine origin landmark based on NPC's current location
  let fromLandmarkKey: string
  let totalDistance: number
  let routeName = `to ${town.name}`

  if (npc.status === "in_town" && npc.locationId) {
    // Travelling from a town
    const originTown = await towns.findOne({ _id: new ObjectId(npc.locationId) })
    if (!originTown) {
      context.send({ type: "error", command: "travelToTown", message: "Current town not found" })
      return
    }
    fromLandmarkKey = originTown.nodeKey
    totalDistance = 0
    routeName = `${originTown.name} to ${town.name}`

    if (originTown.nodeKey !== town.nodeKey) {
      const route = findDistance(originTown.nodeKey, town.nodeKey)
      if (!route) {
        context.send({ type: "error", command: "travelToTown", message: "No route to destination" })
        return
      }
      totalDistance = route.distance
      routeName = route.routeName
    }
  } else {
    // Travelling from camp
    fromLandmarkKey = camp.nearestLandmarkKey
    totalDistance = camp.distanceToLandmark
    routeName = `${camp.name} to ${town.name}`

    if (camp.nearestLandmarkKey !== town.nodeKey) {
      const route = findDistance(camp.nearestLandmarkKey, town.nodeKey)
      if (!route) {
        context.send({ type: "error", command: "travelToTown", message: "No route to destination" })
        return
      }
      totalDistance += route.distance
      routeName = route.routeName
    }
  }

  const currentDate = context.clock.getDate(context.worldId)
  if (!currentDate) {
    context.send({ type: "error", command: "travelToTown", message: "World clock not running" })
    return
  }

  const travelHours = Math.ceil(totalDistance / WALKING_SPEED_MPH)
  const departedHour = toAbsoluteHour(currentDate)

  const travelState = {
    fromLandmarkKey,
    toLandmarkKey: town.nodeKey,
    routeName,
    departedHour,
    arrivalHour: departedHour + travelHours,
    distanceMiles: totalDistance,
    returningToCamp: false,
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
    destinationName: town.name,
  })

  console.log(`[travel] ${npc.name} travelling to ${town.name} (${totalDistance} mi, ${travelHours}h)`)
}
