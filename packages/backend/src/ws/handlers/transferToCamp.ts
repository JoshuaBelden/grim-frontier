import type { FoodInventoryItem, FuelInventoryItem, InventoryItem, PurchasedInventoryItem, TransferToCampCommand } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps, npcs } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

/** Moves a stack of items from the NPC's personal inventory back into the player's camp stores. */
export async function handleTransferToCamp(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as TransferToCampCommand

  if (!command.npcId || !command.item || command.item.count < 1) {
    context.send({ type: "error", command: "transferToCamp", message: "Invalid transfer request" })
    return
  }

  let npcObjectId: ObjectId
  try {
    npcObjectId = new ObjectId(command.npcId)
  } catch {
    context.send({ type: "error", command: "transferToCamp", message: "Invalid NPC id" })
    return
  }

  const npc = await npcs.findOne({ _id: npcObjectId })
  if (!npc) {
    context.send({ type: "error", command: "transferToCamp", message: "NPC not found" })
    return
  }
  if (npc.ownerId !== context.playerId) {
    context.send({ type: "error", command: "transferToCamp", message: "Not your NPC" })
    return
  }

  const camp = await camps.findOne({ ownerId: context.playerId, worldId: context.worldId })
  if (!camp) {
    context.send({ type: "error", command: "transferToCamp", message: "Camp not found" })
    return
  }

  const { item } = command
  const inventory = npc.inventory ?? []

  const existing = inventory.find(entry => isMatch(entry, item))
  if (!existing || existing.count < item.count) {
    context.send({ type: "error", command: "transferToCamp", message: "Not enough items in NPC inventory" })
    return
  }

  const updatedInventory = deductFromInventory(inventory, item)
  await npcs.updateOne({ _id: npcObjectId }, { $set: { inventory: updatedInventory, updatedAt: new Date() } })

  if (item.type === "food") {
    const foodItem = item as FoodInventoryItem
    await camps.updateOne(
      { _id: camp._id },
      { $inc: { [`foodStores.${foodItem.subtype}.count`]: foodItem.count }, $set: { updatedAt: new Date() } },
    )
  } else if (item.type === "fuel") {
    const fuelItem = item as FuelInventoryItem
    await camps.updateOne(
      { _id: camp._id },
      { $inc: { [`fuelStores.${fuelItem.subtype}`]: fuelItem.count }, $set: { updatedAt: new Date() } },
    )
  } else if (item.type === "purchased") {
    const purchasedItem = item as PurchasedInventoryItem
    const updatedStorage = mergeIntoStorage(camp.storage ?? [], purchasedItem)
    await camps.updateOne({ _id: camp._id }, { $set: { storage: updatedStorage, updatedAt: new Date() } })
  }

  const updatedCamp = await camps.findOne({ _id: camp._id })
  if (updatedCamp) {
    context.broadcast({
      type: "campUpdate",
      campId: camp._id!.toString(),
      foodStores: updatedCamp.foodStores,
      fuelStores: updatedCamp.fuelStores,
      preferredFood: updatedCamp.preferredFood,
      storage: updatedCamp.storage ?? [],
    })
  }

  context.send({ type: "inventoryUpdate", npcId: command.npcId, inventory: updatedInventory })
}

/** Deducts item.count from the matching entry; removes the entry if count reaches zero. */
function deductFromInventory(inventory: InventoryItem[], item: InventoryItem): InventoryItem[] {
  return inventory
    .map(entry => (isMatch(entry, item) ? { ...entry, count: entry.count - item.count } : entry))
    .filter(entry => entry.count > 0)
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
  if (entry.type === "purchased" && incoming.type === "purchased") {
    return entry.name === incoming.name
  }
  return false
}

/** Merges a purchased item into the camp storage array, incrementing count if a match exists. */
function mergeIntoStorage(storage: PurchasedInventoryItem[], incoming: PurchasedInventoryItem): PurchasedInventoryItem[] {
  const existing = storage.find(entry => entry.name === incoming.name)
  if (existing) {
    return storage.map(entry => (entry.name === incoming.name ? { ...entry, count: entry.count + incoming.count } : entry))
  }
  return [...storage, { ...incoming }]
}
