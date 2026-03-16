import type { FoodStoreType, InWorldDate } from "@grim-frontier/shared"
import { camps, npcs } from "../../models/collections.js"

/** Feeds NPCs at hour 2 each day using the camp's preferred food type. Unfed NPCs lose sustenance and suffer cascading penalties. */
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
        const newSustenance = Math.min(10, (npc.sustenance ?? 10) + 1)
        const boostsMorale = preferredFood !== "raw"
        const newMorale = boostsMorale ? Math.min(10, npc.morale + 1) : npc.morale
        await npcs.updateOne({ _id: npc._id }, { $set: { sustenance: newSustenance, morale: newMorale, updatedAt: now } })

        broadcast(worldId, { type: "npcUpdate", npcId, sustenance: newSustenance, morale: newMorale })
      } else {
        const newSustenance = Math.max(0, (npc.sustenance ?? 10) - 1)
        const updates: Record<string, number | Date> = { sustenance: newSustenance, updatedAt: now }
        const event: Record<string, string | number> = { type: "npcUpdate", npcId, sustenance: newSustenance }

        if (newSustenance >= 2 && newSustenance <= 3) {
          updates.morale = Math.max(0, npc.morale - 1)
          event.morale = updates.morale
        } else if (newSustenance === 1) {
          updates.morale = Math.max(0, npc.morale - 2)
          updates.energy = Math.max(0, (npc.energy ?? 10) - 1)
          event.morale = updates.morale
          event.energy = updates.energy
        } else if (newSustenance === 0) {
          updates.health = Math.max(0, npc.health - 1)
          updates.morale = Math.max(0, npc.morale - 3)
          updates.energy = Math.max(0, (npc.energy ?? 10) - 2)
          event.health = updates.health
          event.morale = updates.morale
          event.energy = updates.energy
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
