import websocketPlugin from "@fastify/websocket"
import type { FastifyInstance } from "fastify"
import { WorldClock } from "../core/worldClock.js"

interface WsClient {
  readyState: number
  OPEN: number
  send(data: string): void
}

const worldClients = new Map<string, Set<WsClient>>()

/** Broadcasts a message to all clients connected to a specific world. */
export function broadcastToWorld(worldId: string, message: object): void {
  const clients = worldClients.get(worldId)
  if (!clients) return
  const payload = JSON.stringify(message)
  for (const client of clients) {
    if (client.readyState === client.OPEN) {
      client.send(payload)
    }
  }
}

export async function registerWebSocket(app: FastifyInstance, clock: WorldClock): Promise<void> {
  await app.register(websocketPlugin)

  app.get("/ws", { websocket: true }, (socket, req) => {
    const { worldId } = req.query as { worldId?: string }

    if (!worldId) {
      socket.send(JSON.stringify({ type: "error", message: "worldId required" }))
      socket.close()
      return
    }

    console.log(`WebSocket client connected (world: ${worldId})`)

    if (!worldClients.has(worldId)) {
      worldClients.set(worldId, new Set())
    }
    worldClients.get(worldId)!.add(socket)

    socket.send(JSON.stringify({ type: "connected", message: "Welcome to Grim Frontier" }))

    const currentDate = clock.getDate(worldId)
    if (currentDate) {
      socket.send(JSON.stringify({ type: "clockUpdate", inWorldDate: currentDate }))
    }

    socket.on("message", (data: Buffer) => {
      console.log("WS message:", data.toString())
    })

    socket.on("close", () => {
      console.log(`WebSocket client disconnected (world: ${worldId})`)
      const clients = worldClients.get(worldId)
      if (clients) {
        clients.delete(socket)
        if (clients.size === 0) {
          worldClients.delete(worldId)
        }
      }
    })
  })
}
