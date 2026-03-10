<script lang="ts">
  import { goto } from "$app/navigation"
  import type { MapLandmark } from "@grim-frontier/shared"
  import WorldMap from "$lib/components/map/WorldMap.svelte"
  import { authStore } from "$lib/stores/auth"
  import { worldMapStore } from "$lib/stores/worldMap"
  import { wsErrorStore } from "$lib/stores/wsError"
  import { sendCommand } from "$lib/ws"
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

  const error = $derived(
    $wsErrorStore?.command === "getWorldMap" ? $wsErrorStore.message : null,
  )

  $effect(() => {
    if (error === "World map not found") {
      worldGone = true
      authStore.clearWorld()
    }
  })

  function handleLandmarkClick(landmark: MapLandmark) {
    goto(`/world/town/${landmark.id}`)
  }

  function handleCampClick() {
    goto("/world/camp")
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

    <WorldMap
      landmarks={$worldMapStore.landmarks}
      connections={$worldMapStore.connections}
      camp={$worldMapStore.camp}
      onLandmarkClick={handleLandmarkClick}
      onCampClick={handleCampClick}
    />

    <div class="nodes">
      {#each $worldMapStore.landmarks as landmark}
        <a href="/world/town/{landmark.id}" class="node">
          <span class="node-type">{landmark.type}</span>
          <span class="node-name">{landmark.name}</span>
          <span class="node-hint">Enter →</span>
        </a>
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
