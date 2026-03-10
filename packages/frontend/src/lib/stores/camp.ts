import type { CampDetailEvent } from "@grim-frontier/shared"
import { writable } from "svelte/store"

/** Full camp detail pushed by the server, including resources and NPC roster. */
export const campDetailStore = writable<CampDetailEvent | null>(null)
