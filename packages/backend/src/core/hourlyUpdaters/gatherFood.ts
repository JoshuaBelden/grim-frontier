import type { InWorldDate } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps, npcs } from "../../models/collections.js"

/** Increments camp raw food by 1 for each NPC currently gathering food (no tools = raw quality). */
export async function gatherFood(
  worldId: string,
  newDate: InWorldDate,
  broadcast: (worldId: string, message: object) => void,
): Promise<void> {
  const gatherers = await npcs.find({ worldId, "currentAction.type": "food_gathering" }).toArray()

  if (gatherers.length > 0) {
    const foodByCamp = new Map<string, number>()
    for (const npc of gatherers) {
      const campId = npc.campId ?? npc.locationId
      if (!campId) continue
      foodByCamp.set(campId, (foodByCamp.get(campId) ?? 0) + 1)
    }

    for (const [campId, amount] of foodByCamp) {
      const updated = await camps.findOneAndUpdate(
        { _id: new ObjectId(campId) },
        { $inc: { "foodStores.raw.count": amount }, $set: { updatedAt: new Date() } },
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
