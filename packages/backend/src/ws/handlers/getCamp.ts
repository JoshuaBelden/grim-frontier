import type { GetCampCommand } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps, npcs } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

/** Resolves camp detail including resources and NPC roster. */
export async function handleGetCamp(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as GetCampCommand

  let campObjectId: ObjectId
  try {
    campObjectId = new ObjectId(command.campId)
  } catch {
    context.send({ type: "error", command: "getCamp", message: "Invalid camp id" })
    return
  }

  const camp = await camps.findOne({ _id: campObjectId })
  if (!camp) {
    context.send({ type: "error", command: "getCamp", message: "Camp not found" })
    return
  }

  const campIdStr = camp._id!.toString()
  const campNpcs = await npcs
    .find({ $or: [{ campId: campIdStr }, { locationId: campIdStr, locationType: "camp" }] })
    .toArray()

  context.send({
    type: "campDetail",
    id: camp._id!.toString(),
    name: camp.name,
    ownerId: camp.ownerId,
    resources: camp.resources,
    stability: camp.stability,
    posture: camp.posture,
    reputation: camp.reputation,
    wealth: camp.wealth,
    notoriety: camp.notoriety,
    npcs: campNpcs.map(npc => ({
      id: npc._id!.toString(),
      name: npc.name,
      career: npc.career,
      currentAction: npc.currentAction ?? null,
    })),
  })
}
