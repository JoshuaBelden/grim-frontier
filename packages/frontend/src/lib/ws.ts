import { browser, dev } from "$app/environment"
import { get } from "svelte/store"
import type { ClientCommand } from "@grim-frontier/shared"
import { authStore } from "$lib/stores/auth"
import { handleWsMessage } from "$lib/wsHandler"
import { writable } from "svelte/store"

export const wsConnected = writable(false)

let socket: WebSocket | null = null
let pendingCommands: ClientCommand[] = []

/** Sends a command to the server over the active WebSocket connection. Queues if not yet connected. */
export function sendCommand(command: ClientCommand): void {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(command))
  } else {
    pendingCommands.push(command)
  }
}

/** Flushes any commands that were queued before the socket was open. */
function flushPendingCommands(): void {
  const commands = pendingCommands
  pendingCommands = []
  for (const command of commands) {
    sendCommand(command)
  }
}

export function connectWs(): void {
  if (!browser) return
  const { worldId, token } = get(authStore)
  if (socket) {
    if (socket.url.includes(`worldId=${worldId}`)) return
    disconnectWs()
  }
  if (!worldId || !token) return
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"

  // In dev, connect directly to the backend to bypass Vite's unreliable WS proxy
  const host = dev ? "localhost:3000" : window.location.host
  socket = new WebSocket(`${protocol}//${host}/ws?worldId=${worldId}&token=${token}`)
  socket.onopen = () => {
    wsConnected.set(true)
    flushPendingCommands()
  }
  socket.onclose = () => {
    wsConnected.set(false)
    socket = null
  }
  socket.onerror = () => {
    wsConnected.set(false)
  }
  socket.onmessage = event => {
    handleWsMessage(JSON.parse(event.data))
  }
}

export function disconnectWs(): void {
  socket?.close()
  socket = null
  pendingCommands = []
}
