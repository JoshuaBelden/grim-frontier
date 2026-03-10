import type { InWorldDate } from "@grim-frontier/shared"
import { camps } from "../../models/collections.js"

/** Consumes 1 wood per hour for each camp with a lit fire pit. Extinguishes fire when wood runs out. */
export async function consumeFireWood(
  worldId: string,
  newDate: InWorldDate,
  broadcast: (worldId: string, message: object) => void,
): Promise<void> {
  const litCamps = await camps.find({ worldId, "amenities.firePit": "lit" }).toArray()

  for (const camp of litCamps) {
    const campId = camp._id!.toString()

    if (camp.resources.wood > 0) {
      const newWood = camp.resources.wood - 1
      await camps.updateOne(
        { _id: camp._id },
        { $set: { "resources.wood": newWood, updatedAt: new Date() } },
      )
      broadcast(worldId, {
        type: "campUpdate",
        campId,
        resources: { ...camp.resources, wood: newWood },
      })
    } else {
      await camps.updateOne(
        { _id: camp._id },
        { $set: { "amenities.firePit": "burned_out", updatedAt: new Date() } },
      )
      broadcast(worldId, { type: "firePitUpdate", campId, state: "burned_out" })
    }
  }
}
