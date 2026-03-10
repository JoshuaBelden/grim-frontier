import { authStore } from "$lib/stores/auth"
import { get } from "svelte/store"

/** In-world date as returned by the game clock. */
interface InWorldDate {
  year: number
  month: number
  day: number
  hour: number
}

/** Active NPC action as returned by the camp API. */
export interface NpcCurrentAction {
  type: "food_gathering"
  startedAt: InWorldDate
}

const BASE = "/api"

/** A landmark on the territory map. */
export interface MapLandmark {
  id: string
  name: string
  type: "town" | "outpost" | "crossing"
  nodeKey: string
  position: { x: number; y: number }
}

/** A connection between two landmarks. */
export interface MapConnection {
  from: string
  to: string
  name: string
  distance: number
  classification: "road" | "trail"
}

/** The player's camp with its topology placement. */
export interface MapCamp {
  id: string
  name: string
  nearestLandmarkKey: string
  distanceToLandmark: number
}

/** Response from GET /worlds/:id/map */
export interface WorldMapResponse {
  territory: {
    id: string
    name: string
    landmarks: MapLandmark[]
    connections: MapConnection[]
    camp: MapCamp | null
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
  npcs: Array<{ id: string; name: string; career: string; currentAction: NpcCurrentAction | null }>
}

function authHeaders(): Record<string, string> {
  const { token } = get(authStore)
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  return headers
}

function authOnlyHeaders(): Record<string, string> {
  const { token } = get(authStore)
  const headers: Record<string, string> = {}
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

/** Joins a world by id, creating the player's starting camp and binding their NPC. */
export async function apiJoinWorld(worldId: string) {
  const response = await fetch(`${BASE}/worlds/${worldId}/join`, {
    method: "POST",
    headers: authHeaders(),
    body: "{}",
  })
  return handleResponse<{ campId: string; worldId: string; npcId: string }>(response)
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

/** Full NPC detail including characteristics, nature, traits, skills, and origin. */
export interface NpcDetailResponse {
  id: string
  worldId: string | null
  locationId: string | null
  locationType: "town" | "camp" | null
  locationName: string | null
  name: string
  career: string
  status: string
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

/** Starts a food_gathering action on the given NPC. */
export async function apiStartGatherFood(npcId: string) {
  const response = await fetch(`${BASE}/npcs/${npcId}/actions`, {
    method: "POST",
    headers: authHeaders(),
    body: "{}",
  })
  return handleResponse<NpcCurrentAction>(response)
}

/** Stops the current action on the given NPC, discarding any partial progress. */
export async function apiStopGatherFood(npcId: string) {
  const response = await fetch(`${BASE}/npcs/${npcId}/actions`, {
    method: "DELETE",
    headers: authOnlyHeaders(),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(body.error ?? "Request failed")
  }
}

/** Returns full NPC detail. */
export async function apiGetNpc(npcId: string) {
  const response = await fetch(`${BASE}/npcs/${npcId}`, { headers: authHeaders() })
  return handleResponse<NpcDetailResponse>(response)
}
