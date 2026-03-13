import type { ClientCommandType, ServerEvent } from "@grim-frontier/shared"
import type { WorldClock } from "../../core/worldClock.js"
import { handleGetWorldMap } from "./getWorldMap.js"
import { handleGetTown } from "./getTown.js"
import { handleGetNpc } from "./getNpc.js"
import { handleGetCamp } from "./getCamp.js"
import { handleListAcquaintances } from "./listAcquaintances.js"
import { handleListJoinRequests } from "./listJoinRequests.js"
import { handleListNpcs } from "./listNpcs.js"
import { handleRespondJoinRequest } from "./respondJoinRequest.js"
import { handleSetActiveFuelSource } from "./setActiveFuelSource.js"
import { handleSetFirePit } from "./setFirePit.js"
import { handleSetPreferredFood } from "./setPreferredFood.js"
import { handleSetSuspendJoinRequests } from "./setSuspendJoinRequests.js"
import { handleStartNpcAction } from "./startNpcAction.js"
import { handleStopNpcAction } from "./stopNpcAction.js"
import { handleReturnToCamp } from "./returnToCamp.js"
import { handleTravelToTown } from "./travelToTown.js"
import { handleTransferToNpc } from "./transferToNpc.js"
import { handleTransferToCamp } from "./transferToCamp.js"
import { handleSellItems } from "./sellItems.js"
import { handleBuyItem } from "./buyItem.js"

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
  setPreferredFood: handleSetPreferredFood,
  setActiveFuelSource: handleSetActiveFuelSource,
  setSuspendJoinRequests: handleSetSuspendJoinRequests,
  respondJoinRequest: handleRespondJoinRequest,
  listJoinRequests: handleListJoinRequests,
  listAcquaintances: handleListAcquaintances,
  travelToTown: handleTravelToTown,
  returnToCamp: handleReturnToCamp,
  transferToNpc: handleTransferToNpc,
  transferToCamp: handleTransferToCamp,
  sellItems: handleSellItems,
  buyItem: handleBuyItem,
}
