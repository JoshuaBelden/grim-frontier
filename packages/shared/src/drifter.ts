import type { Career } from "./careers"

/** Travel state for an NPC currently moving between landmarks. */
export interface NpcTravelState {
  fromLandmarkKey: string
  toLandmarkKey: string
  /** MongoDB _id of the destination town or camp. */
  toLocationId: string
  /** Whether the destination is a town or camp. */
  toLocationType: "town" | "camp"
  routeName: string
  departedHour: number
  arrivalHour: number
  distanceMiles: number
}

/** Status of a join request from a drifter to a camp. */
export type JoinRequestStatus = "pending" | "accepted" | "declined"

/** A drifter's request to join a player's camp. */
export interface JoinRequest {
  worldId: string
  npcId: string
  campId: string
  playerId: string
  npcName: string
  npcCareer: Career
  originSummary: string
  status: JoinRequestStatus
  createdAt: Date
  updatedAt: Date
}

/** A declined NPC that the player has previously encountered. */
export interface Acquaintance {
  worldId: string
  playerId: string
  npcId: string
  npcName: string
  npcCareer: Career
  declinedAt: Date
}
