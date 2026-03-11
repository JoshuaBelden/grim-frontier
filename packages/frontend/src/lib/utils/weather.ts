import type { WorldWeather } from "@grim-frontier/shared"

const SKY_LABELS: Record<string, string> = {
  clear: "Clear",
  partly_cloudy: "Partly Cloudy",
  cloudy: "Cloudy",
  precipitating: "Precipitating",
}

const PRECIPITATION_LABELS: Record<string, string> = {
  rain: "Rain",
  snow: "Snow",
  thunderstorm: "Thunderstorm",
}

const WIND_LABELS: Record<string, string> = {
  calm: "Calm",
  breezy: "Breezy",
  windy: "Windy",
  strong_wind: "Strong Wind",
}

/** Formats a single-line weather report for the header. */
export function formatWeatherReport(weather: WorldWeather): string {
  const temp = `${weather.currentTemp}°F (${weather.lowTemp}°/${weather.highTemp}°)`

  const condition =
    weather.skyCondition === "precipitating" && weather.precipitationType
      ? PRECIPITATION_LABELS[weather.precipitationType]
      : SKY_LABELS[weather.skyCondition]

  const wind = WIND_LABELS[weather.windCondition]

  return `${temp} ${condition} and ${wind}`
}
