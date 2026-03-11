import type { InWorldDate, PrecipitationType, SkyCondition, WindCondition, WorldWeather } from "@grim-frontier/shared"
import {
  getHourlyTempFactor,
  getSeason,
  MAX_TEMP_SPREAD,
  MIN_TEMP_SPREAD,
  SEASONAL_SKY_PROBABILITIES,
  SEASONAL_TEMPS,
  SNOW_THRESHOLD,
  TEMP_VARIANCE,
  THUNDERSTORM_THRESHOLD,
  WIND_PROBABILITIES,
} from "@grim-frontier/shared"

/** Returns a random integer in [min, max] inclusive. */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Picks a value from a weighted probability map. */
function weightedPick<T extends string>(weights: Record<T, number>): T {
  const roll = Math.random()
  let cumulative = 0
  for (const [value, weight] of Object.entries(weights) as [T, number][]) {
    cumulative += weight
    if (roll < cumulative) return value
  }
  // Fallback to last entry (rounding edge case)
  const entries = Object.keys(weights) as T[]
  return entries[entries.length - 1]
}

/** Determines precipitation sub-type based on current temperature. */
function resolvePrecipitationType(temperature: number): PrecipitationType {
  if (temperature <= SNOW_THRESHOLD) return "snow"
  if (temperature >= THUNDERSTORM_THRESHOLD) return "thunderstorm"
  return "rain"
}

/** Computes current temperature from daily high/low and the hourly curve factor. */
function computeCurrentTemp(highTemp: number, lowTemp: number, hour: number): number {
  const factor = getHourlyTempFactor(hour)
  return Math.round(lowTemp + (highTemp - lowTemp) * factor)
}

/** Generates a full day's weather state for a world at the given in-world date. */
export function generateDailyWeather(date: InWorldDate): WorldWeather {
  const season = getSeason(date.month)
  const { avgHigh, avgLow } = SEASONAL_TEMPS[season]

  let highTemp = avgHigh + randomInt(-TEMP_VARIANCE, TEMP_VARIANCE)
  let lowTemp = avgLow + randomInt(-TEMP_VARIANCE, TEMP_VARIANCE)

  if (lowTemp >= highTemp) {
    lowTemp = highTemp - randomInt(MIN_TEMP_SPREAD, MAX_TEMP_SPREAD)
  }

  const skyCondition = weightedPick<SkyCondition>(SEASONAL_SKY_PROBABILITIES[season])
  const windCondition = weightedPick<WindCondition>(WIND_PROBABILITIES)
  const currentTemp = computeCurrentTemp(highTemp, lowTemp, date.hour)

  const precipitationType = skyCondition === "precipitating" ? resolvePrecipitationType(currentTemp) : null

  return {
    season,
    highTemp,
    lowTemp,
    currentTemp,
    skyCondition,
    precipitationType,
    windCondition,
  }
}

/** Returns updated weather with recalculated currentTemp and precipitationType for the given hour. */
export function updateHourlyWeather(weather: WorldWeather, hour: number): WorldWeather {
  const currentTemp = computeCurrentTemp(weather.highTemp, weather.lowTemp, hour)
  const precipitationType =
    weather.skyCondition === "precipitating" ? resolvePrecipitationType(currentTemp) : null

  return {
    ...weather,
    currentTemp,
    precipitationType,
  }
}
