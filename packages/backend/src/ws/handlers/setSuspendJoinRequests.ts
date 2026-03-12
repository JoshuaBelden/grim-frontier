import type { SetSuspendJoinRequestsCommand } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

/** Toggles whether a camp automatically declines incoming join requests. */
export async function handleSetSuspendJoinRequests(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as SetSuspendJoinRequestsCommand

  let campObjectId: ObjectId
  try {
    campObjectId = new ObjectId(command.campId)
  } catch {
    context.send({ type: "error", command: "setSuspendJoinRequests", message: "Invalid camp id" })
    return
  }

  const camp = await camps.findOne({ _id: campObjectId })
  if (!camp) {
    context.send({ type: "error", command: "setSuspendJoinRequests", message: "Camp not found" })
    return
  }

  if (camp.ownerId !== context.playerId) {
    context.send({ type: "error", command: "setSuspendJoinRequests", message: "Not your camp" })
    return
  }

  await camps.updateOne({ _id: campObjectId }, { $set: { suspendJoinRequests: command.suspended, updatedAt: new Date() } })

  context.send({
    type: "suspendJoinRequestsUpdate",
    campId: command.campId,
    suspended: command.suspended,
  })
}
