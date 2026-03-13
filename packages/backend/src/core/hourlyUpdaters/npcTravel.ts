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

    // Check if this NPC is returning to camp
    const camp = npc.campId ? await camps.findOne({ _id: new ObjectId(npc.campId) }) : null
    const isReturningToCamp = camp && npc.travelState.returningToCamp === true

    if (isReturningToCamp) {
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
          townId: campIdStr,
          townName: camp.name,
        })
      }

      console.log(`[travel] ${npc.name} arrived at camp ${camp.name}`)
    } else {
      const destinationTown = await towns.findOne({ nodeKey: npc.travelState.toLandmarkKey })
      if (!destinationTown) continue

      const townIdStr = destinationTown._id!.toString()

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
          townId: townIdStr,
          townName: destinationTown.name,
        })
      }

      console.log(`[travel] ${npc.name} arrived at ${destinationTown.name}`)
    }
  }
}
