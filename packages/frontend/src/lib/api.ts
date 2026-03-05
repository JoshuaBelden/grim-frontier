import { authStore } from "$lib/stores/auth"
import { get } from "svelte/store"

const BASE = "/api"

/** Response from GET /worlds/:id/map */
export interface WorldMapResponse {
  territory: {
    id: string
    name: string
    town: { id: string; name: string } | null
    camp: { id: string; name: string } | null
  }
}

/** Response from GET /towns/:id */
export interface TownResponse {
  id: string
  name: string
  territoryId: string
}

/** Response from GET /camps/:id */
export interface CampResponse {
  id: string
  name: string
  ownerId: string
  resources: { food: number; supplies: number }
  stability: number
  posture: string
  reputation: number
  wealth: number
  notoriety: number
  npcs: Array<{ id: string; name: string; career: string }>
}

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

/** Returns the current player's profile. */
export async function apiGetMe() {
  const response = await fetch(`${BASE}/players/me`, { headers: authHeaders() })
  return handleResponse<{ playerId: string; username: string; worldId: string | null; campId: string | null }>(response)
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

/** Joins a world by id, creating the player's starting camp. */
export async function apiJoinWorld(worldId: string) {
  const response = await fetch(`${BASE}/worlds/${worldId}/join`, {
    method: "POST",
    headers: authHeaders(),
    body: "{}",
  })
  return handleResponse<{ campId: string; worldId: string }>(response)
}

/** Returns the territory map for a world, including town and player camp nodes. */
export async function apiGetWorldMap(worldId: string) {
  const response = await fetch(`${BASE}/worlds/${worldId}/map`, { headers: authHeaders() })
  return handleResponse<WorldMapResponse>(response)
}

/** Returns basic town detail. */
export async function apiGetTown(townId: string) {
  const response = await fetch(`${BASE}/towns/${townId}`, { headers: authHeaders() })
  return handleResponse<TownResponse>(response)
}

/** Returns camp detail including resources and NPC roster. */
export async function apiGetCamp(campId: string) {
  const response = await fetch(`${BASE}/camps/${campId}`, { headers: authHeaders() })
  return handleResponse<CampResponse>(response)
}
