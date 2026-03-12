import type { Camp, InWorldDate, LandmarkNode, NPC, TopologyConnection } from "@grim-frontier/shared"
import type { ObjectId } from "mongodb"

/** An NPC document with its MongoDB _id. */
export type NpcDocument = NPC & { _id?: ObjectId }

/** A camp document with its MongoDB _id. */
export type CampDocument = Camp & { _id?: ObjectId }

/** Everything a drifter action needs to evaluate and execute. */
export interface DrifterActionContext {
  npc: NpcDocument
  npcId: string
  worldId: string
  currentDate: InWorldDate
  currentLandmark: LandmarkNode | null
  connectedLandmarks: Array<{ landmark: LandmarkNode; connection: TopologyConnection }>
  nearbyCamps: CampDocument[]
  broadcast: (worldId: string, message: object) => void
}

/** A candidate behavior a drifting NPC can perform each tick. */
export interface DrifterAction {
  name: string
  score(context: DrifterActionContext): Promise<number>
  execute(context: DrifterActionContext): Promise<void>
}
