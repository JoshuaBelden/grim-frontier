import type { BuyItemCommand, InventoryItem, PurchasedInventoryItem } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { npcs, stores } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

/** Purchases a single store item, deducting the price from the NPC's money and adding it to their inventory. */
export async function handleBuyItem(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as BuyItemCommand

  if (!command.npcId || !command.storeId || !command.itemName) {
    context.send({ type: "error", command: "buyItem", message: "Invalid buy request" })
    return
  }

  let npcObjectId: ObjectId
  let storeObjectId: ObjectId
  try {
    npcObjectId = new ObjectId(command.npcId)
    storeObjectId = new ObjectId(command.storeId)
  } catch {
    context.send({ type: "error", command: "buyItem", message: "Invalid id" })
    return
  }

  const npc = await npcs.findOne({ _id: npcObjectId })
  if (!npc) {
    context.send({ type: "error", command: "buyItem", message: "NPC not found" })
    return
  }
  if (npc.ownerId !== context.playerId) {
    context.send({ type: "error", command: "buyItem", message: "Not your NPC" })
    return
  }
  if (npc.locationType !== "town") {
    context.send({ type: "error", command: "buyItem", message: "NPC must be in a town to buy" })
    return
  }

  const store = await stores.findOne({ _id: storeObjectId })
  if (!store) {
    context.send({ type: "error", command: "buyItem", message: "Store not found" })
    return
  }

  const storeItem = store.inventory.find(item => item.name === command.itemName)
  if (!storeItem) {
    context.send({ type: "error", command: "buyItem", message: "Item not found in store" })
    return
  }

  const npcMoney = npc.money ?? 0
  if (npcMoney < storeItem.price) {
    context.send({ type: "error", command: "buyItem", message: "Insufficient funds" })
    return
  }

  const updatedInventory = addToInventory(npc.inventory ?? [], storeItem.name, storeItem.traits)
  const spent = Math.round(storeItem.price * 100) / 100

  await npcs.updateOne(
    { _id: npcObjectId },
    { $set: { inventory: updatedInventory, updatedAt: new Date() }, $inc: { money: -spent } },
  )

  const updatedNpc = await npcs.findOne({ _id: npcObjectId })
  const updatedMoney = updatedNpc?.money ?? npcMoney - spent

  context.send({
    type: "buyConfirmed",
    npcId: command.npcId,
    inventory: updatedInventory,
    money: updatedMoney,
    spent,
  })
}

/** Adds one unit of a purchased item to inventory, stacking with an existing entry if present. */
function addToInventory(inventory: InventoryItem[], name: string, traits?: string[]): InventoryItem[] {
  const existingIndex = inventory.findIndex(
    item => item.type === "purchased" && (item as PurchasedInventoryItem).name === name,
  )
  if (existingIndex >= 0) {
    return inventory.map((item, index) => (index === existingIndex ? { ...item, count: item.count + 1 } : item))
  }
  const entry: PurchasedInventoryItem = { type: "purchased", name, count: 1 }
  if (traits && traits.length > 0) entry.traits = traits
  return [...inventory, entry]
}
