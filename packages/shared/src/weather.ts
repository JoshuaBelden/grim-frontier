/** The four seasons of the year. */
export type Season = "spring" | "summer" | "fall" | "winter"

/** Sky condition for the current day. */
export type SkyCondition = "clear" | "partly_cloudy" | "cloudy" | "precipitating"

/** Precipitation sub-type when sky is precipitating. */
export type PrecipitationType = "rain" | "snow" | "thunderstorm"

/** Daily wind intensity. */
export type WindCondition = "calm" | "breezy" | "windy" | "strong_wind"

/** The current weather state for a world, regenerated daily at WEATHER_GENERATION_HOUR. */
export interface WorldWeather {
  season: Season
  highTemp: number
  lowTemp: number
  currentTemp: number
  skyCondition: SkyCondition
  precipitationType: PrecipitationType | null
  windCondition: WindCondition
}

// ---------------------------------------------------------------------------
// Tuning constants
// ---------------------------------------------------------------------------

/** Hour of day (0–23) when daily weather is regenerated. */
export const WEATHER_GENERATION_HOUR = 2

/** Random variance applied to seasonal avg high/low when rolling daily temps. */
export const TEMP_VARIANCE = 6

/** Minimum gap enforced between high and low when low >= high after variance. */
export const MIN_TEMP_SPREAD = 5

/** Maximum gap used when correcting low >= high. */
export const MAX_TEMP_SPREAD = 10

/** Temperature (°F) at or below which precipitation falls as snow. */
export const SNOW_THRESHOLD = 32

/** Temperature (°F) at or above which precipitation becomes a thunderstorm. */
export const THUNDERSTORM_THRESHOLD = 80

/** Seasonal average high and low temperatures (°F). */
export const SEASONAL_TEMPS: Record<Season, { avgHigh: number; avgLow: number }> = {
  winter: { avgHigh: 48, avgLow: 28 },
  spring: { avgHigh: 70, avgLow: 48 },
  summer: { avgHigh: 93, avgLow: 72 },
  fall: { avgHigh: 72, avgLow: 50 },
}

/** Sky condition probability weights per season (must sum to 1). */
export const SEASONAL_SKY_PROBABILITIES: Record<Season, Record<SkyCondition, number>> = {
  winter: { clear: 0.3, partly_cloudy: 0.3, cloudy: 0.25, precipitating: 0.15 },
  spring: { clear: 0.25, partly_cloudy: 0.25, cloudy: 0.25, precipitating: 0.25 },
  summer: { clear: 0.45, partly_cloudy: 0.3, cloudy: 0.15, precipitating: 0.1 },
  fall: { clear: 0.35, partly_cloudy: 0.35, cloudy: 0.2, precipitating: 0.1 },
}

/** Wind condition probability weights (season-independent, must sum to 1). */
export const WIND_PROBABILITIES: Record<WindCondition, number> = {
  calm: 0.4,
  breezy: 0.3,
  windy: 0.2,
  strong_wind: 0.1,
}

/**
 * Hourly temperature curve anchor points (hour → 0–1 factor).
 * Interpolated linearly between defined hours; wraps around midnight.
 */
export const HOURLY_TEMP_CURVE: [number, number][] = [
  [0, 0.15],
  [3, 0.05],
  [6, 0.1],
  [9, 0.35],
  [12, 0.7],
  [15, 1.0],
  [18, 0.75],
  [21, 0.45],
]

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

/** Resolves the season for a given month (1–12). */
export function getSeason(month: number): Season {
  if (month >= 3 && month <= 5) return "spring"
  if (month >= 6 && month <= 8) return "summer"
  if (month >= 9 && month <= 11) return "fall"
  return "winter"
}

/**
 * Returns the temperature interpolation factor (0–1) for a given hour.
 * Linearly interpolates between the anchor points in HOURLY_TEMP_CURVE,
 * wrapping around midnight.
 */
export function getHourlyTempFactor(hour: number): number {
  const curve = HOURLY_TEMP_CURVE
  const wrapped = ((hour % 24) + 24) % 24

  // Find the two surrounding anchor points
  for (let index = 0; index < curve.length; index++) {
    const [anchorHour, anchorFactor] = curve[index]
    if (wrapped === anchorHour) return anchorFactor

    const nextIndex = (index + 1) % curve.length
    const [nextHour, nextFactor] = curve[nextIndex]

    // Handle the wrap-around case (21 → 0)
    const effectiveNextHour = nextHour <= anchorHour ? nextHour + 24 : nextHour
    const effectiveWrapped = wrapped < anchorHour ? wrapped + 24 : wrapped

    if (effectiveWrapped > anchorHour && effectiveWrapped < effectiveNextHour) {
      const progress = (effectiveWrapped - anchorHour) / (effectiveNextHour - anchorHour)
      return anchorFactor + (nextFactor - anchorFactor) * progress
    }
  }

  // Fallback (should not be reached with a valid curve)
  return 0.5
}
