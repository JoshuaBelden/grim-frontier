import { FUEL_BURN_VALUES, type FuelStoreType, type InWorldDate } from "@grim-frontier/shared"
import { camps } from "../../models/collections.js"

/** Consumes 1 unit of the active fuel source per hour for each camp with a lit fire pit. Extinguishes fire when fuel runs out. */
export async function consumeFireWood(
  worldId: string,
  newDate: InWorldDate,
  broadcast: (worldId: string, message: object) => void,
): Promise<void> {
  const litCamps = await camps.find({ worldId, "amenities.firePit": "lit" }).toArray()

  for (const camp of litCamps) {
    const campId = camp._id!.toString()
    const fuelType: FuelStoreType = camp.amenities?.activeFuelSource ?? "sticks"
    const currentAmount = camp.fuelStores?.[fuelType] ?? 0

    if (currentAmount > 0) {
      const newAmount = currentAmount - 1
      const fuelPath = `fuelStores.${fuelType}`
      await camps.updateOne(
        { _id: camp._id },
        { $set: { [fuelPath]: newAmount, updatedAt: new Date() } },
      )
      broadcast(worldId, {
        type: "campUpdate",
        campId,
        foodStores: camp.foodStores,
        fuelStores: { ...camp.fuelStores, [fuelType]: newAmount },
        preferredFood: camp.preferredFood,
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
