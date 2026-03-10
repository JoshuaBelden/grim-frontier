import type { WorldMapEvent } from "@grim-frontier/shared"
import { writable } from "svelte/store"

/** Territory map data pushed by the server in response to a getWorldMap command. */
export const worldMapStore = writable<WorldMapEvent["territory"] | null>(null)
