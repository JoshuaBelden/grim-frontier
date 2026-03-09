import type { InWorldDate } from "./world"

/** Real-time duration of one game hour in milliseconds. Change this to speed up or slow down the simulation. */
export const GAME_HOUR_INTERVAL_MS = 30_000

/** Tracks the simulation's tick count and in-world time for a given world. */
export interface GameClock {
  worldId: string
  tick: number
  inWorldDate: InWorldDate
  lastTickAt: Date
  createdAt: Date
  updatedAt: Date
}
