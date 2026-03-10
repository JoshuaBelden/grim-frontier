import type { ClientCommandType, ServerEvent } from "@grim-frontier/shared"
import type { WorldClock } from "../../core/worldClock.js"
import { handleGetWorldMap } from "./getWorldMap.js"
import { handleGetTown } from "./getTown.js"
import { handleGetNpc } from "./getNpc.js"
import { handleGetCamp } from "./getCamp.js"
import { handleStartNpcAction } from "./startNpcAction.js"
import { handleListNpcs } from "./listNpcs.js"
import { handleSetFirePit } from "./setFirePit.js"
import { handleStopNpcAction } from "./stopNpcAction.js"

export interface HandlerContext {
  playerId: string
  worldId: string
  send: (event: ServerEvent) => void
  broadcast: (event: ServerEvent) => void
  clock: WorldClock
}

export type CommandHandler = (context: HandlerContext, payload: unknown) => Promise<void>

export const commandHandlers: Record<ClientCommandType, CommandHandler> = {
  getWorldMap: handleGetWorldMap,
  getTown: handleGetTown,
  getNpc: handleGetNpc,
  getCamp: handleGetCamp,
  listNpcs: handleListNpcs,
  startNpcAction: handleStartNpcAction,
  stopNpcAction: handleStopNpcAction,
  setFirePit: handleSetFirePit,
}
