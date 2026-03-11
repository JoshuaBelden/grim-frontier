import { joinRequests } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

/** Returns all pending join requests for the player's camp. */
export async function handleListJoinRequests(context: HandlerContext): Promise<void> {
  const pending = await joinRequests
    .find({ playerId: context.playerId, worldId: context.worldId, status: "pending" })
    .toArray()

  context.send({
    type: "joinRequestList",
    requests: pending.map(request => ({
      requestId: request._id!.toString(),
      npcName: request.npcName,
      npcCareer: request.npcCareer,
      originSummary: request.originSummary,
    })),
  })
}
