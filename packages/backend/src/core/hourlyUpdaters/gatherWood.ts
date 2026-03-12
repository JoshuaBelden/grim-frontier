import type { InWorldDate } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps, npcs } from "../../models/collections.js"

/** Increments camp sticks by 1 for each NPC currently gathering fuel (no tools = sticks). */
export async function gatherFuel(
  worldId: string,
  newDate: InWorldDate,
  broadcast: (worldId: string, message: object) => void,
): Promise<void> {
  const gatherers = await npcs.find({ worldId, "currentAction.type": "fuel_gathering" }).toArray()

  if (gatherers.length > 0) {
    const fuelByCamp = new Map<string, number>()
    for (const npc of gatherers) {
      const campId = npc.campId ?? npc.locationId
      if (!campId) continue
      fuelByCamp.set(campId, (fuelByCamp.get(campId) ?? 0) + 1)
    }

    for (const [campId, amount] of fuelByCamp) {
      const updated = await camps.findOneAndUpdate(
        { _id: new ObjectId(campId) },
        { $inc: { "fuelStores.sticks": amount }, $set: { updatedAt: new Date() } },
        { returnDocument: "after" },
      )
      if (updated) {
        broadcast(worldId, {
          type: "campUpdate",
          campId,
          foodStores: updated.foodStores,
          fuelStores: updated.fuelStores,
          preferredFood: updated.preferredFood,
        })
      }
    }
  }
}
