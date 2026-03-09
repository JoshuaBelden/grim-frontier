import type { InWorldDate } from "@grim-frontier/shared"
import { writable } from "svelte/store"

export const worldClock = writable<InWorldDate | null>(null)

export function handleWsMessage(data: unknown): void {
  if (typeof data !== "object" || data === null || !("type" in data)) return

  const message = data as { type: string }

  if (message.type === "clockUpdate") {
    worldClock.set((message as { type: string; inWorldDate: InWorldDate }).inWorldDate)
  }
}
