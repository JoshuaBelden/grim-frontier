/** How a camp presents itself to outsiders. */
export type CampPosture = "open" | "closed" | "aggressive" | "defensive"

/** Whether the camp fire pit is currently burning. */
export type FirePitState = "burned_out" | "lit"

/** Built structures and improvements within a camp. */
export interface Amenities {
  firePit: FirePitState
}

/** Consumable resources held by a camp or task reward. */
export interface Resources {
  food: number
  wood: number
}

/** A player-owned base of operations within a territory. */
export interface Camp {
  ownerId: string // Player id
  worldId: string
  territoryId: string
  name: string
  nearestLandmarkKey: string
  distanceToLandmark: number // miles (3–5)
  resources: Resources
  amenities: Amenities
  posture: CampPosture
  suspendJoinRequests: boolean
  reputation: number // 0–100
  wealth: number
  notoriety: number
  createdAt: Date
  updatedAt: Date
}
