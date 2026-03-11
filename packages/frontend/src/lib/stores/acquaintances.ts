import type { AcquaintanceListEvent } from "@grim-frontier/shared"
import { writable } from "svelte/store"

/** Store for the player's acquaintance ledger of previously declined NPCs. */
export const acquaintanceStore = writable<AcquaintanceListEvent["acquaintances"]>([])
