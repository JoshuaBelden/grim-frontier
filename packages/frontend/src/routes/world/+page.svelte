<script lang="ts">
  import { goto } from "$app/navigation"
  import { apiGetWorldMap, type MapLandmark, type WorldMapResponse } from "$lib/api"
  import WorldMap from "$lib/components/map/WorldMap.svelte"
  import { authStore } from "$lib/stores/auth"
  import { onMount } from "svelte"

  let map = $state<WorldMapResponse | null>(null)
  let error = $state<string | null>(null)
  let worldGone = $state(false)

  onMount(async () => {
    const { worldId } = $authStore
    if (!worldId) {
      goto("/world/join")
      return
    }
    try {
      map = await apiGetWorldMap(worldId)
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load map"
      if (error === "World map not found") {
        worldGone = true
        authStore.clearWorld()
      }
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
{:else if !map}
  <p class="muted">Loading territory…</p>
{:else}
  <div class="territory">
    <p class="region-label">Dustercreek Valley</p>
    <h1>{map.territory.name}</h1>

    <WorldMap
      landmarks={map.territory.landmarks}
      connections={map.territory.connections}
      camp={map.territory.camp}
      onLandmarkClick={handleLandmarkClick}
      onCampClick={handleCampClick}
    />

    <div class="nodes">
      {#each map.territory.landmarks as landmark}
        <a href="/world/town/{landmark.id}" class="node">
          <span class="node-type">{landmark.type}</span>
          <span class="node-name">{landmark.name}</span>
          <span class="node-hint">Enter →</span>
        </a>
      {/each}

      {#if map.territory.camp}
        <a href="/world/camp" class="node">
          <span class="node-type">Camp</span>
          <span class="node-name">{map.territory.camp.name}</span>
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
