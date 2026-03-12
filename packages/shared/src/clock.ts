import type { InWorldDate } from "./world"

/** Real-time duration of one game hour in milliseconds. Change this to speed up or slow down the simulation. */
export const GAME_HOUR_INTERVAL_MS = 30_000

/** Returns true if the given hour falls within the NPC resting period (9 PM through 4 AM). */
export function isRestingPeriod(hour: number): boolean {
  return hour >= 21 || hour < 4
}

/** Tracks the simulation's tick count and in-world time for a given world. */
export interface GameClock {
  worldId: string
  tick: number
  inWorldDate: InWorldDate
  lastTickAt: Date
  createdAt: Date
  updatedAt: Date
}
