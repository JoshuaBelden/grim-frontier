<script lang="ts">
  import { goto } from "$app/navigation"
  import type { MapLandmark } from "@grim-frontier/shared"
  import WorldMap from "$lib/components/map/WorldMap.svelte"
  import { authStore } from "$lib/stores/auth"
  import { worldMapStore } from "$lib/stores/worldMap"
  import { wsErrorStore } from "$lib/stores/wsError"
  import { worldClock } from "$lib/wsHandler"
  import { sendCommand } from "$lib/ws"
  import { onMount } from "svelte"
  import { toAbsoluteHour } from "$lib/clock"

  let worldGone = $state(false)

  onMount(() => {
    const { worldId } = $authStore
    if (!worldId) {
      goto("/world/join")
      return
    }
    sendCommand({ type: "getWorldMap", worldId })
  })

  const error = $derived(
    $wsErrorStore?.command === "getWorldMap" ? $wsErrorStore.message : null,
  )

  $effect(() => {
    if (error === "World map not found") {
      worldGone = true
      authStore.clearWorld()
    }
  })

  const npcTravel = $derived($worldMapStore?.npcTravel ?? null)
  const npcLocationKey = $derived($worldMapStore?.npcLocationKey ?? null)

  const travellingToName = $derived.by(() => {
    if (!npcTravel || !$worldMapStore) return null
    const landmark = $worldMapStore.landmarks.find(
      landmark => landmark.nodeKey === npcTravel.toLandmarkKey,
    )
    return landmark?.name ?? null
  })

  const travelProgress = $derived.by(() => {
    if (!npcTravel || !$worldClock) return null
    const currentHour = toAbsoluteHour($worldClock)
    const total = npcTravel.arrivalHour - npcTravel.departedHour
    if (total <= 0) return 1
    const elapsed = currentHour - npcTravel.departedHour
    return Math.min(1, Math.max(0, elapsed / total))
  })

  const travelHoursRemaining = $derived.by(() => {
    if (!npcTravel || !$worldClock) return null
    const currentHour = toAbsoluteHour($worldClock)
    return Math.max(0, npcTravel.arrivalHour - currentHour)
  })

  function handleLandmarkClick(landmark: MapLandmark) {
    goto(`/world/town/${landmark.id}`)
  }

  function handleCampClick() {
    goto("/world/camp")
  }

  function handleTravel(landmark: MapLandmark) {
    sendCommand({ type: "travelToTown", townId: landmark.id })
  }

  function handleReturnToCamp() {
    sendCommand({ type: "returnToCamp" })
  }
</script>

<svelte:head>
  <title>Territory — Grim Frontier</title>
</svelte:head>

{#if worldGone}
  <div class="gone">
    <p class="error">This world no longer exists.</p>
    <a href="/world/join" class="join-link">Join a new world →</a>
  </div>
{:else if error}
  <p class="error">{error}</p>
{:else if !$worldMapStore}
  <p class="muted">Loading territory…</p>
{:else}
  <div class="territory">
    <p class="region-label">Dustercreek Valley</p>
    <h1>{$worldMapStore.name}</h1>

    {#if npcTravel && travellingToName}
      <div class="travel-status">
        <p class="travel-label">Travelling to {travellingToName}…</p>
        <div class="travel-bar">
          <div class="travel-bar-fill" style="width: {(travelProgress ?? 0) * 100}%"></div>
        </div>
        <p class="travel-eta">
          {#if travelHoursRemaining !== null && travelHoursRemaining > 0}
            {travelHoursRemaining} hour{travelHoursRemaining === 1 ? "" : "s"} remaining
            ({npcTravel.distanceMiles} mi on foot)
          {:else}
            Arriving…
          {/if}
        </p>
      </div>
    {/if}

    <WorldMap
      landmarks={$worldMapStore.landmarks}
      connections={$worldMapStore.connections}
      camp={$worldMapStore.camp}
      onLandmarkClick={handleLandmarkClick}
      onCampClick={handleCampClick}
    />

    <div class="nodes">
      {#each $worldMapStore.landmarks as landmark}
        {@const isCurrentLocation = npcLocationKey === landmark.nodeKey}
        <div class="node" class:node--current={isCurrentLocation}>
          <span class="node-type">{landmark.type}</span>
          <span class="node-name">{landmark.name}</span>
          {#if isCurrentLocation}
            <span class="node-current-label">Current Location</span>
          {/if}
          <div class="node-actions">
            <a href="/world/town/{landmark.id}" class="node-action">View</a>
            {#if !npcTravel && !isCurrentLocation}
              <button class="node-action node-action--travel" onclick={() => handleTravel(landmark)}>
                Travel
              </button>
            {/if}
          </div>
          {#if isCurrentLocation && !npcTravel}
            <button class="node-action node-action--return" onclick={handleReturnToCamp}>
              Return to Camp
            </button>
          {/if}
        </div>
      {/each}

      {#if $worldMapStore.camp}
        <a href="/world/camp" class="node">
          <span class="node-type">Camp</span>
          <span class="node-name">{$worldMapStore.camp.name}</span>
          <span class="node-hint">Enter →</span>
        </a>
      {:else}
        <div class="node node--empty">
          <span class="node-type">Camp</span>
          <span class="node-name muted">No camp</span>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .region-label {
    color: #5a4020;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }

  h1 {
    font-size: 1.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 2.5rem;
  }

  .travel-status {
    border: 1px solid #5a4020;
    margin-bottom: 2rem;
    padding: 1.25rem 1.5rem;
  }

  .travel-label {
    color: #d4b896;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    margin-bottom: 0.75rem;
  }

  .travel-bar {
    background: #2a1a0a;
    border: 1px solid #5a4020;
    height: 6px;
    margin-bottom: 0.5rem;
    overflow: hidden;
  }

  .travel-bar-fill {
    background: #d4b896;
    height: 100%;
    transition: width 0.5s ease;
  }

  .travel-eta {
    color: #8a7060;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
  }

  .nodes {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .node {
    border: 1px solid #5a4020;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1.25rem 1.5rem;
    text-decoration: none;
    width: 200px;
    transition: border-color 0.15s;
  }

  .node:hover {
    border-color: #d4b896;
  }

  .node--empty {
    opacity: 0.4;
  }

  .node-type {
    color: #5a4020;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .node-name {
    font-size: 1rem;
    letter-spacing: 0.05em;
  }

  .node-hint {
    color: #8a7060;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    margin-top: 0.25rem;
  }

  .node-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.25rem;
  }

  .node-action {
    color: #8a7060;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.15s;
  }

  .node-action:hover {
    color: #d4b896;
  }

  .node-action--travel {
    background: none;
    border: none;
    font-family: inherit;
    padding: 0;
  }

  .node--current {
    border-color: #6a8ab0;
  }

  .node-current-label {
    color: #6a8ab0;
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .node-action--return {
    background: none;
    border: 1px solid #5a4020;
    color: #8a7060;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    margin-top: 0.25rem;
    padding: 0.3rem 0.6rem;
    transition: border-color 0.15s, color 0.15s;
  }

  .node-action--return:hover {
    border-color: #d4b896;
    color: #d4b896;
  }

  .muted {
    color: #5a4020;
  }

  .error {
    color: #c0512a;
    font-size: 0.85rem;
  }

  .gone {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .join-link {
    color: #d4b896;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
  }
</style>
