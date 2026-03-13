import type { FoodInventoryItem, FuelInventoryItem, InventoryItem, SellItemsCommand } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { npcs, stores } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

const SELL_RATES: { food_raw: number; fuel_sticks: number } = {
  food_raw: 0.03,
  fuel_sticks: 0.02,
}

/** Sells sellable items from the NPC's inventory to a general store, adding the proceeds to the NPC's money. */
export async function handleSellItems(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as SellItemsCommand

  if (!command.npcId || !command.storeId || !Array.isArray(command.items) || command.items.length === 0) {
    context.send({ type: "error", command: "sellItems", message: "Invalid sell request" })
    return
  }

  let npcObjectId: ObjectId
  let storeObjectId: ObjectId
  try {
    npcObjectId = new ObjectId(command.npcId)
    storeObjectId = new ObjectId(command.storeId)
  } catch {
    context.send({ type: "error", command: "sellItems", message: "Invalid id" })
    return
  }

  const npc = await npcs.findOne({ _id: npcObjectId })
  if (!npc) {
    context.send({ type: "error", command: "sellItems", message: "NPC not found" })
    return
  }
  if (npc.ownerId !== context.playerId) {
    context.send({ type: "error", command: "sellItems", message: "Not your NPC" })
    return
  }
  if (npc.locationType !== "town") {
    context.send({ type: "error", command: "sellItems", message: "NPC must be in a town to sell" })
    return
  }

  const store = await stores.findOne({ _id: storeObjectId })
  if (!store) {
    context.send({ type: "error", command: "sellItems", message: "Store not found" })
    return
  }
  if (store.type !== "general_store") {
    context.send({ type: "error", command: "sellItems", message: "Can only sell at a general store" })
    return
  }

  let earned = 0
  const soldKeys = new Set<string>()

  for (const item of command.items) {
    if (item.type === "food") {
      const foodItem = item as FoodInventoryItem
      if (foodItem.subtype === "raw") {
        earned += foodItem.count * SELL_RATES.food_raw
        soldKeys.add(`food_raw_${foodItem.quality}`)
      }
    } else if (item.type === "fuel") {
      const fuelItem = item as FuelInventoryItem
      if (fuelItem.subtype === "sticks") {
        earned += fuelItem.count * SELL_RATES.fuel_sticks
        soldKeys.add("fuel_sticks")
      }
    }
  }

  earned = Math.round(earned * 100) / 100

  if (earned === 0) {
    context.send({ type: "error", command: "sellItems", message: "No sellable items" })
    return
  }

  const updatedInventory = removeFromInventory(npc.inventory ?? [], command.items)

  await npcs.updateOne(
    { _id: npcObjectId },
    { $set: { inventory: updatedInventory, updatedAt: new Date() }, $inc: { money: earned } },
  )

  const updatedNpc = await npcs.findOne({ _id: npcObjectId })
  const updatedMoney = updatedNpc?.money ?? earned

  context.send({
    type: "sellConfirmed",
    npcId: command.npcId,
    inventory: updatedInventory,
    money: updatedMoney,
    earned,
  })
}

/** Subtracts sold items from inventory, dropping entries that reach zero. */
function removeFromInventory(inventory: InventoryItem[], sold: InventoryItem[]): InventoryItem[] {
  let result = [...inventory]
  for (const soldItem of sold) {
    if (!isSellable(soldItem)) continue
    result = result
      .map(entry => {
        if (!itemsMatch(entry, soldItem)) return entry
        return { ...entry, count: entry.count - soldItem.count }
      })
      .filter(entry => entry.count > 0)
  }
  return result
}

/** Returns true if the item is one that can be sold. */
function isSellable(item: InventoryItem): boolean {
  if (item.type === "food") return (item as FoodInventoryItem).subtype === "raw"
  if (item.type === "fuel") return (item as FuelInventoryItem).subtype === "sticks"
  return false
}

/** Returns true when two inventory entries represent the same item slot. */
function itemsMatch(entry: InventoryItem, other: InventoryItem): boolean {
  if (entry.type !== other.type) return false
  if (entry.type === "food" && other.type === "food") {
    return entry.subtype === other.subtype && entry.quality === other.quality
  }
  if (entry.type === "fuel" && other.type === "fuel") {
    return entry.subtype === other.subtype
  }
  return false
}
