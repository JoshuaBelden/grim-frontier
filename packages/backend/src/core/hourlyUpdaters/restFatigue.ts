import type { InWorldDate } from "@grim-frontier/shared"
import { camps, npcs } from "../../models/collections.js"

/** Converts an InWorldDate to a comparable hour count for elapsed-time checks. */
function toTotalHours(date: InWorldDate): number {
  return ((date.year * 12 + date.month) * 30 + date.day) * 24 + date.hour
}

/** Processes rest and fatigue each hour. Resting NPCs recover; idle NPCs accumulate fatigue after 6 hours without rest. */
export async function restFatigue(
  worldId: string,
  newDate: InWorldDate,
  broadcast: (worldId: string, message: object) => void,
): Promise<void> {
  const worldCamps = await camps.find({ worldId }).toArray()

  for (const camp of worldCamps) {
    const campId = camp._id!.toString()
    const campNpcs = await npcs
      .find({ $or: [{ campId }, { locationId: campId, locationType: "camp" }] })
      .toArray()

    if (campNpcs.length === 0) continue

    const now = new Date()
    const currentHours = toTotalHours(newDate)

    for (const npc of campNpcs) {
      const npcId = npc._id!.toString()
      const isResting = npc.currentAction?.type === "resting"

      if (isResting) {
        const newFatigue = Math.max(0, (npc.fatigue ?? 0) - 1)
        const newHealth = Math.min(10, npc.health + 1)

        await npcs.updateOne(
          { _id: npc._id },
          { $set: { fatigue: newFatigue, health: newHealth, lastRestedAt: newDate, updatedAt: now } },
        )

        broadcast(worldId, { type: "npcUpdate", npcId, fatigue: newFatigue, health: newHealth })
        continue
      }

      const lastRestedHours = npc.lastRestedAt ? toTotalHours(npc.lastRestedAt) : 0
      const hoursSinceRest = currentHours - lastRestedHours

      if (hoursSinceRest < 6) continue

      const currentFatigue = npc.fatigue ?? 0
      const newFatigue = Math.min(10, currentFatigue + 1)
      const updates: Record<string, unknown> = { fatigue: newFatigue, updatedAt: now }
      const event: Record<string, string | number> = { type: "npcUpdate", npcId, fatigue: newFatigue }

      if (newFatigue >= 7 && newFatigue <= 8) {
        updates.morale = Math.max(0, npc.morale - 1)
        event.morale = updates.morale as number
      } else if (newFatigue === 9) {
        updates.health = Math.max(0, npc.health - 1)
        updates.morale = Math.max(0, npc.morale - 2)
        event.health = updates.health as number
        event.morale = updates.morale as number
      } else if (newFatigue === 10) {
        updates.health = Math.max(0, npc.health - 2)
        updates.morale = Math.max(0, npc.morale - 3)
        event.health = updates.health as number
        event.morale = updates.morale as number

        if (npc.currentAction) {
          updates.currentAction = null
          broadcast(worldId, { type: "npcActionStopped", npcId })
        }
      }

      await npcs.updateOne({ _id: npc._id }, { $set: updates })
      broadcast(worldId, event)
    }
  }
}
