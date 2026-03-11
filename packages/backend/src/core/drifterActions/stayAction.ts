import { npcs } from "../../models/collections.js"
import type { DrifterAction, DrifterActionContext } from "./types.js"

const REST_FATIGUE_RECOVERY = 1

/** NPC stays at the current landmark. Favored by cautious, content, or fatigued NPCs. */
export const stayAction: DrifterAction = {
  name: "stay",

  async score(context: DrifterActionContext): Promise<number> {
    const { npc } = context
    const base = 20

    const fatigueScore = (npc.fatigue / 10) * 30
    const lowMoraleScore = ((10 - npc.morale) / 10) * 20
    const cautionScore = ((5 - npc.nature.disposition.courage) / 10) * 15
    const contentScore = ((npc.nature.disposition.contentment + 5) / 10) * 15

    return Math.max(0, base + fatigueScore + lowMoraleScore + cautionScore + contentScore)
  },

  async execute(context: DrifterActionContext): Promise<void> {
    const { npc } = context
    const newFatigue = Math.max(0, npc.fatigue - REST_FATIGUE_RECOVERY)

    if (newFatigue !== npc.fatigue) {
      await npcs.updateOne({ _id: npc._id }, { $set: { fatigue: newFatigue, updatedAt: new Date() } })
    }
  },
}
