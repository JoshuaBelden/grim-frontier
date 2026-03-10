import type { StartNpcActionCommand } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { npcs } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

export async function handleStartNpcAction(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as StartNpcActionCommand

  let npcObjectId: ObjectId
  try {
    npcObjectId = new ObjectId(command.npcId)
  } catch {
    context.send({ type: "error", command: "startNpcAction", message: "Invalid NPC id" })
    return
  }

  const npc = await npcs.findOne({ _id: npcObjectId })
  if (!npc) {
    context.send({ type: "error", command: "startNpcAction", message: "NPC not found" })
    return
  }
  if (npc.ownerId !== context.playerId) {
    context.send({ type: "error", command: "startNpcAction", message: "Not your NPC" })
    return
  }
  if (npc.status !== "at_camp") {
    context.send({ type: "error", command: "startNpcAction", message: "NPC is not at camp" })
    return
  }
  if (npc.currentAction) {
    context.send({ type: "error", command: "startNpcAction", message: "NPC already has an active action" })
    return
  }

  const worldId = npc.worldId
  if (!worldId) {
    context.send({ type: "error", command: "startNpcAction", message: "NPC is not in a world" })
    return
  }

  const currentDate = context.clock.getDate(worldId)
  if (!currentDate) {
    context.send({ type: "error", command: "startNpcAction", message: "World clock not available" })
    return
  }

  const action = { type: command.actionType, startedAt: currentDate }

  await npcs.updateOne({ _id: npcObjectId }, { $set: { currentAction: action, updatedAt: new Date() } })

  context.send({ type: "npcActionStarted", npcId: command.npcId, action })
}
