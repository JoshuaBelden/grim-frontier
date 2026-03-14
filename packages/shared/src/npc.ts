import type { Career } from "./careers"
import type { Characteristics } from "./characteristics"
import type { NpcTravelState } from "./drifter"
import type { InventoryItem } from "./inventory"
import type { Nature } from "./nature"
import type { CharacterOrigin } from "./origin"
import type { Relationship } from "./relationships"
import type { Skills } from "./skills"
import type { Trait } from "./traits"
import type { InWorldDate } from "./world"

/** Lifecycle status of an NPC within the world simulation. */
export type NPCStatus = "drifting" | "travelling" | "encountered" | "at_camp" | "in_town" | "gone"

/** An ongoing NPC activity that runs until explicitly stopped. */
export interface NpcAction {
  type: "food_gathering" | "fuel_gathering" | "resting" | "stand_watch"
  startedAt: InWorldDate
}

export interface NPC {
  worldId?: string
  ownerId?: string
  name: string
  health: number
  morale: number
  hunger: number
  fatigue: number
  lastRestedAt?: InWorldDate
  characteristics: Characteristics
  nature: Nature
  traits: Trait[]
  career: Career
  skills: Skills
  origin: CharacterOrigin
  portraitDescription?: string
  portraitUrl?: string
  status: NPCStatus
  locationId?: string
  locationType?: "town" | "camp"
  campId?: string
  travelState?: NpcTravelState
  currentAction?: NpcAction
  relationships: Relationship[]
  inventory: InventoryItem[]
  money?: number
  createdAt: Date
  updatedAt: Date
}
