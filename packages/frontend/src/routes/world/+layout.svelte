<script lang="ts">
  import { goto } from "$app/navigation"
  import NpcAvatar from "$lib/components/npc/NpcAvatar.svelte"
  import NpcListPanel from "$lib/components/npc/NpcListPanel.svelte"
  import NpcPanels from "$lib/components/npc/NpcPanels.svelte"
  import { authStore } from "$lib/stores/auth"
  import { campDetailStore } from "$lib/stores/camp"
  import { formatInWorldDate } from "$lib/utils/time"
  import { connectWs, disconnectWs, sendCommand, wsConnected } from "$lib/ws"
  import { worldClock } from "$lib/wsHandler"
  import type { Snippet } from "svelte"
  import { onMount } from "svelte"

  let { children }: { children: Snippet } = $props()

  const campNpcs = $derived(
    ($campDetailStore?.npcs ?? []).filter(npc => npc.id !== $authStore.npcId),
  )
  const campName = $derived($campDetailStore?.name ?? null)

  onMount(() => {
    if (!$authStore.token) {
      goto("/login")
      return disconnectWs
    }
    if ($authStore.campId) {
      sendCommand({ type: "getCamp", campId: $authStore.campId })
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

  /** The player's own avatar entry — shown in the tray when npcId is available. */
  const playerEntry = $derived(
    $authStore.npcId
      ? {
          key: $authStore.npcId,
          npcId: $authStore.npcId,
          name: $authStore.username ?? "Player",
          location: campName ?? undefined,
        }
      : null,
  )
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
    {#if playerEntry}
      <NpcAvatar entry={playerEntry} />
    {/if}
    {#each campNpcs as npc}
      <NpcAvatar entry={{ key: npc.id, npcId: npc.id, name: npc.name, career: npc.career, location: campName ?? undefined }} />
    {/each}
  </div>
</div>

<NpcListPanel />
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
