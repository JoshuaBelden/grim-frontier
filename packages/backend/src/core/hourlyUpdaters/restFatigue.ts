import { totalFood, totalFuel, type Camp, type InWorldDate, type NpcAction } from "@grim-frontier/shared"
import { isRestingPeriod } from "@grim-frontier/shared"
import type { WithId } from "mongodb"
import { camps, npcs } from "../../models/collections.js"

/** Fatigue threshold at which camp NPCs automatically begin resting. */
const AUTO_REST_THRESHOLD = 8

/** Converts an InWorldDate to a comparable hour count for elapsed-time checks. */
function toTotalHours(date: InWorldDate): number {
  return ((date.year * 12 + date.month) * 30 + date.day) * 24 + date.hour
}

/** Computes fatigue recovery per hour based on NPC grit (1–10). Base 1, up to 2 at grit 10. */
function fatigueRecoveryRate(grit: number): number {
  return 1 + (grit - 1) / 9
}

/** Computes health recovery per hour based on NPC strength (1–10). Base 0.5, up to 1.5 at strength 10. */
function healthRecoveryRate(strength: number): number {
  return 0.5 + (strength / 10)
}

/** Chooses food or fuel gathering based on camp resource needs. Prefers whichever resource has fewer days of supply. */
function chooseGatheringAction(camp: WithId<Camp>, npcCount: number): NpcAction["type"] {
  const dailyFoodNeed = Math.max(1, npcCount)
  const dailyFuelNeed = camp.amenities.firePit === "lit" ? 24 : 0
  const foodDaysSupply = dailyFoodNeed > 0 ? totalFood(camp.foodStores) / dailyFoodNeed : Infinity
  const fuelDaysSupply = dailyFuelNeed > 0 ? totalFuel(camp.fuelStores) / dailyFuelNeed : Infinity

  return foodDaysSupply <= fuelDaysSupply ? "food_gathering" : "fuel_gathering"
}

/** Processes rest and fatigue each hour. Resting NPCs recover; idle NPCs accumulate fatigue or auto-assign to gathering. */
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
      const isCurrentlyResting = npc.currentAction?.type === "resting"

      const resting = isRestingPeriod(newDate.hour)

      // Auto-rest: owned NPCs rest during the resting period, stopping any current action
      if (!isCurrentlyResting && npc.ownerId && resting) {
        if (npc.currentAction) {
          broadcast(worldId, { type: "npcActionStopped", npcId })
        }
        await npcs.updateOne(
          { _id: npc._id },
          { $set: { currentAction: { type: "resting", startedAt: newDate }, updatedAt: now } },
        )

        broadcast(worldId, { type: "npcActionStarted", npcId, action: "resting" })
        continue
      }

      // Auto-rest: fatigued camp NPCs stop what they're doing and begin resting
      if (!isCurrentlyResting && npc.fatigue >= AUTO_REST_THRESHOLD) {
        if (npc.currentAction) {
          broadcast(worldId, { type: "npcActionStopped", npcId })
        }
        await npcs.updateOne(
          { _id: npc._id },
          { $set: { currentAction: { type: "resting", startedAt: newDate }, updatedAt: now } },
        )

        broadcast(worldId, { type: "npcActionStarted", npcId, action: "resting" })
        continue
      }

      // Auto-rest or auto-gather: idle unowned camp NPCs with no action
      if (!npc.currentAction && !npc.ownerId) {
        const action = resting ? "resting" : chooseGatheringAction(camp, campNpcs.length)
        await npcs.updateOne(
          { _id: npc._id },
          { $set: { currentAction: { type: action, startedAt: newDate }, updatedAt: now } },
        )

        broadcast(worldId, { type: "npcActionStarted", npcId, action })
        continue
      }

      if (isCurrentlyResting) {
        const grit = npc.characteristics?.grit ?? 5
        const strength = npc.characteristics?.strength ?? 5
        const fatigueRecovery = fatigueRecoveryRate(grit)
        const healthRecovery = healthRecoveryRate(strength)

        const newFatigue = Math.max(0, (npc.fatigue ?? 0) - fatigueRecovery)
        const newHealth = Math.min(10, npc.health + healthRecovery)

        // Round to one decimal to avoid floating-point drift
        const roundedFatigue = Math.round(newFatigue * 10) / 10
        const roundedHealth = Math.round(newHealth * 10) / 10

        // Auto-wake: stop resting once fully recovered; start gathering unless it's the resting period
        const fullyRested = roundedFatigue === 0
        const gatherAction = fullyRested && !resting ? chooseGatheringAction(camp, campNpcs.length) : null
        const updates: Record<string, unknown> = {
          fatigue: roundedFatigue,
          health: roundedHealth,
          lastRestedAt: newDate,
          updatedAt: now,
        }

        if (fullyRested && gatherAction) {
          updates.currentAction = { type: gatherAction, startedAt: newDate }
        }

        await npcs.updateOne({ _id: npc._id }, { $set: updates })

        broadcast(worldId, { type: "npcUpdate", npcId, fatigue: roundedFatigue, health: roundedHealth })

        if (fullyRested && gatherAction) {
          broadcast(worldId, { type: "npcActionStarted", npcId, action: gatherAction })
        }

        continue
      }

      const lastRestedHours = npc.lastRestedAt ? toTotalHours(npc.lastRestedAt) : 0
      const hoursSinceRest = currentHours - lastRestedHours

      if (hoursSinceRest < AUTO_REST_THRESHOLD) continue

      const currentFatigue = npc.fatigue ?? 0
      const newFatigue = Math.min(10, currentFatigue + 1)
      const updates: Record<string, unknown> = { fatigue: newFatigue, updatedAt: now }
      const event: Record<string, string | number> = { type: "npcUpdate", npcId, fatigue: newFatigue }

      if (newFatigue >= 7 && newFatigue <= 8) {
        updates.morale = Math.max(0, npc.morale - 1)
        event.morale = updates.morale as number
      } else if (newFatigue === 9) {
        updates.morale = Math.max(0, npc.morale - 2)
        event.health = updates.health as number
        event.morale = updates.morale as number
      } else if (newFatigue === 10) {
        updates.health = Math.max(0, npc.health - 1)
        updates.morale = Math.max(0, npc.morale - 2)
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
