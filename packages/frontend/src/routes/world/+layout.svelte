<script lang="ts">
  import { goto } from "$app/navigation"
  import { apiLogout } from "$lib/api"
  import JoinRequestModal from "$lib/components/camp/JoinRequestModal.svelte"
  import NpcInventoryPanel from "$lib/components/npc/NpcInventoryPanel.svelte"
  import NpcListPanel from "$lib/components/npc/NpcListPanel.svelte"
  import NpcPanels from "$lib/components/npc/NpcPanels.svelte"
  import { authStore } from "$lib/stores/auth"
  import { campDetailStore } from "$lib/stores/camp"
  import { npcPanelStore } from "$lib/stores/npcPanels"
  import { formatInWorldDate } from "$lib/utils/time"
  import { formatWeatherReport } from "$lib/utils/weather"
  import { connectWs, disconnectWs, sendCommand, wsConnected } from "$lib/ws"
  import { npcDetailStore, weatherStore, worldClock } from "$lib/wsHandler"
  import type { Snippet } from "svelte"
  import { onMount } from "svelte"

  let { children }: { children: Snippet } = $props()

  let npcListVisible = $state(false)
  let inventoryVisible = $state(false)

  const playerNpc = $derived($authStore.npcId ? $npcDetailStore.get($authStore.npcId) ?? null : null)

  onMount(() => {
    if (!$authStore.token) {
      goto("/login")
      return disconnectWs
    }
    if ($authStore.campId) {
      sendCommand({ type: "getCamp", campId: $authStore.campId })
    }
    if ($authStore.npcId) {
      sendCommand({ type: "getNpc", npcId: $authStore.npcId })
    }
    sendCommand({ type: "listJoinRequests" })
    return disconnectWs
  })

  $effect(() => {
    if ($authStore.worldId) {
      connectWs()
    } else {
      disconnectWs()
    }
  })

  async function handleLogout() {
    disconnectWs()
    await apiLogout().catch(() => {})
    authStore.clear()
    goto("/login")
  }

  function openPlayerPanel() {
    if (!$authStore.npcId) return
    npcPanelStore.open({
      key: $authStore.npcId,
      npcId: $authStore.npcId,
      name: playerNpc?.name ?? $authStore.username ?? "Player",
      career: playerNpc?.career,
      location: playerNpc?.locationName ?? undefined,
    })
  }

  /** Returns a severity class for a vital value (higher = better for health/morale, lower = better for fatigue/hunger). */
  function vitalSeverity(value: number, inverted: boolean): string {
    const effective = inverted ? 10 - value : value
    if (effective >= 7) return "good"
    if (effective >= 4) return "warn"
    if (effective >= 2) return "bad"
    return "critical"
  }

  function formatAction(action: string): string {
    return action.replace(/_/g, " ")
  }

  function formatStatus(status: string): string {
    return status.replace(/_/g, " ")
  }
</script>

