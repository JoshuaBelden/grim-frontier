/** The current state of an NPC encounter in a town. */
export type EncounterStatus = "active" | "tracked" | "resolved"

/** An NPC surfacing in a town, available to be tracked or engaged by a player. */
export interface Encounter {
  worldId: string
  townId: string
  npcId: string
  status: EncounterStatus
  trackedByPlayerId?: string
  createdAt: Date
  updatedAt: Date
}
