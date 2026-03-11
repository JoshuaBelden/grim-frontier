import { investigateCampAction } from "./investigateCampAction.js"
import { stayAction } from "./stayAction.js"
import { travelAction } from "./travelAction.js"
import type { DrifterAction } from "./types.js"

/** All registered drifter actions. Add new actions here to extend NPC behavior. */
export const drifterActions: DrifterAction[] = [stayAction, travelAction, investigateCampAction]

export type { DrifterAction, DrifterActionContext, CampDocument, NpcDocument } from "./types.js"
