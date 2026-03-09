<script lang="ts">
  import { goto } from "$app/navigation"
  import { apiGetWorlds, apiJoinWorld, type WorldListItem } from "$lib/api"
  import { authStore } from "$lib/stores/auth"
  import { onMount } from "svelte"

  let worlds = $state<WorldListItem[]>([])
  let loadError = $state<string | null>(null)
  let joiningId = $state<string | null>(null)
  let joinError = $state<string | null>(null)

  let customId = $state("")
  let customLoading = $state(false)
  let customError = $state<string | null>(null)

  onMount(async () => {
    try {
      worlds = await apiGetWorlds()
    } catch (err) {
      loadError = err instanceof Error ? err.message : "Failed to load worlds"
    }
  })

  async function joinWorld(worldId: string) {
    joiningId = worldId
    joinError = null
    try {
      const result = await apiJoinWorld(worldId)
      authStore.setWorld(result.worldId, result.campId, result.npcId)
      goto("/world")
    } catch (err) {
      joinError = err instanceof Error ? err.message : "Failed to join world"
    } finally {
      joiningId = null
    }
  }

  async function handleCustomSubmit(event: SubmitEvent) {
    event.preventDefault()
    customError = null
    customLoading = true
    try {
      const result = await apiJoinWorld(customId.trim())
      authStore.setWorld(result.worldId, result.campId, result.npcId)
      goto("/world")
    } catch (err) {
      customError = err instanceof Error ? err.message : "Failed to join world"
    } finally {
      customLoading = false
    }
  }

  function formatDate(date: WorldListItem["inWorldDate"]) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${months[date.month - 1]} ${date.day}, ${date.year}`
  }
</script>

<svelte:head>
  <title>Join World — Grim Frontier</title>
</svelte:head>

<div class="view">
  <h1>Join a World</h1>

  {#if loadError}
    <p class="error">{loadError}</p>
  {:else if worlds.length === 0}
    <p class="muted">No active worlds found.</p>
  {:else}
    <ul class="world-list">
      {#each worlds as world}
        <li class="world-row">
          <div class="world-info">
            <span class="world-name">{world.name}</span>
            <span class="world-date">{formatDate(world.inWorldDate)}</span>
          </div>
          <button onclick={() => joinWorld(world.id)} disabled={joiningId !== null}>
            {joiningId === world.id ? "Joining…" : "Join"}
          </button>
        </li>
      {/each}
    </ul>
    {#if joinError}
      <p class="error">{joinError}</p>
    {/if}
  {/if}

  <div class="divider">
    <span>or enter a world id</span>
  </div>

  <form onsubmit={handleCustomSubmit} class="custom-form">
    <input type="text" bind:value={customId} placeholder="e.g. 507f1f77bcf86cd799439011" />
    {#if customError}
      <p class="error">{customError}</p>
    {/if}
    <button type="submit" disabled={customLoading}>
      {customLoading ? "Joining…" : "Join by ID"}
    </button>
  </form>
</div>

<style>
  .view {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    max-width: 480px;
  }

  h1 {
    font-size: 1.5rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .world-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .world-row {
    border: 1px solid #2a1e0e;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
  }

  .world-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .world-name {
    font-size: 0.95rem;
    letter-spacing: 0.05em;
  }

  .world-date {
    color: #5a4020;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .divider {
    align-items: center;
    display: flex;
    gap: 0.75rem;
  }

  .divider::before,
  .divider::after {
    content: "";
    flex: 1;
    border-top: 1px solid #2a1e0e;
  }

  .divider span {
    color: #5a4020;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .custom-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .muted {
    color: #8a7060;
    font-size: 0.85rem;
  }

  .error {
    color: #c0512a;
    font-size: 0.85rem;
  }
</style>
