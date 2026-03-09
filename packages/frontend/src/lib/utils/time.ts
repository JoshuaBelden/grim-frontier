import type { InWorldDate } from "@grim-frontier/shared"

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`
  const remainder = day % 10
  if (remainder === 1) return `${day}st`
  if (remainder === 2) return `${day}nd`
  if (remainder === 3) return `${day}rd`
  return `${day}th`
}

/** Formats an in-world date for player display, e.g. "September 16th, 1893 6:00AM" */
export function formatInWorldDate(date: InWorldDate): string {
  const month = MONTH_NAMES[date.month - 1]
  const day = ordinal(date.day)
  const period = date.hour < 12 ? "AM" : "PM"
  const displayHour = date.hour === 0 ? 12 : date.hour > 12 ? date.hour - 12 : date.hour
  return `${month} ${day}, ${date.year} ${displayHour}:00${period}`
}
