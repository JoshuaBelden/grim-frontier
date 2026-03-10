import type { CampPosture, Resources } from "./camp"
import type { Characteristics } from "./characteristics"
import type { Nature } from "./nature"
import type { NpcAction, NPCStatus } from "./npc"
import type { CharacterOrigin } from "./origin"
import type { Skills } from "./skills"
import type { Trait } from "./traits"
import type { InWorldDate, LandmarkType, RouteClassification } from "./world"
import type { Career } from "./careers"

// ---------------------------------------------------------------------------
// Client → Server commands
// ---------------------------------------------------------------------------

/** All possible client command type discriminators. */
export type ClientCommandType =
  | "getWorldMap"
  | "getTown"
  | "getNpc"
  | "getCamp"
  | "listNpcs"
  | "startNpcAction"
  | "stopNpcAction"

/** Request the territory map for the connected world. */
export interface GetWorldMapCommand {
  type: "getWorldMap"
  worldId: string
}

/** Request details for a specific town. */
export interface GetTownCommand {
  type: "getTown"
  townId: string
}

/** Request full details for an NPC. */
export interface GetNpcCommand {
  type: "getNpc"
  npcId: string
}

/** Request full details for a camp. */
export interface GetCampCommand {
  type: "getCamp"
  campId: string
}

/** Start an action on an NPC (e.g. food gathering). */
export interface StartNpcActionCommand {
  type: "startNpcAction"
  npcId: string
  actionType: "food_gathering"
}

/** Request a list of all NPCs in the world. */
export interface ListNpcsCommand {
  type: "listNpcs"
}

/** Stop the current action on an NPC. */
export interface StopNpcActionCommand {
  type: "stopNpcAction"
  npcId: string
}

/** Discriminated union of all client-to-server commands. */
export type ClientCommand =
  | GetWorldMapCommand
  | GetTownCommand
  | GetNpcCommand
  | GetCampCommand
  | ListNpcsCommand
  | StartNpcActionCommand
  | StopNpcActionCommand

// ---------------------------------------------------------------------------
// Server → Client events
// ---------------------------------------------------------------------------

/** All possible server event type discriminators. */
export type ServerEventType =
  | "connected"
  | "error"
  | "clockUpdate"
  | "campUpdate"
  | "worldMap"
  | "townDetail"
  | "npcDetail"
  | "npcList"
  | "campDetail"
  | "npcActionStarted"
  | "npcActionStopped"

/** Sent on initial WebSocket connection. */
export interface ConnectedEvent {
  type: "connected"
  message: string
}

/** Sent when a command fails or the connection is invalid. */
export interface ErrorEvent {
  type: "error"
  command?: ClientCommandType
  message: string
}

/** Broadcast every game hour with the updated in-world date. */
export interface ClockUpdateEvent {
  type: "clockUpdate"
  inWorldDate: InWorldDate
}

/** Broadcast when a camp's resources change (gathering or consumption). */
export interface CampUpdateEvent {
  type: "campUpdate"
  campId: string
  resources: Resources
}

/** A landmark on the territory map. */
export interface MapLandmark {
  id: string
  name: string
  type: LandmarkType
  nodeKey: string
  position: { x: number; y: number }
}

/** A connection between two landmarks on the map. */
export interface MapConnection {
  from: string
  to: string
  name: string
  distance: number
  classification: RouteClassification
}

/** The player's camp placement on the map. */
export interface MapCamp {
  id: string
  name: string
  nearestLandmarkKey: string
  distanceToLandmark: number
}

/** Response to getWorldMap — the player's territory with landmarks, connections, and camp. */
export interface WorldMapEvent {
  type: "worldMap"
  territory: {
    id: string
    name: string
    landmarks: MapLandmark[]
    connections: MapConnection[]
    camp: MapCamp | null
  }
}

/** Response to getTown — basic town detail. */
export interface TownDetailEvent {
  type: "townDetail"
  id: string
  name: string
  territoryId: string
}

/** Response to getNpc — full NPC profile. */
export interface NpcDetailEvent {
  type: "npcDetail"
  id: string
  worldId: string | null
  locationId: string | null
  locationType: "town" | "camp" | null
  locationName: string | null
  name: string
  career: Career
  status: NPCStatus
  characteristics: Characteristics
  nature: Nature
  traits: Trait[]
  skills: Skills
  origin: CharacterOrigin
}

/** A thin NPC summary for the list view. */
export interface NpcListItem {
  id: string
  name: string
  career: Career
  status: NPCStatus
  locationName: string | null
  locationType: "town" | "camp" | null
}

/** Response to listNpcs — all NPCs in the world. */
export interface NpcListEvent {
  type: "npcList"
  npcs: NpcListItem[]
}

/** Response to getCamp — camp detail with resources and NPC roster. */
export interface CampDetailEvent {
  type: "campDetail"
  id: string
  name: string
  ownerId: string
  resources: Resources
  stability: number
  posture: CampPosture
  reputation: number
  wealth: number
  notoriety: number
  npcs: CampDetailNpc[]
}

/** Thin NPC summary within a camp detail payload. */
export interface CampDetailNpc {
  id: string
  name: string
  career: Career
  currentAction: NpcAction | null
}

/** Confirmation that an NPC action was started. */
export interface NpcActionStartedEvent {
  type: "npcActionStarted"
  npcId: string
  action: NpcAction
}

/** Confirmation that an NPC action was stopped. */
export interface NpcActionStoppedEvent {
  type: "npcActionStopped"
  npcId: string
}

/** Discriminated union of all server-to-client events. */
export type ServerEvent =
  | ConnectedEvent
  | ErrorEvent
  | ClockUpdateEvent
  | CampUpdateEvent
  | WorldMapEvent
  | TownDetailEvent
  | NpcDetailEvent
  | NpcListEvent
  | CampDetailEvent
  | NpcActionStartedEvent
  | NpcActionStoppedEvent
