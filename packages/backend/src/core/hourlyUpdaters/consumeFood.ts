import type { InWorldDate } from "@grim-frontier/shared"
import { camps, npcs } from "../../models/collections.js"

export async function consumeFood(
  worldId: string,
  newDate: InWorldDate,
  broadcast: (worldId: string, message: object) => void,
): Promise<void> {
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
