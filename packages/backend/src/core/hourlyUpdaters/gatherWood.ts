import type { InWorldDate } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps, npcs } from "../../models/collections.js"

/** Increments camp wood by 1 for each NPC currently gathering wood. */
export async function gatherWood(
  worldId: string,
  newDate: InWorldDate,
  broadcast: (worldId: string, message: object) => void,
): Promise<void> {
  const gatherers = await npcs.find({ worldId, "currentAction.type": "wood_gathering" }).toArray()

  if (gatherers.length > 0) {
    const woodByCamp = new Map<string, number>()
    for (const npc of gatherers) {
      const campId = npc.campId ?? npc.locationId
      if (!campId) continue
      woodByCamp.set(campId, (woodByCamp.get(campId) ?? 0) + 1)
    }

    for (const [campId, amount] of woodByCamp) {
      const updated = await camps.findOneAndUpdate(
        { _id: new ObjectId(campId) },
        { $inc: { "resources.wood": amount }, $set: { updatedAt: new Date() } },
        { returnDocument: "after" },
      )
      if (updated) {
        broadcast(worldId, { type: "campUpdate", campId, resources: updated.resources })
      }
    }
  }
}
