import type { SetPreferredFoodCommand } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

/** Updates the camp's preferred food type for nightly consumption. */
export async function handleSetPreferredFood(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as SetPreferredFoodCommand

  let campObjectId: ObjectId
  try {
    campObjectId = new ObjectId(command.campId)
  } catch {
    context.send({ type: "error", command: "setPreferredFood", message: "Invalid camp id" })
    return
  }

  const camp = await camps.findOne({ _id: campObjectId })
  if (!camp) {
    context.send({ type: "error", command: "setPreferredFood", message: "Camp not found" })
    return
  }
  if (camp.ownerId !== context.playerId) {
    context.send({ type: "error", command: "setPreferredFood", message: "Not your camp" })
    return
  }

  await camps.updateOne(
    { _id: campObjectId },
    { $set: { preferredFood: command.foodType, updatedAt: new Date() } },
  )

  context.broadcast({
    type: "campUpdate",
    campId: command.campId,
    foodStores: camp.foodStores,
    fuelStores: camp.fuelStores,
    preferredFood: command.foodType,
  })
}
