import { acquaintances, joinRequests, npcs } from "../../models/collections.js"
import { sendToPlayer } from "../../ws/plugin.js"
import type { CampDocument, DrifterAction, DrifterActionContext } from "./types.js"

const FOOD_PER_PERSON_PER_WEEK = 7
const DESIRABILITY_THRESHOLD = 40

/** Builds a short origin blurb for the join request modal. */
function buildOriginSummary(npc: DrifterActionContext["npc"]): string {
  const { origin, career } = npc
  const originLabel = origin.background.origin.replace("_", " ")
  const familyLabel = origin.background.family
  return `A ${career} from the ${originLabel}, raised in a ${familyLabel} family. ${origin.background.formativeEvent}`
}

/** Scores how desirable a specific camp is to the NPC. */
function scoreCampDesirability(npc: DrifterActionContext["npc"], camp: CampDocument): number {
  // Posture filter
  if (camp.posture === "closed") return 0
  if (camp.posture === "aggressive" && npc.nature.disposition.courage < 3) return 0

  let score = 0

  if (camp.posture === "defensive") score -= 10

  // Camp attributes
  score += Math.min(25, (camp.resources.food / FOOD_PER_PERSON_PER_WEEK) * 5)
  score += (camp.reputation / 100) * 15

  // NPC personality
  score += (npc.hunger / 10) * 20
  score += (npc.fatigue / 10) * 20
  score += ((npc.nature.outlook.trust + 5) / 10) * 10
  score += ((5 - npc.nature.disposition.contentment) / 10) * 10

  return score
}

/** NPC investigates a nearby camp and potentially requests to join. */
export const investigateCampAction: DrifterAction = {
  name: "investigateCamp",

  async score(context: DrifterActionContext): Promise<number> {
    if (context.nearbyCamps.length === 0) {
      console.log(`[drifter] ${context.npc.name} — investigateCamp: no nearby camps`)
      return 0
    }

    // Score based on the best camp available
    let bestScore = 0
    for (const camp of context.nearbyCamps) {
      const campScore = scoreCampDesirability(context.npc, camp)
      console.log(`[drifter] ${context.npc.name} — investigateCamp score for "${camp.name}": ${campScore.toFixed(1)} (posture: ${camp.posture}, food: ${camp.resources.food}, reputation: ${camp.reputation})`)
      if (campScore > bestScore) bestScore = campScore
    }
    return bestScore
  },

  async execute(context: DrifterActionContext): Promise<void> {
    const { npc, npcId, worldId, nearbyCamps } = context

    for (const camp of nearbyCamps) {
      const campId = camp._id!.toString()
      const desirability = scoreCampDesirability(npc, camp)

      if (camp.suspendJoinRequests) {
        console.log(`[drifter] ${npc.name} skipping camp "${camp.name}" — join requests suspended`)
        continue
      }

      if (desirability < DESIRABILITY_THRESHOLD) {
        console.log(`[drifter] ${npc.name} investigated camp "${camp.name}" but found it undesirable (score: ${desirability.toFixed(1)}, threshold: ${DESIRABILITY_THRESHOLD})`)
        continue
      }

      // Check capacity
      const capacity = Math.floor(camp.resources.food / FOOD_PER_PERSON_PER_WEEK)
      const population = await npcs.countDocuments({
        $or: [{ campId }, { locationId: campId, locationType: "camp" }],
      })
      const pendingCount = await joinRequests.countDocuments({ campId, status: "pending" })
      const availableSlots = capacity - population - pendingCount

      if (availableSlots <= 0) {
        console.log(`[drifter] ${npc.name} wants to join camp "${camp.name}" but no capacity (capacity: ${capacity}, population: ${population}, pending: ${pendingCount})`)
        continue
      }

      // Check if already has a pending request or was previously declined by this player
      const existingRequest = await joinRequests.findOne({ npcId, campId, status: "pending" })
      if (existingRequest) {
        console.log(`[drifter] ${npc.name} already has a pending request for camp "${camp.name}"`)
        continue
      }

      const previousDecline = await acquaintances.findOne({ npcId, playerId: camp.ownerId, worldId })
      if (previousDecline) {
        console.log(`[drifter] ${npc.name} was previously declined by camp "${camp.name}", skipping`)
        continue
      }

      // Submit join request
      const originSummary = buildOriginSummary(npc)
      const now = new Date()
      const result = await joinRequests.insertOne({
        worldId,
        npcId,
        campId,
        playerId: camp.ownerId,
        npcName: npc.name,
        npcCareer: npc.career,
        originSummary,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })

      sendToPlayer(worldId, camp.ownerId, {
        type: "joinRequestReceived",
        requestId: result.insertedId.toString(),
        npcName: npc.name,
        npcCareer: npc.career,
        originSummary,
      })

      console.log(`[drifter] ${npc.name} requests to join camp "${camp.name}" (score: ${desirability.toFixed(1)}, owner: ${camp.ownerId})`)

      // Only request one camp per tick
      break
    }
  },
}
