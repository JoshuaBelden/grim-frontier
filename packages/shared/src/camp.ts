/** How a camp presents itself to outsiders. */
export type CampPosture = "open" | "closed" | "aggressive" | "defensive"

/** Consumable resources held by a camp or task reward. */
export interface Resources {
  food: number
  supplies: number
}

/** A player-owned base of operations within a territory. */
export interface Camp {
  ownerId: string // Player id
  worldId: string
  territoryId: string
  name: string
  resources: Resources
  stability: number // 0–100
  posture: CampPosture
  reputation: number // 0–100
  wealth: number
  notoriety: number
  createdAt: Date
  updatedAt: Date
}
