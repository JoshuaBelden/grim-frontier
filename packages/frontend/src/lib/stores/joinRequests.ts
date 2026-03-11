import type { JoinRequestReceivedEvent } from "@grim-frontier/shared"
import { writable } from "svelte/store"

/** Store for pending join requests from drifting NPCs. */
export const joinRequestStore = writable<JoinRequestReceivedEvent[]>([])
