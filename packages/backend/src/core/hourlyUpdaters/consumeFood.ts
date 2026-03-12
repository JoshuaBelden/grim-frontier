import type { FoodStoreType, InWorldDate } from "@grim-frontier/shared"
import { camps, npcs } from "../../models/collections.js"

/** Feeds NPCs at hour 2 each day using the camp's preferred food type. Unfed NPCs gain hunger and suffer cascading penalties. */
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

    const preferredFood: FoodStoreType = camp.preferredFood ?? "raw"
    let remainingFood = camp.foodStores[preferredFood].count
    const now = new Date()

    for (const npc of campNpcs) {
      const npcId = npc._id!.toString()

      if (remainingFood > 0) {
        remainingFood -= 1
        const newHunger = Math.max(0, (npc.hunger ?? 0) - 1)
        const boostsMorale = preferredFood !== "raw"
        const newMorale = boostsMorale ? Math.min(10, npc.morale + 1) : npc.morale
        await npcs.updateOne({ _id: npc._id }, { $set: { hunger: newHunger, morale: newMorale, updatedAt: now } })

        broadcast(worldId, { type: "npcUpdate", npcId, hunger: newHunger, morale: newMorale })
      } else {
        const newHunger = Math.min(10, (npc.hunger ?? 0) + 1)
        const updates: Record<string, number | Date> = { hunger: newHunger, updatedAt: now }
        const event: Record<string, string | number> = { type: "npcUpdate", npcId, hunger: newHunger }

        if (newHunger >= 7 && newHunger <= 8) {
          updates.morale = Math.max(0, npc.morale - 1)
          event.morale = updates.morale
        } else if (newHunger === 9) {
          updates.morale = Math.max(0, npc.morale - 2)
          updates.fatigue = Math.min(10, (npc.fatigue ?? 0) + 1)
          event.morale = updates.morale
          event.fatigue = updates.fatigue
        } else if (newHunger === 10) {
          updates.health = Math.max(0, npc.health - 1)
          updates.morale = Math.max(0, npc.morale - 3)
          updates.fatigue = Math.min(10, (npc.fatigue ?? 0) + 2)
          event.health = updates.health
          event.morale = updates.morale
          event.fatigue = updates.fatigue
        }

        await npcs.updateOne({ _id: npc._id }, { $set: updates })
        broadcast(worldId, event)
      }
    }

    const foodPath = `foodStores.${preferredFood}.count`
    await camps.updateOne(
      { _id: camp._id },
      { $set: { [foodPath]: remainingFood, updatedAt: now } },
    )

    const updatedCamp = await camps.findOne({ _id: camp._id })
    if (updatedCamp) {
      broadcast(worldId, {
        type: "campUpdate",
        campId,
        foodStores: updatedCamp.foodStores,
        fuelStores: updatedCamp.fuelStores,
        preferredFood: updatedCamp.preferredFood,
      })
    }
  }
}
