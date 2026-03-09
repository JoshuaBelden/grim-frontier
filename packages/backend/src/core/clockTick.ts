import type { InWorldDate } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { worlds } from "../models/collections.js"

const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const worldDates = new Map<string, InWorldDate>()

/** Returns the current in-world date for a specific world, or undefined if not seeded. */
export function getWorldDate(worldId: string): InWorldDate | undefined {
  return worldDates.get(worldId)
}

/** Sets the in-world date for a specific world. */
export function setWorldDate(worldId: string, date: InWorldDate): void {
  worldDates.set(worldId, date)
}

/** Removes all world dates from the tick loop. */
export function clearAllWorldDates(): void {
  worldDates.clear()
}

function advanceOneHour(date: InWorldDate): InWorldDate {
  let { year, month, day, hour } = date
  hour += 1
  if (hour < 24) return { year, month, day, hour }

  hour = 0
  day += 1
  const daysInMonth = DAYS_PER_MONTH[month - 1]
  if (day <= daysInMonth) return { year, month, day, hour }

  day = 1
  month += 1
  if (month <= 12) return { year, month, day, hour }

  month = 1
  year += 1
  return { year, month, day, hour }
}

/**
 * Starts the game clock tick loop. Advances each active world's clock by one game hour per interval.
 * Clock state is kept in-memory per world. MongoDB is updated as fire-and-forget to avoid
 * blocking the tick when the MongoDB driver hangs in non-Fastify async contexts.
 * @param broadcast Function to push updates to clients connected to a specific world.
 */
export function startClockTick(broadcast: (worldId: string, message: object) => void, intervalMs = 30_000): void {
  setInterval(() => {
    for (const [worldId, date] of worldDates) {
      const nextDate = advanceOneHour(date)
      worldDates.set(worldId, nextDate)
      broadcast(worldId, { type: "clockUpdate", inWorldDate: nextDate })

      // Persist to MongoDB without blocking the tick
      worlds.updateOne({ _id: new ObjectId(worldId) }, { $set: { inWorldDate: nextDate, updatedAt: new Date() } })
    }
  }, intervalMs)
}
