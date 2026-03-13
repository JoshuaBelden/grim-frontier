import type { PurchasedInventoryItem } from "./inventory"

/** How a camp presents itself to outsiders. */
export type CampPosture = "open" | "closed" | "aggressive" | "defensive"

/** Whether the camp fire pit is currently burning. */
export type FirePitState = "burned_out" | "lit"

/** Quality tiers of food available to a camp. */
export type FoodQuality = "poor" | "basic" | "good" | "hearty"

/** A single food store entry with count and quality label. */
export interface FoodStoreEntry {
  count: number
  quality: FoodQuality
}

/** Categorized food stores held by a camp. */
export interface FoodStores {
  raw: FoodStoreEntry
  staple: FoodStoreEntry
  fresh: FoodStoreEntry
  prepared: FoodStoreEntry
}

/** The category key for a food store slot. */
export type FoodStoreType = keyof FoodStores

/** Fuel stores held by a camp, measured in units. */
export interface FuelStores {
  sticks: number
  splitLogs: number
  coal: number
  oil: number
}

/** The category key for a fuel store slot. */
export type FuelStoreType = keyof FuelStores

/** Burn efficiency for each fuel type (units of heat per unit consumed). */
export const FUEL_BURN_VALUES: Record<FuelStoreType, number> = {
  sticks: 1,
  splitLogs: 3,
  coal: 8,
  oil: 2,
}

/** Built structures and improvements within a camp. */
export interface Amenities {
  firePit: FirePitState
  activeFuelSource: FuelStoreType
  protection: number
}

/** A player-owned base of operations within a territory. */
export interface Camp {
  ownerId: string // Player id
  worldId: string
  territoryId: string
  name: string
  nearestLandmarkKey: string
  distanceToLandmark: number // miles (3–5)
  foodStores: FoodStores
  fuelStores: FuelStores
  preferredFood: FoodStoreType
  amenities: Amenities
  storage: PurchasedInventoryItem[]
  posture: CampPosture
  suspendJoinRequests: boolean
  reputation: number // 0–100
  wealth: number
  notoriety: number
  createdAt: Date
  updatedAt: Date
}

/** Helper to compute total food across all store categories. */
export function totalFood(stores: FoodStores): number {
  return stores.raw.count + stores.staple.count + stores.fresh.count + stores.prepared.count
}

/** Helper to compute total fuel across all store categories. */
export function totalFuel(stores: FuelStores): number {
  return stores.sticks + stores.splitLogs + stores.coal + stores.oil
}

/** Creates a default empty food stores object. */
export function emptyFoodStores(): FoodStores {
  return {
    raw: { count: 0, quality: "poor" },
    staple: { count: 0, quality: "basic" },
    fresh: { count: 0, quality: "good" },
    prepared: { count: 0, quality: "hearty" },
  }
}

/** Creates a default empty fuel stores object. */
export function emptyFuelStores(): FuelStores {
  return { sticks: 0, splitLogs: 0, coal: 0, oil: 0 }
}
