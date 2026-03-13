import type { TravelToCommand } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps, npcs, players, towns } from "../../models/collections.js"
import { findDistance } from "../../core/routeDistance.js"
import { toAbsoluteHour } from "../../core/drifterActions/travelAction.js"
import type { HandlerContext } from "./index.js"

const WALKING_SPEED_MPH = 3

/** Handles a player request to send their NPC to a town or camp. */
export async function handleTravelTo(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as TravelToCommand
  const player = await players.findOne({ _id: new ObjectId(context.playerId) })
  if (!player) {
    context.send({ type: "error", command: "travelTo", message: "Player not found" })
    return
  }

  const camp = await camps.findOne({ _id: new ObjectId(player.campId!), ownerId: context.playerId })
  if (!camp) {
    context.send({ type: "error", command: "travelTo", message: "No camp found" })
    return
  }

  const campIdStr = camp._id!.toString()
  const npc = await npcs.findOne({ campId: campIdStr, ownerId: context.playerId })
  if (!npc) {
    context.send({ type: "error", command: "travelTo", message: "No NPC found" })
    return
  }

  if (npc.status === "travelling") {
    context.send({ type: "error", command: "travelTo", message: "NPC is already travelling" })
    return
  }

  if (npc.status !== "at_camp" && npc.status !== "in_town") {
    context.send({ type: "error", command: "travelTo", message: "NPC cannot travel right now" })
    return
  }

  // Resolve origin landmark
  let fromLandmarkKey: string
  if (npc.status === "in_town" && npc.locationId) {
    const originTown = await towns.findOne({ _id: new ObjectId(npc.locationId) })
    if (!originTown) {
      context.send({ type: "error", command: "travelTo", message: "Current town not found" })
      return
    }
    fromLandmarkKey = originTown.nodeKey
  } else {
    fromLandmarkKey = camp.nearestLandmarkKey
  }

  // Resolve destination
  let toLandmarkKey: string
  let totalDistance: number
  let routeName: string
  let destinationName: string

  if (command.destinationType === "town") {
    const town = await towns.findOne({ _id: new ObjectId(command.destinationId) })
    if (!town) {
      context.send({ type: "error", command: "travelTo", message: "Town not found" })
      return
    }

    toLandmarkKey = town.nodeKey
    destinationName = town.name

    if (npc.status === "in_town" && npc.locationId) {
      const originTown = await towns.findOne({ _id: new ObjectId(npc.locationId) })
      if (!originTown) {
        context.send({ type: "error", command: "travelTo", message: "Current town not found" })
        return
      }
      routeName = `${originTown.name} to ${town.name}`
      totalDistance = 0
      if (originTown.nodeKey !== town.nodeKey) {
        const route = findDistance(originTown.nodeKey, town.nodeKey)
        if (!route) {
          context.send({ type: "error", command: "travelTo", message: "No route to destination" })
          return
        }
        totalDistance = route.distance
        routeName = route.routeName
      }
    } else {
      routeName = `${camp.name} to ${town.name}`
      totalDistance = camp.distanceToLandmark
      if (camp.nearestLandmarkKey !== town.nodeKey) {
        const route = findDistance(camp.nearestLandmarkKey, town.nodeKey)
        if (!route) {
          context.send({ type: "error", command: "travelTo", message: "No route to destination" })
          return
        }
        totalDistance += route.distance
        routeName = route.routeName
      }
    }
  } else {
    const destination = await camps.findOne({ _id: new ObjectId(command.destinationId) })
    if (!destination) {
      context.send({ type: "error", command: "travelTo", message: "Camp not found" })
      return
    }

    toLandmarkKey = destination.nearestLandmarkKey
    destinationName = destination.name
    totalDistance = destination.distanceToLandmark
    routeName = `to ${destination.name}`

    if (fromLandmarkKey !== destination.nearestLandmarkKey) {
      const route = findDistance(fromLandmarkKey, destination.nearestLandmarkKey)
      if (!route) {
        context.send({ type: "error", command: "travelTo", message: "No route to camp" })
        return
      }
      totalDistance += route.distance
      routeName = route.routeName
    }
  }

  const currentDate = context.clock.getDate(context.worldId)
  if (!currentDate) {
    context.send({ type: "error", command: "travelTo", message: "World clock not running" })
    return
  }

  const travelHours = Math.ceil(totalDistance / WALKING_SPEED_MPH)
  const departedHour = toAbsoluteHour(currentDate)

  const travelState = {
    fromLandmarkKey,
    toLandmarkKey,
    toLocationId: command.destinationId,
    toLocationType: command.destinationType,
    routeName,
    departedHour,
    arrivalHour: departedHour + travelHours,
    distanceMiles: totalDistance,
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
    npcId: npc._id!.toString(),
    travelState,
    destinationName,
  })

  console.log(`[travel] ${npc.name} travelling to ${destinationName} (${totalDistance} mi, ${travelHours}h)`)
}
