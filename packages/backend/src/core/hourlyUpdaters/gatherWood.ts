import type { InWorldDate, PurchasedInventoryItem } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps, npcs } from "../../models/collections.js"

function hasChopWoodTool(inventory: PurchasedInventoryItem[]): boolean {
  return inventory.some(item => item.traits?.includes("Chop Wood"))
}

/** Increments camp fuel by 1 per NPC gathering fuel. NPCs with a chop wood tool collect splitLogs; others collect sticks. */
export async function gatherFuel(
  worldId: string,
  newDate: InWorldDate,
  broadcast: (worldId: string, message: object) => void,
): Promise<void> {
  const gatherers = await npcs.find({ worldId, "currentAction.type": "fuel_gathering" }).toArray()

  if (gatherers.length > 0) {
    const sticksByCamp = new Map<string, number>()
    const logsByCamp = new Map<string, number>()

    for (const npc of gatherers) {
      const campId = npc.campId ?? npc.locationId
      if (!campId) continue
      const purchasedItems = npc.inventory.filter((item): item is PurchasedInventoryItem => item.type === "purchased")
      if (hasChopWoodTool(purchasedItems)) {
        logsByCamp.set(campId, (logsByCamp.get(campId) ?? 0) + 1)
      } else {
        sticksByCamp.set(campId, (sticksByCamp.get(campId) ?? 0) + 1)
      }
    }

    const affectedCampIds = new Set([...sticksByCamp.keys(), ...logsByCamp.keys()])

    for (const campId of affectedCampIds) {
      const inc: Record<string, number> = {}
      if (sticksByCamp.has(campId)) inc["fuelStores.sticks"] = sticksByCamp.get(campId)!
      if (logsByCamp.has(campId)) inc["fuelStores.splitLogs"] = logsByCamp.get(campId)!

      const updated = await camps.findOneAndUpdate(
        { _id: new ObjectId(campId) },
        { $inc: inc, $set: { updatedAt: new Date() } },
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
