import type { GetNpcCommand } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps, npcs, towns } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

/** Resolves full NPC profile detail. */
export async function handleGetNpc(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as GetNpcCommand

  let npcObjectId: ObjectId
  try {
    npcObjectId = new ObjectId(command.npcId)
  } catch {
    context.send({ type: "error", command: "getNpc", message: "Invalid NPC id" })
    return
  }

  const npc = await npcs.findOne({ _id: npcObjectId })
  if (!npc) {
    context.send({ type: "error", command: "getNpc", message: "NPC not found" })
    return
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

  let travelDestination: string | null = null
  if (npc.status === "travelling" && npc.travelState) {
    const destinationTown = await towns.findOne({ nodeKey: npc.travelState.toLandmarkKey })
    travelDestination = destinationTown?.name ?? npc.travelState.toLandmarkKey
  }

  context.send({
    type: "npcDetail",
    id: npc._id!.toString(),
    ownerId: npc.ownerId ?? null,
    worldId: npc.worldId ?? null,
    locationId: npc.locationId ?? null,
    locationType: npc.locationType ?? null,
    locationName,
    travelDestination,
    name: npc.name,
    health: npc.health,
    morale: npc.morale,
    hunger: npc.hunger ?? 0,
    fatigue: npc.fatigue ?? 0,
    lastRestedAt: npc.lastRestedAt ?? null,
    career: npc.career,
    status: npc.status,
    characteristics: npc.characteristics,
    nature: npc.nature,
    traits: npc.traits,
    skills: npc.skills,
    origin: npc.origin,
    inventory: npc.inventory ?? [],
    money: npc.money ?? 0,
  })
}
