import { browser, dev } from "$app/environment"
import { get } from "svelte/store"
import { authStore } from "$lib/stores/auth"
import { handleWsMessage } from "$lib/wsHandler"
import { writable } from "svelte/store"

export const wsConnected = writable(false)

let socket: WebSocket | null = null

export function connectWs(): void {
  if (!browser) return
  const worldId = get(authStore).worldId
  if (socket) {
    if (socket.url.includes(`worldId=${worldId}`)) return
    disconnectWs()
  }
  if (!worldId) return
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"

  // In dev, connect directly to the backend to bypass Vite's unreliable WS proxy
  const host = dev ? "localhost:3000" : window.location.host
  socket = new WebSocket(`${protocol}//${host}/ws?worldId=${worldId}`)
  socket.onopen = () => wsConnected.set(true)
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
}
