import { writable } from 'svelte/store'
import { browser } from '$app/environment'

/** Persisted authentication and session state for the current player. */
interface AuthState {
  token: string | null
  playerId: string | null
  username: string | null
  worldId: string | null
  campId: string | null
}

const STORAGE_KEY = 'grim-frontier:auth'

const defaultState: AuthState = {
  token: null,
  playerId: null,
  username: null,
  worldId: null,
  campId: null,
}

function loadFromStorage(): AuthState {
  if (!browser) return defaultState
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return defaultState
  try {
    return JSON.parse(stored)
  } catch {
    return defaultState
  }
}

const { subscribe, set, update } = writable<AuthState>(loadFromStorage())

if (browser) {
  subscribe(state => localStorage.setItem(STORAGE_KEY, JSON.stringify(state)))
}

export const authStore = {
  subscribe,
  setAuth(token: string, playerId: string, username: string) {
    update(state => ({ ...state, token, playerId, username }))
  },
  setWorld(worldId: string, campId: string) {
    update(state => ({ ...state, worldId, campId }))
  },
  clear() {
    set(defaultState)
  },
}
