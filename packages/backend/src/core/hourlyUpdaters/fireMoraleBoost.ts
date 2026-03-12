import type { InWorldDate } from "@grim-frontier/shared"
import { camps, npcs } from "../../models/collections.js"

export async function fireMoraleBoost(
  worldId: string,
  newDate: InWorldDate,
  broadcast: (worldId: string, message: object) => void,
): Promise<void> {
  const litCamps = await camps.find({ worldId, "amenities.firePit": "lit" }).toArray()

  for (const camp of litCamps) {
    const campId = camp._id!.toString()
    const campNpcs = await npcs
      .find({ $or: [{ campId }, { locationId: campId, locationType: "camp" }] })
      .toArray()

    const now = new Date()

    for (const npc of campNpcs) {
      if (npc.morale >= 10) continue

      const newMorale = Math.min(10, npc.morale + 1)
      await npcs.updateOne({ _id: npc._id }, { $set: { morale: newMorale, updatedAt: now } })
      broadcast(worldId, { type: "npcUpdate", npcId: npc._id!.toString(), morale: newMorale })
    }
  }
}
