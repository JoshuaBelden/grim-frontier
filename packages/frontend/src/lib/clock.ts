import type { InWorldDate } from "@grim-frontier/shared"

/** Converts an InWorldDate to an absolute hour count for duration comparisons. */
export function toAbsoluteHour(date: InWorldDate): number {
  return ((date.year * 12 + (date.month - 1)) * 31 + (date.day - 1)) * 24 + date.hour
}
