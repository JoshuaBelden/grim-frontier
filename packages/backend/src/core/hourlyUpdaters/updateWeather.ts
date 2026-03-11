import type { InWorldDate } from "@grim-frontier/shared"
import { WEATHER_GENERATION_HOUR } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { worlds } from "../../models/collections.js"
import { generateDailyWeather, updateHourlyWeather } from "../weatherGenerator.js"
import { type WorldClock } from "../worldClock.js"

/** Creates a weather updater bound to a specific WorldClock instance. */
export function createWeatherUpdater(clock: WorldClock) {
  /** Updates weather state each hour. Regenerates daily at WEATHER_GENERATION_HOUR or when weather is missing. */
  return async function updateWeather(
    worldId: string,
    newDate: InWorldDate,
    broadcast: (worldId: string, message: object) => void,
  ): Promise<void> {
    const existing = clock.getWeather(worldId)

    if (newDate.hour === WEATHER_GENERATION_HOUR || !existing) {
      const weather = generateDailyWeather(newDate)
      clock.setWeather(worldId, weather)
      worlds.updateOne({ _id: new ObjectId(worldId) }, { $set: { weather, updatedAt: new Date() } })
    } else {
      const weather = updateHourlyWeather(existing, newDate.hour)
      clock.setWeather(worldId, weather)
      worlds.updateOne(
        { _id: new ObjectId(worldId) },
        { $set: { "weather.currentTemp": weather.currentTemp, "weather.precipitationType": weather.precipitationType, updatedAt: new Date() } },
      )
    }
  }
}
