import type { StopNpcActionCommand } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { npcs } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

/** Stops the current action on an NPC owned by the requesting player. */
export async function handleStopNpcAction(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as StopNpcActionCommand

  let npcObjectId: ObjectId
  try {
    npcObjectId = new ObjectId(command.npcId)
  } catch {
    context.send({ type: "error", command: "stopNpcAction", message: "Invalid NPC id" })
    return
  }

  const npc = await npcs.findOne({ _id: npcObjectId })
  if (!npc) {
    context.send({ type: "error", command: "stopNpcAction", message: "NPC not found" })
    return
  }
  if (npc.ownerId !== context.playerId) {
    context.send({ type: "error", command: "stopNpcAction", message: "Not your NPC" })
    return
  }

  await npcs.updateOne({ _id: npcObjectId }, { $unset: { currentAction: "" }, $set: { updatedAt: new Date() } })

  context.send({ type: "npcActionStopped", npcId: command.npcId })
}
