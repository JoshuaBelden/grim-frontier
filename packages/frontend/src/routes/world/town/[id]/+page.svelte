<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/stores'
  import { apiGetTown, type TownResponse } from '$lib/api'

  let town = $state<TownResponse | null>(null)
  let error = $state<string | null>(null)

  onMount(async () => {
    const townId = $page.params.id
    try {
      town = await apiGetTown(townId)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load town'
    }
  })
</script>

<svelte:head>
  <title>{town?.name ?? 'Town'} — Grim Frontier</title>
</svelte:head>

<div class="view">
  <a href="/world" class="back">← Territory</a>

  {#if error}
    <p class="error">{error}</p>
  {:else if !town}
    <p class="muted">Loading…</p>
  {:else}
    <p class="type-label">Town</p>
    <h1>{town.name}</h1>
    <p class="muted placeholder">Nothing to see here yet. Check back when folk start gathering.</p>
  {/if}
</div>

<style>
  .view {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .back {
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
  }

  .type-label {
    color: #5a4020;
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  h1 {
    font-size: 1.75rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
  }

  .muted {
    color: #8a7060;
    font-size: 0.85rem;
  }

  .placeholder {
    max-width: 360px;
    line-height: 1.6;
  }

  .error {
    color: #c0512a;
    font-size: 0.85rem;
  }
</style>
