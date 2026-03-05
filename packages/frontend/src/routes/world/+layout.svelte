<script lang="ts">
  import { goto } from "$app/navigation"
  import { authStore } from "$lib/stores/auth"
  import { connectWs, disconnectWs, wsConnected } from "$lib/ws"
  import type { Snippet } from "svelte"
  import { onMount } from "svelte"

  let { children }: { children: Snippet } = $props()

  onMount(() => {
    if (!$authStore.token) {
      goto("/login")
      return
    }
    connectWs()
    return disconnectWs
  })
</script>

<div class="shell">
  <header>
    <a href="/world" class="brand">Grim Frontier</a>
    <div class="meta">
      {#if $authStore.username}
        <span class="player">{$authStore.username}</span>
      {/if}
      <span class="ws-dot" class:connected={$wsConnected} title={$wsConnected ? "Connected" : "Disconnected"}></span>
    </div>
  </header>

  <div class="content">
    {@render children()}
  </div>
</div>

<style>
  .shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    border-bottom: 1px solid #2a1e0e;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1.5rem;
  }

  .brand {
    font-size: 0.85rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .player {
    color: #8a7060;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .ws-dot {
    border-radius: 50%;
    background: #5a4020;
    height: 6px;
    width: 6px;
  }

  .ws-dot.connected {
    background: #7a9a4a;
  }

  .content {
    flex: 1;
    padding: 2rem 1.5rem;
  }
</style>
