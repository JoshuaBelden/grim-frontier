import type { Career } from "./careers"
import type { Characteristics } from "./characteristics"
import type { Nature } from "./nature"
import type { CharacterOrigin } from "./origin"
import type { Relationship } from "./relationships"
import type { Skills } from "./skills"
import type { Trait } from "./traits"

/** Lifecycle status of an NPC within the world simulation. */
export type NPCStatus = "drifting" | "encountered" | "at_camp" | "gone"

/** An AI-driven character drifting through the world. */
export interface NPC {
  worldId: string
  name: string
  characteristics: Characteristics
  nature: Nature
  traits: Trait[]
  career: Career
  skills: Skills
  origin: CharacterOrigin
  status: NPCStatus
  locationId?: string // Town or Camp id
  locationType?: "town" | "camp"
  campId?: string
  relationships: Relationship[]
  createdAt: Date
  updatedAt: Date
}
