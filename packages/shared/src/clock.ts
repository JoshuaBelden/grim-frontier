import type { InWorldDate } from "./world"

/** Tracks the simulation's tick count and in-world time for a given world. */
export interface GameClock {
  worldId: string
  tick: number
  inWorldDate: InWorldDate
  lastTickAt: Date
  createdAt: Date
  updatedAt: Date
}
