import type { Career } from "./careers"
import type { Characteristics } from "./characteristics"
import type { Nature } from "./nature"
import type { CharacterOrigin } from "./origin"
import type { Relationship } from "./relationships"
import type { Skills } from "./skills"
import type { Trait } from "./traits"
import type { InWorldDate } from "./world"

/** Lifecycle status of an NPC within the world simulation. */
export type NPCStatus = "drifting" | "encountered" | "at_camp" | "gone"

/** An ongoing NPC activity that runs until explicitly stopped. */
export interface NpcAction {
  type: "food_gathering" | "wood_gathering" | "resting"
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
  status: NPCStatus
  locationId?: string
  locationType?: "town" | "camp"
  campId?: string
  currentAction?: NpcAction
  relationships: Relationship[]
  createdAt: Date
  updatedAt: Date
}
