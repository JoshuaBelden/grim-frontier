import type { GetTownCommand } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { stores, towns } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

/** Resolves detail for a single town, including its stores. */
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

  const townId = town._id!.toString()
  const townStores = await stores.find({ townId }).toArray()

  context.send({
    type: "townDetail",
    id: townId,
    name: town.name,
    territoryId: town.territoryId,
    stores: townStores.map(store => ({
      id: store._id!.toString(),
      name: store.name,
      type: store.type,
      description: store.description,
      proprietor: store.proprietor,
      inventory: store.inventory,
    })),
  })
}
