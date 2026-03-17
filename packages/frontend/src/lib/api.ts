import { authStore } from "$lib/stores/auth"
import { get } from "svelte/store"

const BASE = "/api"

function authHeaders(): Record<string, string> {
  const { token } = get(authStore)
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  return headers
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(body.error ?? "Request failed")
  }
  return response.json()
}

/** Registers a new player account. */
export async function apiRegister(username: string, password: string) {
  const response = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  return handleResponse<{ token: string; playerId: string }>(response)
}

/** Authenticates an existing player. */
export async function apiLogin(username: string, password: string) {
  const response = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  return handleResponse<{ token: string; playerId: string }>(response)
}

/** Logs out the current player by invalidating the server-side session. */
export async function apiLogout() {
  const { token } = get(authStore)
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`
  const response = await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    headers,
  })
  if (!response.ok && response.status !== 401) {
    throw new Error("Logout failed")
  }
}

/** Returns the current player's profile. */
export async function apiGetMe() {
  const response = await fetch(`${BASE}/players/me`, { headers: authHeaders() })
  return handleResponse<{ playerId: string; username: string; campId: string | null; npcIds: string[] }>(response)
}

/** Response item from GET /worlds */
export interface WorldListItem {
  id: string
  name: string
  inWorldDate: { year: number; month: number; day: number; hour: number }
}

/** Returns all active worlds. */
export async function apiGetWorlds() {
  const response = await fetch(`${BASE}/worlds`, { headers: authHeaders() })
  return handleResponse<WorldListItem[]>(response)
}

/** Joins a world with a specific player-owned NPC. */
export async function apiJoinWorld(worldId: string, npcId: string) {
  const response = await fetch(`${BASE}/worlds/${worldId}/join`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ npcId }),
  })
  return handleResponse<{ campId: string; worldId: string; npcId: string }>(response)
}

/** Summary of a player-owned NPC for the character list. */
export interface PlayerNpcSummary {
  id: string
  name: string
  career: string
  age: number
  portraitUrl: string | null
  worldId: string | null
  campId: string | null
  status: string
}

/** Payload for creating a new player character. */
export interface CharacterCreationPayload {
  name: string
  age: number
  career: string
  portraitDescription?: string
  characteristics: {
    strength: number
    hand: number
    presence: number
    wit: number
    temper: number
    grit: number
    nerve: number
    luck: number
  }
  nature: {
    disposition: {
      generosity: number
      mercy: number
      courage: number
      contentment: number
      honesty: number
    }
    outlook: {
      idealism: number
      willfulness: number
      trust: number
      humility: number
    }
  }
  traits: string[]
  skills: Partial<Record<string, number>>
  origin: {
    background: {
      origin: string
      family: string
      formativeEvent: string
    }
    scars: Array<{ type: string; description: string; triggerCondition?: string }>
  }
}

/** Creates a new player-owned NPC. */
export async function apiCreateCharacter(data: CharacterCreationPayload) {
  const response = await fetch(`${BASE}/characters`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  return handleResponse<{ npcId: string }>(response)
}

/** Returns summaries of all NPCs owned by the current player. */
export async function apiListMyNpcs() {
  const response = await fetch(`${BASE}/players/me/npcs`, { headers: authHeaders() })
  return handleResponse<PlayerNpcSummary[]>(response)
}

/** Deletes a player-owned NPC (only allowed if not in a world). */
export async function apiDeleteCharacter(id: string) {
  const response = await fetch(`${BASE}/characters/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(body.error ?? "Delete failed")
  }
}

/** Generates (or regenerates) a portrait for a player-owned NPC. */
export async function apiGeneratePortrait(id: string) {
  const { token } = get(authStore)
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`
  const response = await fetch(`${BASE}/characters/${id}/portrait`, {
    method: "POST",
    headers,
  })
  return handleResponse<{ portraitUrl: string }>(response)
}

/** Full NPC detail including characteristics, nature, traits, skills, and origin. */
export interface NpcDetailResponse {
  id: string
  worldId: string | null
  campId: string | null
  locationId: string | null
  locationType: "town" | "camp" | null
  locationName: string | null
  name: string
  age: number
  career: string
  status: string
  portraitUrl: string | null
  portraitDescription: string | null
  characteristics: {
    strength: number
    hand: number
    presence: number
    wit: number
    temper: number
    grit: number
    nerve: number
    luck: number
  }
  nature: {
    disposition: {
      generosity: number
      mercy: number
      courage: number
      contentment: number
      honesty: number
    }
    outlook: {
      idealism: number
      willfulness: number
      trust: number
      humility: number
    }
  }
  traits: string[]
  skills: Partial<Record<string, number>>
  origin: {
    background: {
      origin: string
      family: string
      formativeEvent: string
    }
    scars: Array<{ type: string; description: string; triggerCondition?: string }>
    pursuits: { secret?: string; shortTerm?: string; longTerm?: string }
  }
}

/** Returns full NPC detail. Used in login flow (pre-WebSocket). */
export async function apiGetNpc(npcId: string) {
  const response = await fetch(`${BASE}/npcs/${npcId}`, { headers: authHeaders() })
  return handleResponse<NpcDetailResponse>(response)
}
