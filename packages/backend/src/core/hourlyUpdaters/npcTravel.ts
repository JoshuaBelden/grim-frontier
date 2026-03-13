import type { InWorldDate } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps, npcs, towns } from "../../models/collections.js"
import { toAbsoluteHour } from "../drifterActions/travelAction.js"
import { sendToPlayer } from "../../ws/plugin.js"

/** Processes travel arrivals for player-owned NPCs each game hour. */
export async function npcTravel(
  worldId: string,
  newDate: InWorldDate,
  _broadcast: (worldId: string, message: object) => void,
): Promise<void> {
  const travellingNpcs = await npcs
    .find({ worldId, status: "travelling", ownerId: { $exists: true } })
    .toArray()
  if (travellingNpcs.length === 0) return

  const currentHour = toAbsoluteHour(newDate)

  for (const npc of travellingNpcs) {
    if (!npc.travelState) continue
    if (currentHour < npc.travelState.arrivalHour) continue

    if (npc.travelState.toLocationType === "camp") {
      const camp = await camps.findOne({ _id: new ObjectId(npc.travelState.toLocationId) })
      if (!camp) continue

      const campIdStr = camp._id!.toString()

      await npcs.updateOne(
        { _id: npc._id },
        {
          $set: {
            status: "at_camp" as const,
            locationId: campIdStr,
            locationType: "camp" as const,
            updatedAt: new Date(),
          },
          $unset: { travelState: "" },
        },
      )

      if (npc.ownerId) {
        sendToPlayer(worldId, npc.ownerId, {
          type: "playerTravelArrived",
          npcId: npc._id!.toString(),
          locationId: campIdStr,
          locationName: camp.name,
          locationType: "camp" as const,
        })
      }

      console.log(`[travel] ${npc.name} arrived at camp ${camp.name}`)
    } else {
      const town = await towns.findOne({ _id: new ObjectId(npc.travelState.toLocationId) })
      if (!town) continue

      const townIdStr = town._id!.toString()

      await npcs.updateOne(
        { _id: npc._id },
        {
          $set: {
            status: "in_town" as const,
            locationId: townIdStr,
            locationType: "town" as const,
            updatedAt: new Date(),
          },
          $unset: { travelState: "" },
        },
      )

      if (npc.ownerId) {
        sendToPlayer(worldId, npc.ownerId, {
          type: "playerTravelArrived",
          npcId: npc._id!.toString(),
          locationId: townIdStr,
          locationName: town.name,
          locationType: "town" as const,
        })
      }

      console.log(`[travel] ${npc.name} arrived at ${town.name}`)
    }
  }
}
