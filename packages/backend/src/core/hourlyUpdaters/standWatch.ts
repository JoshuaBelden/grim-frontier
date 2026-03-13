import type { InWorldDate, PurchasedInventoryItem } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps, npcs } from "../../models/collections.js"

function hasFirearm(inventory: PurchasedInventoryItem[]): boolean {
  return inventory.some(item => item.category === "firearms")
}

/** Increases camp protection for each NPC standing watch, decreases it when no one is watching. */
export async function standWatch(
  worldId: string,
  newDate: InWorldDate,
  broadcast: (worldId: string, message: object) => void,
): Promise<void> {
  const watchers = await npcs.find({ worldId, "currentAction.type": "stand_watch" }).toArray()

  const incrementByCamp = new Map<string, number>()

  for (const npc of watchers) {
    const campId = npc.campId ?? npc.locationId
    if (!campId) continue
    const purchasedItems = npc.inventory.filter((item): item is PurchasedInventoryItem => item.type === "purchased")
    const bonus = hasFirearm(purchasedItems) ? 2 : 1
    incrementByCamp.set(campId, (incrementByCamp.get(campId) ?? 0) + bonus)
  }

  // Apply protection increases for camps with watchers
  for (const [campId, increment] of incrementByCamp) {
    const updated = await camps.findOneAndUpdate(
      { _id: new ObjectId(campId) },
      { $inc: { "amenities.protection": increment }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" },
    )
    if (updated) {
      broadcast(worldId, {
        type: "campUpdate",
        campId,
        foodStores: updated.foodStores,
        fuelStores: updated.fuelStores,
        preferredFood: updated.preferredFood,
        amenities: updated.amenities,
      })
    }
  }

  // Decay protection for camps with no watchers (only if protection > 0)
  const watchedCampIds = [...incrementByCamp.keys()].map(id => new ObjectId(id))
  const decayFilter =
    watchedCampIds.length > 0
      ? { worldId, _id: { $nin: watchedCampIds }, "amenities.protection": { $gt: 0 } }
      : { worldId, "amenities.protection": { $gt: 0 } }

  const decayResults = await camps.find(decayFilter).toArray()

  for (const camp of decayResults) {
    const campId = camp._id!.toString()
    const updated = await camps.findOneAndUpdate(
      { _id: camp._id, "amenities.protection": { $gt: 0 } },
      { $inc: { "amenities.protection": -1 }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" },
    )
    if (updated) {
      broadcast(worldId, {
        type: "campUpdate",
        campId,
        foodStores: updated.foodStores,
        fuelStores: updated.fuelStores,
        preferredFood: updated.preferredFood,
        amenities: updated.amenities,
      })
    }
  }
}
