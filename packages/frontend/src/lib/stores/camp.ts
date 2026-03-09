import { writable } from "svelte/store"

/** Live camp resources, seeded on page load and updated via campUpdate WebSocket events. */
export const campResources = writable<{ food: number; supplies: number } | null>(null)
