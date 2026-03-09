<script lang="ts">
  import { goto } from "$app/navigation"
  import { apiGetCamp, type CampResponse } from "$lib/api"
  import { authStore } from "$lib/stores/auth"
  import { npcPanelStore } from "$lib/stores/npcPanels"
  import { onMount } from "svelte"

  let camp = $state<CampResponse | null>(null)
  let error = $state<string | null>(null)

  onMount(async () => {
    const { campId } = $authStore
    if (!campId) {
      goto("/world/join")
      return
    }
    try {
      camp = await apiGetCamp(campId)
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load camp"
    }
  })
</script>

<svelte:head>
  <title>{camp?.name ?? "Camp"} — Grim Frontier</title>
</svelte:head>

<div class="view">
  <a href="/world" class="back">← Territory</a>

  {#if error}
    <p class="error">{error}</p>
  {:else if !camp}
    <p class="muted">Loading…</p>
  {:else}
    <p class="type-label">Camp</p>
    <h1>{camp.name}</h1>

    <section>
      <h2>Resources</h2>
      <div class="resources">
        <div class="resource">
          <span class="resource-label">Food</span>
          <span class="resource-value">{camp.resources.food}</span>
        </div>
        <div class="resource">
          <span class="resource-label">Supplies</span>
          <span class="resource-value">{camp.resources.supplies}</span>
        </div>
        <div class="resource">
          <span class="resource-label">Stability</span>
          <span class="resource-value">{camp.stability}</span>
        </div>
      </div>
    </section>

    <section>
      <h2>Roster</h2>
      {#if camp.npcs.length === 0}
        <p class="muted">No one's here yet. Attract someone worth keeping.</p>
      {:else}
        <ul class="roster">
          {#each camp.npcs as npc}
            <li>
              <button
                class="roster-btn"
                onclick={() => npcPanelStore.open({ key: npc.id, npcId: npc.id, name: npc.name, career: npc.career })}
              >
                <span class="npc-name">{npc.name}</span>
                <span class="npc-career">{npc.career.replace(/_/g, " ")}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}
</div>

<style>
  .view {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .back {
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .type-label {
    color: #5a4020;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: -1.5rem;
  }

  h1 {
    font-size: 1.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  h2 {
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #8a7060;
    border-bottom: 1px solid #2a1e0e;
    padding-bottom: 0.5rem;
  }

  .resources {
    display: flex;
    gap: 2rem;
  }

  .resource {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .resource-label {
    color: #5a4020;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .resource-value {
    font-size: 1.5rem;
    letter-spacing: 0.05em;
  }

  .roster {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .roster li {
    display: flex;
  }

  .roster-btn {
    align-items: baseline;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    display: flex;
    font-family: inherit;
    gap: 1rem;
    padding: 0.25rem 0;
    text-align: left;
    width: 100%;
  }

  .roster-btn:hover .npc-name {
    color: #d4b896;
  }

  .npc-name {
    font-size: 0.95rem;
  }

  .npc-career {
    color: #8a7060;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
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
