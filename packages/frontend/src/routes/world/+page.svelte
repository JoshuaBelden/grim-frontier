<script lang="ts">
  import { goto } from "$app/navigation"
  import { toAbsoluteHour } from "$lib/clock"
  import WorldMap from "$lib/components/map/WorldMap.svelte"
  import { authStore } from "$lib/stores/auth"
  import { worldMapStore } from "$lib/stores/worldMap"
  import { wsErrorStore } from "$lib/stores/wsError"
  import { sendCommand } from "$lib/ws"
  import { npcDetailStore, worldClock } from "$lib/wsHandler"
  import type { MapLandmark } from "@grim-frontier/shared"
  import { onMount } from "svelte"

  let worldGone = $state(false)

  onMount(() => {
    const { worldId } = $authStore
    if (!worldId) {
      goto("/world/join")
      return
    }
    sendCommand({ type: "getWorldMap", worldId })
  })

  const error = $derived($wsErrorStore?.command === "getWorldMap" ? $wsErrorStore.message : null)

  $effect(() => {
    if (error === "World map not found") {
      worldGone = true
      authStore.clearWorld()
    }
  })

  const npcTravel = $derived($worldMapStore?.npcTravel ?? null)
  const npcLocationKey = $derived($worldMapStore?.npcLocationKey ?? null)

  const playerNpc = $derived($authStore.npcId ? ($npcDetailStore.get($authStore.npcId) ?? null) : null)
  const npcAtCamp = $derived(playerNpc?.status === "at_camp")

  const travellingToName = $derived.by(() => {
    if (!npcTravel || !$worldMapStore) return null
    if (npcTravel.toLocationType === "camp") {
      return $worldMapStore.camp?.name ?? null
    }
    const landmark = $worldMapStore.landmarks.find(landmark => landmark.nodeKey === npcTravel.toLandmarkKey)
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
    sendCommand({ type: "travelTo", destinationId: landmark.id, destinationType: "town" })
  }

  function handleTravelToCamp(campId: string) {
    sendCommand({ type: "travelTo", destinationId: campId, destinationType: "camp" })
  }

  function portraitSrc(key: string): string {
    return `url('/images/portraits/portrait_${key}.png')`
  }

  function landmarkPortraitKey(name: string): string {
    return name.toLowerCase().replace(/\s+/g, "_")
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
    <p class="region-label">{$worldMapStore.regionName}</p>
    <h1>{$worldMapStore.name}</h1>

    {#if npcTravel && travellingToName}
      <div class="travel-status">
        <p class="travel-label">Travelling to {travellingToName}…</p>
        <div class="travel-bar">
          <div class="travel-bar-fill" style="width: {(travelProgress ?? 0) * 100}%"></div>
        </div>
        <p class="travel-eta">
          {#if travelHoursRemaining !== null && travelHoursRemaining > 0}
            {travelHoursRemaining} hour{travelHoursRemaining === 1 ? "" : "s"} remaining ({npcTravel.distanceMiles} mi on
            foot)
          {:else}
            Arriving…
          {/if}
        </p>
      </div>
    {/if}

    <div class="nodes">
      {#if $worldMapStore.camp}
        {@const camp = $worldMapStore.camp}
        <a
          href="/world/camp"
          class="node"
          class:node--current={npcAtCamp}
          style="background-image: {portraitSrc('camp')}"
        >
          <span class="node-name">{camp.name}</span>
          {#if npcAtCamp}
            <span class="node-current-label">Current Location</span>
          {/if}
          <div class="node-actions">
            {#if !npcTravel && !npcAtCamp}
              <button
                class="node-action node-action--travel"
                onclick={event => {
                  event.preventDefault()
                  handleTravelToCamp(camp.id)
                }}
              >
                Travel
              </button>
            {/if}
          </div>
        </a>
      {:else}
        <div class="node node--empty">
          <span class="node-name muted">No camp</span>
        </div>
      {/if}

      {#each $worldMapStore.landmarks as landmark}
        {@const isCurrentLocation = npcLocationKey === landmark.nodeKey}
        <a
          href="/world/town/{landmark.id}"
          class="node"
          class:node--current={isCurrentLocation}
          style="background-image: {portraitSrc(landmarkPortraitKey(landmark.name))}"
        >
          <span class="node-name">{landmark.name}</span>
          <span class="node-type">{landmark.type}</span>
          {#if isCurrentLocation}
            <span class="node-current-label">Current Location</span>
          {/if}
          <div class="node-actions">
            {#if !npcTravel && !isCurrentLocation}
              <button
                class="node-action node-action--travel"
                onclick={event => {
                  event.preventDefault()
                  handleTravel(landmark)
                }}
              >
                Travel
              </button>
            {/if}
          </div>
        </a>
      {/each}
    </div>

    <WorldMap
      landmarks={$worldMapStore.landmarks}
      connections={$worldMapStore.connections}
      camp={$worldMapStore.camp}
      onLandmarkClick={handleLandmarkClick}
      onCampClick={handleCampClick}
    />
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
    margin-bottom: 1.5rem;
  }

  .travel-status {
    border: 1px solid #5a4020;
    margin-bottom: 1.5rem;
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
    width: 100%;
    margin-bottom: 2rem;
  }

  .node {
    border: 1px solid #5a4020;
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.5rem;
    min-height: 120px;
    min-width: 140px;
    padding: 1.5rem 1.75rem;
    position: relative;
    text-decoration: none;
    transition: border-color 0.2s, transform 0.2s;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .node::before {
    content: "";
    inset: 0;
    position: absolute;
    background: rgba(15, 8, 3, 0.6);
    transition: opacity 0.4s;
  }

  .node > * {
    position: relative;
    z-index: 1;
  }

  .node:hover {
    border-color: #d4b896;
    transform: scaleY(1.07);
  }

  .node:hover::before {
    opacity: 0.5;
  }

  .node--empty {
    opacity: 0.4;
  }

  .node-type {
    color: #fff;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .node-name {
    color: #e8d5b8;
    font-size: 1.2rem;
    letter-spacing: 0.05em;
  }

  .node-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .node-action {
    color: #d4b896;
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-decoration: none;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    text-transform: uppercase;
  }

  .node-action:hover {
    color: #fff;
  }

  .node-action--travel {
    background: none;
    border: 1px solid #8a7060;
    font-family: inherit;
    padding: 0.35rem 0.9rem;
    transition: border-color 0.15s, color 0.15s;
  }

  .node-action--travel:hover {
    border-color: #d4b896;
    color: #fff;
  }

  .node--current {
    border-color: #6a8ab0;
  }

  .node-current-label {
    color: #a0c0d8;
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .muted {
    color: #5a4020;
  }

  .error {
    color: #c0512a;
    font-size: 0.85rem;
  }

  .territory {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
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
