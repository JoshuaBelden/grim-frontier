import { acquaintances } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

/** Returns the player's acquaintance ledger of previously declined NPCs. */
export async function handleListAcquaintances(context: HandlerContext): Promise<void> {
  const records = await acquaintances
    .find({ playerId: context.playerId, worldId: context.worldId })
    .sort({ declinedAt: -1 })
    .toArray()

  context.send({
    type: "acquaintanceList",
    acquaintances: records.map(record => ({
      npcId: record.npcId,
      npcName: record.npcName,
      npcCareer: record.npcCareer,
      declinedAt: record.declinedAt.toISOString(),
    })),
  })
}
