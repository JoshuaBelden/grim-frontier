import type {
  CampDetailEvent,
  CampUpdateEvent,
  ClockUpdateEvent,
  InWorldDate,
  NpcActionStartedEvent,
  NpcActionStoppedEvent,
  NpcDetailEvent,
  ServerEvent,
  TownDetailEvent,
  WorldMapEvent,
  ErrorEvent,
} from "@grim-frontier/shared"
import { writable } from "svelte/store"
import { campDetailStore } from "./stores/camp"
import { worldMapStore } from "./stores/worldMap"
import { wsErrorStore } from "./stores/wsError"

export const worldClock = writable<InWorldDate | null>(null)

/** Wall-clock timestamp (ms) of when the most recent clockUpdate was received. Used for progress bar animation. */
export const lastClockUpdateAt = writable<number>(0)

/** Store for the most recent townDetail event. Pages subscribe to this for town data. */
export const townDetailStore = writable<TownDetailEvent | null>(null)

/** Store for NPC detail events keyed by NPC id. */
export const npcDetailStore = writable<Map<string, NpcDetailEvent>>(new Map())

/** Handler map for all server event types. */
const eventHandlers: Record<string, (message: ServerEvent) => void> = {
  clockUpdate(message) {
    const event = message as ClockUpdateEvent
    worldClock.set(event.inWorldDate)
    lastClockUpdateAt.set(Date.now())
  },

  campUpdate(message) {
    const event = message as CampUpdateEvent
    campDetailStore.update(current => {
      if (current && current.id === event.campId) {
        return { ...current, resources: event.resources }
      }
      return current
    })
  },

  worldMap(message) {
    const event = message as WorldMapEvent
    worldMapStore.set(event.territory)
  },

  townDetail(message) {
    townDetailStore.set(message as TownDetailEvent)
  },

  npcDetail(message) {
    const event = message as NpcDetailEvent
    npcDetailStore.update(current => {
      const updated = new Map(current)
      updated.set(event.id, event)
      return updated
    })
  },

  campDetail(message) {
    campDetailStore.set(message as CampDetailEvent)
  },

  npcActionStarted(message) {
    const event = message as NpcActionStartedEvent
    campDetailStore.update(current => {
      if (!current) return current
      return {
        ...current,
        npcs: current.npcs.map(npc => (npc.id === event.npcId ? { ...npc, currentAction: event.action } : npc)),
      }
    })
  },

  npcActionStopped(message) {
    const event = message as NpcActionStoppedEvent
    campDetailStore.update(current => {
      if (!current) return current
      return {
        ...current,
        npcs: current.npcs.map(npc => (npc.id === event.npcId ? { ...npc, currentAction: null } : npc)),
      }
    })
  },

  error(message) {
    const event = message as ErrorEvent
    wsErrorStore.set({ command: event.command, message: event.message })
  },
}

/** Routes an incoming WebSocket message to the appropriate handler. */
export function handleWsMessage(data: unknown): void {
  if (typeof data !== "object" || data === null || !("type" in data)) return
  const message = data as ServerEvent
  const handler = eventHandlers[message.type]
  if (handler) handler(message)
}
