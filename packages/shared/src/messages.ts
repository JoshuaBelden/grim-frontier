import type { Amenities, CampPosture, FirePitState, FoodStores, FoodStoreType, FuelStores, FuelStoreType } from "./camp"
import type { Career } from "./careers"
import type { Characteristics } from "./characteristics"
import type { InventoryItem } from "./inventory"
import type { Nature } from "./nature"
import type { NpcAction, NPCStatus } from "./npc"
import type { CharacterOrigin } from "./origin"
import type { NpcTravelState } from "./drifter"
import type { Skills } from "./skills"
import type { StoreItem, StoreType } from "./store"
import type { Trait } from "./traits"
import type { WorldWeather } from "./weather"
import type { InWorldDate, LandmarkType, RouteClassification } from "./world"

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
  | "setFirePit"
  | "setPreferredFood"
  | "setActiveFuelSource"
  | "setSuspendJoinRequests"
  | "respondJoinRequest"
  | "listJoinRequests"
  | "listAcquaintances"
  | "travelTo"
  | "transferToNpc"
  | "transferToCamp"
  | "sellItems"
  | "buyItem"

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

/** Start an action on an NPC (e.g. food or fuel gathering). */
export interface StartNpcActionCommand {
  type: "startNpcAction"
  npcId: string
  actionType: "food_gathering" | "fuel_gathering" | "resting"
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

/** Light or extinguish the camp fire pit. */
export interface SetFirePitCommand {
  type: "setFirePit"
  campId: string
  state: FirePitState
}

/** Set which food type the camp automatically consumes each night. */
export interface SetPreferredFoodCommand {
  type: "setPreferredFood"
  campId: string
  foodType: FoodStoreType
}

/** Set which fuel source the fire pit burns. */
export interface SetActiveFuelSourceCommand {
  type: "setActiveFuelSource"
  campId: string
  fuelType: FuelStoreType
}

/** Toggle whether the camp automatically declines incoming join requests. */
export interface SetSuspendJoinRequestsCommand {
  type: "setSuspendJoinRequests"
  campId: string
  suspended: boolean
}

/** Accept or decline a drifter's request to join the player's camp. */
export interface RespondJoinRequestCommand {
  type: "respondJoinRequest"
  requestId: string
  response: "accept" | "decline"
}

/** Request all pending join requests for the player's camp. */
export interface ListJoinRequestsCommand {
  type: "listJoinRequests"
}

/** Request the player's acquaintance ledger. */
export interface ListAcquaintancesCommand {
  type: "listAcquaintances"
}

/** Send the player's NPC to a town or camp. */
export interface TravelToCommand {
  type: "travelTo"
  destinationId: string
  destinationType: "town" | "camp"
}

/** Move one stack of items from the player's camp stores into the NPC's personal inventory. */
export interface TransferToNpcCommand {
  type: "transferToNpc"
  npcId: string
  item: InventoryItem
}

/** Move one stack of items from the NPC's personal inventory back into the player's camp stores. */
export interface TransferToCampCommand {
  type: "transferToCamp"
  npcId: string
  item: InventoryItem
}

/** Sell a set of items from the NPC's inventory to a general store. */
export interface SellItemsCommand {
  type: "sellItems"
  npcId: string
  storeId: string
  items: InventoryItem[]
}

/** Purchase a single item from a store, deducting the price from the NPC's money. */
export interface BuyItemCommand {
  type: "buyItem"
  npcId: string
  storeId: string
  itemName: string
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
  | SetFirePitCommand
  | SetPreferredFoodCommand
  | SetActiveFuelSourceCommand
  | SetSuspendJoinRequestsCommand
  | RespondJoinRequestCommand
  | ListJoinRequestsCommand
  | ListAcquaintancesCommand
  | TravelToCommand
  | TransferToNpcCommand
  | TransferToCampCommand
  | SellItemsCommand
  | BuyItemCommand

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
  | "npcUpdate"
  | "firePitUpdate"
  | "suspendJoinRequestsUpdate"
  | "joinRequestReceived"
  | "joinRequestList"
  | "joinRequestResolved"
  | "acquaintanceList"
  | "playerTravelStarted"
  | "playerTravelArrived"
  | "inventoryUpdate"
  | "sellConfirmed"
  | "buyConfirmed"

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

/** Broadcast every game hour with the updated in-world date and current weather. */
export interface ClockUpdateEvent {
  type: "clockUpdate"
  inWorldDate: InWorldDate
  weather?: WorldWeather
}

/** Broadcast when a camp's stores or amenities change. */
export interface CampUpdateEvent {
  type: "campUpdate"
  campId: string
  foodStores: FoodStores
  fuelStores: FuelStores
  preferredFood: FoodStoreType
  amenities?: Amenities
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
    regionName: string
    landmarks: MapLandmark[]
    connections: MapConnection[]
    camp: MapCamp | null
    npcTravel: NpcTravelState | null
    npcLocationKey: string | null
  }
}

/** Summary of a store within a town detail response. */
export interface TownDetailStore {
  id: string
  name: string
  type: StoreType
  description: string
  proprietor: string
  inventory: StoreItem[]
}

/** Response to getTown — town detail with stores. */
export interface TownDetailEvent {
  type: "townDetail"
  id: string
  name: string
  territoryId: string
  stores: TownDetailStore[]
}

/** Response to getNpc — full NPC profile. */
export interface NpcDetailEvent {
  type: "npcDetail"
  id: string
  ownerId: string | null
  worldId: string | null
  locationId: string | null
  locationType: "town" | "camp" | null
  locationName: string | null
  travelDestination: string | null
  name: string
  health: number
  morale: number
  hunger: number
  fatigue: number
  lastRestedAt: InWorldDate | null
  career: Career
  status: NPCStatus
  characteristics: Characteristics
  nature: Nature
  traits: Trait[]
  skills: Skills
  origin: CharacterOrigin
  inventory: InventoryItem[]
  money: number
}

/** A thin NPC summary for the list view. */
export interface NpcListItem {
  id: string
  name: string
  career: Career
  status: NPCStatus
  locationName: string | null
  locationType: "town" | "camp" | null
  travelDestination: string | null
}

/** Response to listNpcs — all NPCs in the world. */
export interface NpcListEvent {
  type: "npcList"
  npcs: NpcListItem[]
}

/** Response to getCamp — camp detail with stores and NPC roster. */
export interface CampDetailEvent {
  type: "campDetail"
  id: string
  name: string
  ownerId: string
  foodStores: FoodStores
  fuelStores: FuelStores
  preferredFood: FoodStoreType
  amenities: Amenities
  posture: CampPosture
  suspendJoinRequests: boolean
  reputation: number
  wealth: number
  notoriety: number
  npcs: CampDetailNpc[]
}

/** Thin NPC summary within a camp detail payload. */
export interface CampDetailNpc {
  id: string
  ownerId: string | null
  name: string
  career: Career
  health: number
  morale: number
  hunger: number
  fatigue: number
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

/** Broadcast when an NPC's vitals change (hunger, morale, health). */
export interface NpcUpdateEvent {
  type: "npcUpdate"
  npcId: string
  hunger?: number
  morale?: number
  health?: number
  fatigue?: number
}

/** Broadcast when the fire pit state changes. */
export interface FirePitUpdateEvent {
  type: "firePitUpdate"
  campId: string
  state: FirePitState
}

/** Broadcast when the camp's join request suspension state changes. */
export interface SuspendJoinRequestsUpdateEvent {
  type: "suspendJoinRequestsUpdate"
  campId: string
  suspended: boolean
}

/** Sent to a player when a drifting NPC requests to join their camp. */
export interface JoinRequestReceivedEvent {
  type: "joinRequestReceived"
  requestId: string
  npcName: string
  npcCareer: Career
  originSummary: string
}

/** Response to listJoinRequests — all pending requests for the player's camp. */
export interface JoinRequestListEvent {
  type: "joinRequestList"
  requests: Array<{
    requestId: string
    npcName: string
    npcCareer: Career
    originSummary: string
  }>
}

/** Confirmation that a join request was accepted or declined. */
export interface JoinRequestResolvedEvent {
  type: "joinRequestResolved"
  requestId: string
  npcId: string
  response: "accept" | "decline"
}

/** Response to listAcquaintances — NPCs the player has previously declined. */
export interface AcquaintanceListEvent {
  type: "acquaintanceList"
  acquaintances: Array<{
    npcId: string
    npcName: string
    npcCareer: Career
    declinedAt: string
  }>
}

/** Sent to the player when their NPC begins travelling. */
export interface PlayerTravelStartedEvent {
  type: "playerTravelStarted"
  npcId: string
  travelState: NpcTravelState
  destinationName: string
}

/** Sent to the player when their NPC arrives at a destination. */
export interface PlayerTravelArrivedEvent {
  type: "playerTravelArrived"
  npcId: string
  locationId: string
  locationName: string
  locationType: "town" | "camp"
}

/** Sent after a successful transfer to/from NPC inventory — contains the NPC's full updated inventory. */
export interface InventoryUpdateEvent {
  type: "inventoryUpdate"
  npcId: string
  inventory: InventoryItem[]
}

/** Sent after a successful sale at a general store — contains updated inventory, money balance, and amount earned. */
export interface SellConfirmedEvent {
  type: "sellConfirmed"
  npcId: string
  inventory: InventoryItem[]
  money: number
  earned: number
}

/** Sent after a successful store purchase — contains updated inventory, money balance, and amount spent. */
export interface BuyConfirmedEvent {
  type: "buyConfirmed"
  npcId: string
  inventory: InventoryItem[]
  money: number
  spent: number
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
  | NpcUpdateEvent
  | FirePitUpdateEvent
  | SuspendJoinRequestsUpdateEvent
  | JoinRequestReceivedEvent
  | JoinRequestListEvent
  | JoinRequestResolvedEvent
  | AcquaintanceListEvent
  | PlayerTravelStartedEvent
  | PlayerTravelArrivedEvent
  | InventoryUpdateEvent
  | SellConfirmedEvent
  | BuyConfirmedEvent
