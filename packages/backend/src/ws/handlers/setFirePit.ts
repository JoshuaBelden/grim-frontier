import type { SetFirePitCommand } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

/** Lights or extinguishes the camp fire pit. */
export async function handleSetFirePit(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as SetFirePitCommand

  let campObjectId: ObjectId
  try {
    campObjectId = new ObjectId(command.campId)
  } catch {
    context.send({ type: "error", command: "setFirePit", message: "Invalid camp id" })
    return
  }

  const camp = await camps.findOne({ _id: campObjectId })
  if (!camp) {
    context.send({ type: "error", command: "setFirePit", message: "Camp not found" })
    return
  }
  if (camp.ownerId !== context.playerId) {
    context.send({ type: "error", command: "setFirePit", message: "Not your camp" })
    return
  }

  const fuelType = camp.amenities?.activeFuelSource ?? "sticks"
  if (command.state === "lit" && (camp.fuelStores?.[fuelType] ?? 0) <= 0) {
    context.send({ type: "error", command: "setFirePit", message: "No fuel available to light a fire" })
    return
  }

  await camps.updateOne(
    { _id: campObjectId },
    { $set: { "amenities.firePit": command.state, updatedAt: new Date() } },
  )

  context.broadcast({ type: "firePitUpdate", campId: command.campId, state: command.state })
}
