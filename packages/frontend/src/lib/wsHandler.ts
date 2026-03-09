import type { InWorldDate } from "@grim-frontier/shared"
import { writable } from "svelte/store"
import { campResources } from "./stores/camp"

export const worldClock = writable<InWorldDate | null>(null)

/** Wall-clock timestamp (ms) of when the most recent clockUpdate was received. Used for progress bar animation. */
export const lastClockUpdateAt = writable<number>(0)

export function handleWsMessage(data: unknown): void {
  if (typeof data !== "object" || data === null || !("type" in data)) return

  const message = data as { type: string }

  if (message.type === "clockUpdate") {
    worldClock.set((message as { type: string; inWorldDate: InWorldDate }).inWorldDate)
    lastClockUpdateAt.set(Date.now())
  }

  if (message.type === "campUpdate") {
    const update = message as { type: string; campId: string; resources: { food: number; supplies: number } }
    campResources.set(update.resources)
  }
}
