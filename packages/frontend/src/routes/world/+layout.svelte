<script lang="ts">
  import { goto } from "$app/navigation"
  import { apiGetCamp } from "$lib/api"
  import NpcAvatar from "$lib/components/npc/NpcAvatar.svelte"
  import NpcPanels from "$lib/components/npc/NpcPanels.svelte"
  import { authStore } from "$lib/stores/auth"
  import { formatInWorldDate } from "$lib/utils/time"
  import { connectWs, disconnectWs, wsConnected } from "$lib/ws"
  import { worldClock } from "$lib/wsHandler"
  import type { Snippet } from "svelte"
  import { onMount } from "svelte"

  let { children }: { children: Snippet } = $props()

  interface CampNpc {
    id: string
    name: string
    career: string
  }

  let campNpcs = $state<CampNpc[]>([])

  onMount(() => {
    if (!$authStore.token) {
      goto("/login")
      return disconnectWs
    }
    if ($authStore.campId) {
      apiGetCamp($authStore.campId)
        .then(camp => {
          campNpcs = camp.npcs
        })
        .catch(() => {
          // Non-critical — avatar tray degrades gracefully
        })
    }
    return disconnectWs
  })

  $effect(() => {
    if ($authStore.worldId) {
      connectWs()
    } else {
      disconnectWs()
    }
  })

  /** The player's own avatar entry — always shown in the tray. */
  const playerEntry = $derived({
    key: $authStore.playerId ?? "player",
    npcId: null,
    name: $authStore.username ?? "Player",
  })
</script>

<div class="shell">
  <header>
    <a href="/world" class="brand">Grim Frontier</a>
    <div class="world-clock">
      {#if $worldClock}
        Time: {formatInWorldDate($worldClock)}
      {:else}
        Time: —
      {/if}
    </div>
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

  <div class="avatar-tray">
    <NpcAvatar entry={playerEntry} />
    {#each campNpcs as npc}
      <NpcAvatar entry={{ key: npc.id, npcId: npc.id, name: npc.name, career: npc.career }} />
    {/each}
  </div>
</div>

<NpcPanels />

<style>
  .shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  header {
    border-bottom: 1px solid #2a1e0e;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
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
    justify-self: end;
  }

  .world-clock {
    color: #8a7060;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-align: center;
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

  .avatar-tray {
    bottom: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    left: 1.25rem;
    position: fixed;
    z-index: 10;
  }
</style>
