import { writable } from "svelte/store"

/** A single entry in the open NPC panels list. */
export interface PanelEntry {
  /** Unique key — the npcId. */
  key: string
  /** NPC document id. */
  npcId: string
  name: string
  career?: string
  location?: string
}

const { subscribe, update } = writable<PanelEntry[]>([])

/** Tracks which NPC panels are currently open. */
export const npcPanelStore = {
  subscribe,
  open(entry: PanelEntry) {
    update(panels => {
      if (panels.some(panel => panel.key === entry.key)) return panels
      return [...panels, entry]
    })
  },
  close(key: string) {
    update(panels => panels.filter(panel => panel.key !== key))
  },
}
