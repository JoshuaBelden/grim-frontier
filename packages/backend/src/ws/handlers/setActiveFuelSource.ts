import type { SetActiveFuelSourceCommand } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

/** Updates the fire pit's active fuel source. */
export async function handleSetActiveFuelSource(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as SetActiveFuelSourceCommand

  let campObjectId: ObjectId
  try {
    campObjectId = new ObjectId(command.campId)
  } catch {
    context.send({ type: "error", command: "setActiveFuelSource", message: "Invalid camp id" })
    return
  }

  const camp = await camps.findOne({ _id: campObjectId })
  if (!camp) {
    context.send({ type: "error", command: "setActiveFuelSource", message: "Camp not found" })
    return
  }
  if (camp.ownerId !== context.playerId) {
    context.send({ type: "error", command: "setActiveFuelSource", message: "Not your camp" })
    return
  }

  await camps.updateOne(
    { _id: campObjectId },
    { $set: { "amenities.activeFuelSource": command.fuelType, updatedAt: new Date() } },
  )

  context.broadcast({
    type: "campUpdate",
    campId: command.campId,
    foodStores: camp.foodStores,
    fuelStores: camp.fuelStores,
    preferredFood: camp.preferredFood,
    amenities: { ...camp.amenities, activeFuelSource: command.fuelType },
  })
}
