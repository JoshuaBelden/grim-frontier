import type { InWorldDate } from "@grim-frontier/shared"
import { camps, npcs } from "../../models/collections.js"

/** Feeds NPCs at hour 2 each day. NPCs that eat reset hunger to 10. Unfed NPCs lose hunger, and suffer morale/health loss. */
export async function consumeFood(
  worldId: string,
  newDate: InWorldDate,
  broadcast: (worldId: string, message: object) => void,
): Promise<void> {
  if (newDate.hour !== 2) return

  const worldCamps = await camps.find({ worldId }).toArray()

  for (const camp of worldCamps) {
    const campId = camp._id!.toString()
    const campNpcs = await npcs
      .find({ $or: [{ campId }, { locationId: campId, locationType: "camp" }] })
      .toArray()

    if (campNpcs.length === 0) continue

    let remainingFood = camp.resources.food
    const now = new Date()

    for (const npc of campNpcs) {
      const npcId = npc._id!.toString()

      if (remainingFood > 0) {
        remainingFood -= 1
        await npcs.updateOne({ _id: npc._id }, { $set: { hunger: 10, updatedAt: now } })
      } else {
        const newHunger = Math.max(0, (npc.hunger ?? 10) - 1)
        const updates: Record<string, number | Date> = { hunger: newHunger, updatedAt: now }

        if (newHunger <= 3) {
          updates.morale = Math.max(0, npc.morale - 1)
        }
        if (newHunger === 0) {
          updates.health = Math.max(0, npc.health - 1)
        }

        await npcs.updateOne({ _id: npc._id }, { $set: updates })

        broadcast(worldId, {
          type: "npcUpdate",
          npcId,
          hunger: newHunger,
          ...(updates.morale !== undefined && { morale: updates.morale }),
          ...(updates.health !== undefined && { health: updates.health }),
        })
      }
    }

    await camps.updateOne(
      { _id: camp._id },
      { $set: { "resources.food": remainingFood, updatedAt: now } },
    )

    broadcast(worldId, {
      type: "campUpdate",
      campId,
      resources: { ...camp.resources, food: remainingFood },
    })
  }
}
