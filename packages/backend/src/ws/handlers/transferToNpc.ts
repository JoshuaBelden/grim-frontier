import type { FoodInventoryItem, FuelInventoryItem, InventoryItem, TransferToNpcCommand } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps, npcs } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

/** Moves a stack of items from the player's camp stores into the NPC's personal inventory. */
export async function handleTransferToNpc(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as TransferToNpcCommand

  if (!command.npcId || !command.item || command.item.count < 1) {
    context.send({ type: "error", command: "transferToNpc", message: "Invalid transfer request" })
    return
  }

  let npcObjectId: ObjectId
  try {
    npcObjectId = new ObjectId(command.npcId)
  } catch {
    context.send({ type: "error", command: "transferToNpc", message: "Invalid NPC id" })
    return
  }

  const npc = await npcs.findOne({ _id: npcObjectId })
  if (!npc) {
    context.send({ type: "error", command: "transferToNpc", message: "NPC not found" })
    return
  }
  if (npc.ownerId !== context.playerId) {
    context.send({ type: "error", command: "transferToNpc", message: "Not your NPC" })
    return
  }

  const camp = await camps.findOne({ ownerId: context.playerId, worldId: context.worldId })
  if (!camp) {
    context.send({ type: "error", command: "transferToNpc", message: "Camp not found" })
    return
  }

  const { item } = command

  if (item.type === "food") {
    const foodItem = item as FoodInventoryItem
    const available = camp.foodStores[foodItem.subtype].count
    if (available < foodItem.count) {
      context.send({ type: "error", command: "transferToNpc", message: "Not enough food in camp" })
      return
    }
    await camps.updateOne(
      { _id: camp._id },
      { $inc: { [`foodStores.${foodItem.subtype}.count`]: -foodItem.count }, $set: { updatedAt: new Date() } },
    )
  } else if (item.type === "fuel") {
    const fuelItem = item as FuelInventoryItem
    const available = camp.fuelStores[fuelItem.subtype]
    if (available < fuelItem.count) {
      context.send({ type: "error", command: "transferToNpc", message: "Not enough fuel in camp" })
      return
    }
    await camps.updateOne(
      { _id: camp._id },
      { $inc: { [`fuelStores.${fuelItem.subtype}`]: -fuelItem.count }, $set: { updatedAt: new Date() } },
    )
  } else {
    context.send({ type: "error", command: "transferToNpc", message: "Unknown item type" })
    return
  }

  const updatedInventory = mergeIntoInventory(npc.inventory ?? [], item)
  await npcs.updateOne({ _id: npcObjectId }, { $set: { inventory: updatedInventory, updatedAt: new Date() } })

  const updatedCamp = await camps.findOne({ _id: camp._id })
  if (updatedCamp) {
    context.broadcast({
      type: "campUpdate",
      campId: camp._id!.toString(),
      foodStores: updatedCamp.foodStores,
      fuelStores: updatedCamp.fuelStores,
      preferredFood: updatedCamp.preferredFood,
    })
  }

  context.send({ type: "inventoryUpdate", npcId: command.npcId, inventory: updatedInventory })
}

/** Adds an item stack to an existing inventory, merging with a matching entry if one exists. */
function mergeIntoInventory(inventory: InventoryItem[], incoming: InventoryItem): InventoryItem[] {
  const existing = inventory.find(entry => isMatch(entry, incoming))
  if (existing) {
    return inventory.map(entry => (isMatch(entry, incoming) ? { ...entry, count: entry.count + incoming.count } : entry))
  }
  return [...inventory, { ...incoming }]
}

/** Returns true when two inventory entries represent the same item slot. */
function isMatch(entry: InventoryItem, incoming: InventoryItem): boolean {
  if (entry.type !== incoming.type) return false
  if (entry.type === "food" && incoming.type === "food") {
    return entry.subtype === incoming.subtype && entry.quality === incoming.quality
  }
  if (entry.type === "fuel" && incoming.type === "fuel") {
    return entry.subtype === incoming.subtype
  }
  return false
}
