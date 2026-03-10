import type { ClientCommandType, ServerEvent } from "@grim-frontier/shared"
import type { WorldClock } from "../../core/worldClock.js"
import { handleGetWorldMap } from "./getWorldMap.js"
import { handleGetTown } from "./getTown.js"
import { handleGetNpc } from "./getNpc.js"
import { handleGetCamp } from "./getCamp.js"
import { handleStartNpcAction } from "./startNpcAction.js"
import { handleListNpcs } from "./listNpcs.js"
import { handleStopNpcAction } from "./stopNpcAction.js"

/** Context available to every command handler. */
export interface HandlerContext {
  playerId: string
  worldId: string
  /** Send an event to the requesting client only. */
  send: (event: ServerEvent) => void
  /** Broadcast an event to all clients connected to this world. */
  broadcast: (event: ServerEvent) => void
  clock: WorldClock
}

/** Handler function signature for a client command. */
export type CommandHandler = (context: HandlerContext, payload: unknown) => Promise<void>

/** Maps each client command type to its handler function. */
export const commandHandlers: Record<ClientCommandType, CommandHandler> = {
  getWorldMap: handleGetWorldMap,
  getTown: handleGetTown,
  getNpc: handleGetNpc,
  getCamp: handleGetCamp,
  listNpcs: handleListNpcs,
  startNpcAction: handleStartNpcAction,
  stopNpcAction: handleStopNpcAction,
}
