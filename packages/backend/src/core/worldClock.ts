import type { InWorldDate, WorldWeather } from "@grim-frontier/shared"
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
  private worldWeather = new Map<string, WorldWeather>()
  private hourlyUpdater: HourlyUpdater[] = []
  private intervalHandle: ReturnType<typeof setInterval> | null = null
  private broadcastFn: ((worldId: string, message: object) => void) | null = null
  private intervalMs: number = 0

  get isRunning(): boolean {
    return this.intervalHandle !== null
  }

  getDate(worldId: string): InWorldDate | undefined {
    return this.worldDates.get(worldId)
  }

  setDate(worldId: string, date: InWorldDate): void {
    this.worldDates.set(worldId, date)
  }

  getWeather(worldId: string): WorldWeather | undefined {
    return this.worldWeather.get(worldId)
  }

  setWeather(worldId: string, weather: WorldWeather): void {
    this.worldWeather.set(worldId, weather)
  }

  clearAll(): void {
    this.worldDates.clear()
    this.worldWeather.clear()
  }

  registerHourlyUpdater(hourlyUpdater: HourlyUpdater): void {
    this.hourlyUpdater.push(hourlyUpdater)
  }

  /**
   * Starts the game clock tick loop. No-op if already running.
   * @param broadcast Function to push updates to clients connected to a specific world.
   */
  start(broadcast: (worldId: string, message: object) => void, intervalMs: number): void {
    if (this.intervalHandle !== null) return

    this.broadcastFn = broadcast
    this.intervalMs = intervalMs
    this.intervalHandle = setInterval(async () => {
      for (const [worldId, date] of this.worldDates) {
        const nextDate = this.advanceOneHour(date)
        this.worldDates.set(worldId, nextDate)
        broadcast(worldId, { type: "clockUpdate", inWorldDate: nextDate, weather: this.worldWeather.get(worldId) })

        // Persist to MongoDB without blocking the tick
        worlds.updateOne({ _id: new ObjectId(worldId) }, { $set: { inWorldDate: nextDate, updatedAt: new Date() } })

        for (const hourlyUpdater of this.hourlyUpdater) {
          await hourlyUpdater(worldId, nextDate, broadcast)
        }
      }
    }, intervalMs)
  }

  /** Pauses the tick loop. State is preserved — call start() to resume. No-op if not running. */
  pause(): void {
    if (this.intervalHandle === null) return
    clearInterval(this.intervalHandle)
    this.intervalHandle = null
  }

  /** Resumes the tick loop using the broadcast function and interval from the last start() call. */
  resume(): void {
    if (this.broadcastFn === null || this.intervalMs === 0) return
    this.start(this.broadcastFn, this.intervalMs)
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
