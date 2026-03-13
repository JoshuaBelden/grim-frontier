import type { FoodQuality, FoodStoreType, FuelStoreType } from "./camp"

/** A food item stack in an NPC's personal inventory. */
export interface FoodInventoryItem {
  type: "food"
  subtype: FoodStoreType
  quality: FoodQuality
  count: number
}

/** A fuel item stack in an NPC's personal inventory. */
export interface FuelInventoryItem {
  type: "fuel"
  subtype: FuelStoreType
  count: number
}

/** Discriminated union of all inventory item types. Extend with new members as new item categories are added. */
export type InventoryItem = FoodInventoryItem | FuelInventoryItem
