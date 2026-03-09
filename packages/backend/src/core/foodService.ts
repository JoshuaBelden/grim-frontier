import type { InWorldDate } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps, npcs } from "../models/collections.js"

/** Processes food gathering and consumption for all camps in a world each game hour. */
export async function foodHour(
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
        { $inc: { "resources.food": amount }, $set: { updatedAt: new Date() } },
        { returnDocument: "after" },
      )
      if (updated) {
        broadcast(worldId, { type: "campUpdate", campId, resources: updated.resources })
      }
    }
  }

  if (newDate.hour === 2) {
    const worldCamps = await camps.find({ worldId }).toArray()

    for (const camp of worldCamps) {
      const campId = camp._id!.toString()
      const campNpcs = await npcs.find({ $or: [{ campId }, { locationId: campId, locationType: "camp" }] }).toArray()

      const consumption = campNpcs.length
      if (consumption === 0) continue

      const newFood = Math.max(0, camp.resources.food - consumption)

      await camps.updateOne({ _id: camp._id }, { $set: { "resources.food": newFood, updatedAt: new Date() } })

      broadcast(worldId, {
        type: "campUpdate",
        campId,
        resources: { ...camp.resources, food: newFood },
      })
    }
  }
}
