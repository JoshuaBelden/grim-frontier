import type { RespondJoinRequestCommand } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { acquaintances, camps, joinRequests, npcs, players } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

const FOOD_PER_PERSON_PER_WEEK = 8

/** Handles a player's accept or decline response to a drifter's join request. */
export async function handleRespondJoinRequest(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as RespondJoinRequestCommand

  let requestObjectId: ObjectId
  try {
    requestObjectId = new ObjectId(command.requestId)
  } catch {
    context.send({ type: "error", command: "respondJoinRequest", message: "Invalid request id" })
    return
  }

  const request = await joinRequests.findOne({ _id: requestObjectId })
  if (!request) {
    context.send({ type: "error", command: "respondJoinRequest", message: "Join request not found" })
    return
  }

  if (request.playerId !== context.playerId) {
    context.send({ type: "error", command: "respondJoinRequest", message: "Not your join request" })
    return
  }

  if (request.status !== "pending") {
    context.send({ type: "error", command: "respondJoinRequest", message: "Request already resolved" })
    return
  }

  const now = new Date()

  if (command.response === "accept") {
    // Re-check capacity
    const camp = await camps.findOne({ _id: new ObjectId(request.campId) })
    if (!camp) {
      context.send({ type: "error", command: "respondJoinRequest", message: "Camp not found" })
      return
    }

    const capacity = Math.floor(camp.resources.food / FOOD_PER_PERSON_PER_WEEK)
    const campIdStr = camp._id!.toString()
    const population = await npcs.countDocuments({
      $or: [{ campId: campIdStr }, { locationId: campIdStr, locationType: "camp" }],
    })

    if (population >= capacity) {
      context.send({ type: "error", command: "respondJoinRequest", message: "Camp is at capacity" })
      return
    }

    // Accept: update NPC, join request, and player
    await npcs.updateOne(
      { _id: new ObjectId(request.npcId) },
      {
        $set: {
          status: "at_camp" as const,
          campId: campIdStr,
          ownerId: context.playerId,
          locationId: campIdStr,
          locationType: "camp" as const,
          updatedAt: now,
        },
      },
    )

    await joinRequests.updateOne({ _id: requestObjectId }, { $set: { status: "accepted", updatedAt: now } })
    await players.updateOne({ _id: new ObjectId(context.playerId) }, { $push: { npcIds: request.npcId } })

    context.send({
      type: "joinRequestResolved",
      requestId: command.requestId,
      npcId: request.npcId,
      response: "accept",
    })

    // Refresh camp detail for the player
    const campNpcs = await npcs
      .find({ $or: [{ campId: campIdStr }, { locationId: campIdStr, locationType: "camp" }] })
      .toArray()

    context.send({
      type: "campDetail",
      id: campIdStr,
      name: camp.name,
      ownerId: camp.ownerId,
      resources: camp.resources,
      amenities: camp.amenities ?? { firePit: "burned_out" },
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
    })
  } else {
    // Decline: update join request, create acquaintance, NPC stays drifting
    await joinRequests.updateOne({ _id: requestObjectId }, { $set: { status: "declined", updatedAt: now } })

    await acquaintances.insertOne({
      worldId: context.worldId,
      playerId: context.playerId,
      npcId: request.npcId,
      npcName: request.npcName,
      npcCareer: request.npcCareer,
      declinedAt: now,
    })

    context.send({
      type: "joinRequestResolved",
      requestId: command.requestId,
      npcId: request.npcId,
      response: "decline",
    })
  }
}
