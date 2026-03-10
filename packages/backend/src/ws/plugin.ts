import websocketPlugin from "@fastify/websocket"
import type { FastifyInstance } from "fastify"
import type { ClientCommand, ServerEvent } from "@grim-frontier/shared"
import { WorldClock } from "../core/worldClock.js"
import { validateSession } from "../middleware/authenticate.js"
import { commandHandlers, type HandlerContext } from "./handlers/index.js"

interface WsClient {
  readyState: number
  OPEN: number
  send(data: string): void
  on(event: string, listener: (...args: unknown[]) => void): void
  close(): void
}

/** An authenticated WebSocket client with its identity. */
interface AuthenticatedWsClient {
  socket: WsClient
  playerId: string
  worldId: string
}

const worldClients = new Map<string, Set<AuthenticatedWsClient>>()

/** Sends a typed event to a single client. */
function sendToClient(socket: WsClient, event: ServerEvent): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(event))
  }
}

/** Broadcasts a message to all clients connected to a specific world. */
export function broadcastToWorld(worldId: string, message: object): void {
  const clients = worldClients.get(worldId)
  if (!clients) return
  const payload = JSON.stringify(message)
  for (const client of clients) {
    if (client.socket.readyState === client.socket.OPEN) {
      client.socket.send(payload)
    }
  }
}

export async function registerWebSocket(app: FastifyInstance, clock: WorldClock): Promise<void> {
  await app.register(websocketPlugin)

  app.get("/ws", { websocket: true }, async (socket, req) => {
    const { worldId, token } = req.query as { worldId?: string; token?: string }

    if (!worldId) {
      sendToClient(socket, { type: "error", message: "worldId required" })
      socket.close()
      return
    }

    if (!token) {
      sendToClient(socket, { type: "error", message: "Authentication required" })
      socket.close()
      return
    }

    const session = await validateSession(app, token)
    if (!session) {
      sendToClient(socket, { type: "error", message: "Invalid or expired session" })
      socket.close()
      return
    }

    const authenticatedClient: AuthenticatedWsClient = {
      socket,
      playerId: session.playerId,
      worldId,
    }

    console.log(`WebSocket client connected (world: ${worldId}, player: ${session.playerId})`)

    if (!worldClients.has(worldId)) {
      worldClients.set(worldId, new Set())
    }
    worldClients.get(worldId)!.add(authenticatedClient)

    sendToClient(socket, { type: "connected", message: "Welcome to Grim Frontier" })

    const currentDate = clock.getDate(worldId)
    if (currentDate) {
      sendToClient(socket, { type: "clockUpdate", inWorldDate: currentDate })
    }

    socket.on("message", async (data: Buffer) => {
      let command: ClientCommand
      try {
        command = JSON.parse(data.toString())
      } catch {
        sendToClient(socket, { type: "error", message: "Invalid JSON" })
        return
      }

      if (!command.type) {
        sendToClient(socket, { type: "error", message: "Missing command type" })
        return
      }

      const handler = commandHandlers[command.type]
      if (!handler) {
        sendToClient(socket, { type: "error", message: `Unknown command: ${command.type}` })
        return
      }

      const handlerContext: HandlerContext = {
        playerId: session.playerId,
        worldId,
        send: event => sendToClient(socket, event),
        broadcast: event => broadcastToWorld(worldId, event),
        clock,
      }

      try {
        await handler(handlerContext, command)
      } catch (error) {
        console.error(`Handler error for ${command.type}:`, error)
        sendToClient(socket, { type: "error", command: command.type, message: "Internal error" })
      }
    })

    socket.on("close", () => {
      console.log(`WebSocket client disconnected (world: ${worldId}, player: ${session.playerId})`)
      const clients = worldClients.get(worldId)
      if (clients) {
        clients.delete(authenticatedClient)
        if (clients.size === 0) {
          worldClients.delete(worldId)
        }
      }
    })
  })
}
