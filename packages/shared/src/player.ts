import type { Career } from "./careers"
import type { Characteristics } from "./characteristics"
import type { Nature } from "./nature"
import type { CharacterOrigin } from "./origin"
import type { Relationship } from "./relationships"
import type { Skills } from "./skills"
import type { Trait } from "./traits"

/** A registered user and their in-world character. */
export interface Player {
  username: string
  passwordHash: string
  worldId?: string
  campId?: string
  characteristics: Characteristics
  nature: Nature
  traits: Trait[]
  career: Career
  skills: Skills
  origin: CharacterOrigin
  relationships: Relationship[]
  createdAt: Date
  updatedAt: Date
}

/** Player without sensitive fields — safe to send to clients. */
export type PlayerProfile = Omit<Player, "passwordHash">
