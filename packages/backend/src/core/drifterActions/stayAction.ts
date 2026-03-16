import { isRestingPeriod } from "@grim-frontier/shared"
import { npcs } from "../../models/collections.js"
import type { DrifterAction, DrifterActionContext } from "./types.js"

const REST_ENERGY_RECOVERY = 1

/** NPC stays at the current landmark. Favored by cautious, content, exhausted, or sleepy NPCs during the resting period. */
export const stayAction: DrifterAction = {
  name: "stay",

  async score(context: DrifterActionContext): Promise<number> {
    const { npc, currentDate } = context
    const base = 20

    const exhaustionScore = ((10 - (npc.energy ?? 10)) / 10) * 30
    const lowMoraleScore = ((10 - npc.morale) / 10) * 20
    const cautionScore = ((5 - npc.nature.disposition.courage) / 10) * 15
    const contentScore = ((npc.nature.disposition.contentment + 5) / 10) * 15
    const restingPeriodScore = isRestingPeriod(currentDate.hour) ? 40 : 0

    return Math.max(0, base + exhaustionScore + lowMoraleScore + cautionScore + contentScore + restingPeriodScore)
  },

  async execute(context: DrifterActionContext): Promise<void> {
    const { npc } = context
    const currentEnergy = npc.energy ?? 10
    const newEnergy = Math.min(10, currentEnergy + REST_ENERGY_RECOVERY)

    if (newEnergy !== currentEnergy) {
      await npcs.updateOne({ _id: npc._id }, { $set: { energy: newEnergy, updatedAt: new Date() } })
    }
  },
}
