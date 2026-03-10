import type { InWorldDate } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { worlds } from "../models/collections.js"

const DAYS_PER_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export type HourlyUpdater = (
  worldId: string,
  newDate: InWorldDate,
  broadcast: (worldId: string, message: object) => void,
) => Promise<void>

/** Manages the in-world clock for all active worlds and dispatches per-hour hooks. */
export class WorldClock {
  private worldDates = new Map<string, InWorldDate>()
  private hourlyUpdater: HourlyUpdater[] = []

  getDate(worldId: string): InWorldDate | undefined {
    return this.worldDates.get(worldId)
  }

  setDate(worldId: string, date: InWorldDate): void {
    this.worldDates.set(worldId, date)
  }

  clearAll(): void {
    this.worldDates.clear()
  }

  registerHourlyUpdater(hourlyUpdater: HourlyUpdater): void {
    this.hourlyUpdater.push(hourlyUpdater)
  }

  /**
   * Starts the game clock tick loop. Advances each active world's clock by one game hour per interval.
   * @param broadcast Function to push updates to clients connected to a specific world.
   */
  start(broadcast: (worldId: string, message: object) => void, intervalMs: number): void {
    setInterval(async () => {
      for (const [worldId, date] of this.worldDates) {
        const nextDate = this.advanceOneHour(date)
        this.worldDates.set(worldId, nextDate)
        broadcast(worldId, { type: "clockUpdate", inWorldDate: nextDate })

        // Persist to MongoDB without blocking the tick
        worlds.updateOne({ _id: new ObjectId(worldId) }, { $set: { inWorldDate: nextDate, updatedAt: new Date() } })

        for (const hourlyUpdater of this.hourlyUpdater) {
          await hourlyUpdater(worldId, nextDate, broadcast)
        }
      }
    }, intervalMs)
  }

  private advanceOneHour(date: InWorldDate): InWorldDate {
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
}
