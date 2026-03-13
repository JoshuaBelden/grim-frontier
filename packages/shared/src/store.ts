/** Classification of a store or business establishment. */
export type StoreType =
  | "general_store"
  | "blacksmith"
  | "saloon"
  | "livery"
  | "gunsmith"
  | "doctor"
  | "hotel"
  | "roadhouse"
  | "butcher"
  | "tailor"
  | "freight"

/** A single item or service available for purchase at a store. */
export interface StoreItem {
  name: string
  price: number
  category: string
  weight?: number
  description?: string
  traits?: string[]
}

/** A store or business establishment within a town. */
export interface Store {
  townId: string
  worldId: string
  name: string
  type: StoreType
  description: string
  proprietor: string
  inventory: StoreItem[]
  createdAt: Date
  updatedAt: Date
}
