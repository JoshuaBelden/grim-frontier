import type { ClientCommandType } from "@grim-frontier/shared"
import { writable } from "svelte/store"

/** The most recent WebSocket error, if any. */
export const wsErrorStore = writable<{ command?: ClientCommandType; message: string } | null>(null)
