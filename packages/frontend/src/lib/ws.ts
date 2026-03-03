import { writable } from 'svelte/store'
import { browser } from '$app/environment'

export const wsConnected = writable(false)

let socket: WebSocket | null = null

/** Opens a WebSocket connection to the game server. */
export function connectWs(): void {
  if (!browser || socket) return
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  socket = new WebSocket(`${protocol}//${window.location.host}/ws`)
  socket.onopen = () => wsConnected.set(true)
  socket.onclose = () => {
    wsConnected.set(false)
    socket = null
  }
  socket.onerror = () => {
    wsConnected.set(false)
  }
}

/** Closes the active WebSocket connection. */
export function disconnectWs(): void {
  socket?.close()
  socket = null
}
