<script lang="ts">
  import { page } from "$app/stores"
  import { wsErrorStore } from "$lib/stores/wsError"
  import { sendCommand } from "$lib/ws"
  import { townDetailStore } from "$lib/wsHandler"
  import { onMount } from "svelte"

  let town = $derived($townDetailStore)

  const error = $derived(
    $wsErrorStore?.command === "getTown" ? $wsErrorStore.message : null,
  )

  onMount(() => {
    const townId = $page.params.id
    if (!townId) return
    townDetailStore.set(null)
    sendCommand({ type: "getTown", townId })
  })
</script>

<svelte:head>
  <title>{town?.name ?? "Town"} — Grim Frontier</title>
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
