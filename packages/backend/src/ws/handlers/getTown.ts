import type { GetTownCommand } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { towns } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

/** Resolves basic detail for a single town. */
export async function handleGetTown(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as GetTownCommand

  let townObjectId: ObjectId
  try {
    townObjectId = new ObjectId(command.townId)
  } catch {
    context.send({ type: "error", command: "getTown", message: "Invalid town id" })
    return
  }

  const town = await towns.findOne({ _id: townObjectId })
  if (!town) {
    context.send({ type: "error", command: "getTown", message: "Town not found" })
    return
  }

  context.send({
    type: "townDetail",
    id: town._id!.toString(),
    name: town.name,
    territoryId: town.territoryId,
  })
}