<div class="shell">
  <header>
    {#if playerNpc}
      <button class="player-npc" onclick={openPlayerPanel}>
        <div class="pn-identity">
          <img src="/images/default-avatar.png" alt={playerNpc.name} class="pn-portrait" />
          <div class="pn-info">
            <span class="pn-name">{playerNpc.name}</span>
            <span class="pn-status">{formatStatus(playerNpc.status)}</span>
            {#if playerNpc.status === "travelling" && playerNpc.travelDestination}
              <span class="pn-location travelling">Heading to {playerNpc.travelDestination}</span>
            {:else if playerNpc.locationName}
              <span class="pn-location">{playerNpc.locationName}</span>
            {/if}
            <span class="pn-money">${(playerNpc.money ?? 0).toFixed(2)}</span>
            {#if playerNpc.status !== "travelling"}
              {#if playerNpc.status === "at_camp" || playerNpc.status === "in_town"}
                {@const npcInCamp = $campDetailStore?.npcs.find(npc => npc.id === playerNpc.id)}
                {#if npcInCamp?.currentAction?.type}
                  <span class="pn-action">{formatAction(npcInCamp.currentAction.type)}</span>
                {:else}
                  <span class="pn-action idle">Idle</span>
                {/if}
              {/if}
            {/if}
          </div>
        </div>
        <div class="pn-vitals">
          <div class="pn-vital">
            <span class="pn-vital-label">HP</span>
            <div class="pn-bar"><div class="pn-bar-fill severity-{vitalSeverity(playerNpc.health, false)}" style="width: {playerNpc.health * 10}%"></div></div>
          </div>
          <div class="pn-vital">
            <span class="pn-vital-label">MR</span>
            <div class="pn-bar"><div class="pn-bar-fill severity-{vitalSeverity(playerNpc.morale, false)}" style="width: {playerNpc.morale * 10}%"></div></div>
          </div>
          <div class="pn-vital">
            <span class="pn-vital-label">HG</span>
            <div class="pn-bar"><div class="pn-bar-fill severity-{vitalSeverity(playerNpc.hunger, true)}" style="width: {playerNpc.hunger * 10}%"></div></div>
          </div>
          <div class="pn-vital">
            <span class="pn-vital-label">FT</span>
            <div class="pn-bar"><div class="pn-bar-fill severity-{vitalSeverity(playerNpc.fatigue, true)}" style="width: {playerNpc.fatigue * 10}%"></div></div>
          </div>
        </div>
      </button>
    {/if}

    <div class="world-clock">
      {#if $worldClock}
        <div class="clock-date">{formatInWorldDate($worldClock)}</div>
      {/if}
      {#if $weatherStore}
        <div class="weather">{formatWeatherReport($weatherStore)}</div>
      {/if}
    </div>

    <div class="meta">
      {#if $authStore.username}
        <span class="player">{$authStore.username}</span>
      {/if}
      <span class="ws-dot" class:connected={$wsConnected} title={$wsConnected ? "Connected" : "Disconnected"}></span>
      <button class="logout-btn" onclick={handleLogout}>Logout</button>
    </div>
  </header>

  <nav class="site-nav">
    <button class="nav-btn" onclick={() => (npcListVisible = !npcListVisible)}>NPCs</button>
    {#if playerNpc?.status === "at_camp"}
      <button class="nav-btn" onclick={() => (inventoryVisible = !inventoryVisible)}>Camp Inventory</button>
    {/if}
  </nav>

  <div class="content">
    {@render children()}
  </div>
</div>

<NpcListPanel bind:visible={npcListVisible} />
<NpcInventoryPanel bind:visible={inventoryVisible} />
<NpcPanels />
<JoinRequestModal />

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
    gap: 1rem;
    padding: 0.5rem 1.5rem;
  }

  .world-clock {
    flex: 1;
    text-align: center;
    color: #c4a882;
    letter-spacing: 0.08em;
  }

  .clock-date {
    font-size: 1rem;
    color: #d4b896;
  }

  .weather {
    font-size: 0.85rem;
    margin-top: 0.2rem;
    color: #c4a882;
  }

  .meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-left: auto;
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

  .logout-btn {
    background: none;
    border: 1px solid #5a4020;
    border-radius: 3px;
    color: #8a7060;
    cursor: pointer;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    padding: 0.2rem 0.5rem;
    text-transform: uppercase;
  }

  .logout-btn:hover {
    border-color: #8a7060;
    color: #c4a882;
  }

  .player-npc {
    background: none;
    border: none;
    border-right: 1px solid #2a1e0e;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem 0.5rem 0;
    text-align: left;
    transition: background 0.15s;
    flex-shrink: 0;
  }

  .player-npc:hover {
    background: #221608;
  }

  .pn-identity {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }

  .pn-portrait {
    height: 44px;
    width: 44px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .pn-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .pn-name {
    color: #d4b896;
    font-size: 0.85rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pn-status {
    color: #8a7060;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .pn-location {
    color: #5a4020;
    font-size: 0.65rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pn-location.travelling {
    color: #9a8a4a;
    font-style: italic;
  }

  .pn-money {
    color: #c8a050;
    font-size: 0.65rem;
    letter-spacing: 0.06em;
  }

  .pn-action {
    color: #7a9a4a;
    font-size: 0.65rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .pn-action.idle {
    color: #5a4020;
  }

  .pn-vitals {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 140px;
    flex-shrink: 0;
  }

  .pn-vital {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .pn-vital-label {
    color: #5a4020;
    font-size: 0.6rem;
    letter-spacing: 0.04em;
    width: 18px;
    text-transform: uppercase;
  }

  .pn-bar {
    background: #1e1508;
    border: 1px solid #2a1e0e;
    flex: 1;
    height: 5px;
  }

  .pn-bar-fill {
    height: 100%;
    transition: width 0.3s ease;
  }

  .severity-good {
    background: #3a6b30;
  }

  .severity-warn {
    background: #6b5a30;
  }

  .severity-bad {
    background: #6b3a20;
  }

  .severity-critical {
    background: #6b2020;
  }

  .site-nav {
    border-bottom: 1px solid #2a1e0e;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.4rem 1.5rem;
    min-height: 2rem;
  }

  .nav-btn {
    background: none;
    border: none;
    color: #8a7060;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    padding: 0.2rem 0;
    text-transform: uppercase;
    transition: color 0.15s;
  }

  .nav-btn:hover {
    color: #d4b896;
  }

  .content {
    flex: 1;
    padding: 2rem 1.5rem;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
</style>
