import type { NpcListItem } from "@grim-frontier/shared"
import { writable } from "svelte/store"

/** Store for the full list of NPCs in the world, populated by the npcList server event. */
export const npcListStore = writable<NpcListItem[]>([])
