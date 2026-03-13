<script lang="ts">
  import { page } from "$app/stores"
  import StoreCatalogModal from "$lib/components/store/StoreCatalogModal.svelte"
  import SellModal from "$lib/components/store/SellModal.svelte"
  import { authStore } from "$lib/stores/auth"
  import { wsErrorStore } from "$lib/stores/wsError"
  import { sendCommand } from "$lib/ws"
  import { townDetailStore, npcDetailStore } from "$lib/wsHandler"
  import type { TownDetailStore } from "@grim-frontier/shared"
  import { onMount } from "svelte"

  let town = $derived($townDetailStore)
  let selectedStore: TownDetailStore | null = $state(null)
  let sellStore: TownDetailStore | null = $state(null)

  const error = $derived($wsErrorStore?.command === "getTown" ? $wsErrorStore.message : null)

  let playerNpc = $derived($authStore.npcId ? ($npcDetailStore.get($authStore.npcId) ?? null) : null)
  let npcIsHere = $derived(playerNpc?.locationId === $page.params.id && playerNpc?.locationType === "town")

  let npcMoney = $derived(npcIsHere ? (playerNpc?.money ?? undefined) : undefined)

  onMount(() => {
    const townId = $page.params.id
    if (!townId) return
    townDetailStore.set(null)
    sendCommand({ type: "getTown", townId })
  })

  function formatStoreType(type: string): string {
    return type.replace(/_/g, " ")
  }

  function openSell(event: MouseEvent, store: TownDetailStore) {
    event.stopPropagation()
    sellStore = store
  }
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
    <p class="type-label">{town.name === "Dustercreek" ? "Town" : "Settlement"}</p>
    <h1>{town.name}</h1>

    {#if town.stores && town.stores.length > 0}
      <div class="store-grid">
        {#each [...town.stores].sort((a, b) => a.name.localeCompare(b.name)) as store}
          <div class="store-slot">
            <button class="store-card" onclick={() => (selectedStore = store)}>
              <span class="store-type-label">{formatStoreType(store.type)}</span>
              <span class="store-name">{store.name}</span>
              <span class="store-description">{store.description}</span>
              <span class="store-proprietor">{store.proprietor}</span>
            </button>
            {#if npcIsHere && store.type === "general_store" && $authStore.npcId}
              <button class="sell-btn" onclick={event => openSell(event, store)}>Sell Goods</button>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <p class="muted placeholder">Nothing to see here yet. Check back when folk start gathering.</p>
    {/if}
  {/if}
</div>

{#if selectedStore}
  <StoreCatalogModal
    store={selectedStore}
    npcId={npcIsHere && $authStore.npcId ? $authStore.npcId : undefined}
    npcMoney={npcMoney}
    onClose={() => (selectedStore = null)}
  />
{/if}

{#if sellStore && $authStore.npcId}
  <SellModal store={sellStore} npcId={$authStore.npcId} onClose={() => (sellStore = null)} />
{/if}

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

  .store-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 0.75rem;
  }

  .store-slot {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .store-card {
    background: #120c04;
    border: 1px solid #2a1e0e;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.25rem;
    min-height: 100px;
    padding: 1rem 1.25rem;
    text-align: left;
    text-transform: none;
    letter-spacing: normal;
    font-size: inherit;
    transition: border-color 0.15s;
  }

  .store-card:hover {
    background: #1e150a;
    border-color: #5a4020;
    color: #d4b896;
  }

  .store-type-label {
    color: #5a4020;
    font-size: 0.55rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .store-name {
    color: #d4b896;
    font-family: "ChauPhilomeneOne", sans-serif;
    font-size: 1.05rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .store-description {
    color: #8a7060;
    font-size: 0.75rem;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .store-proprietor {
    color: #6a5040;
    font-family: "Corinthia", cursive;
    font-size: 1.1rem;
    margin-top: 0.15rem;
  }

  .sell-btn {
    background: #1a1208;
    border: 1px solid #4a3418;
    color: #c8a050;
    cursor: pointer;
    font-size: 0.6rem;
    letter-spacing: 0.16em;
    padding: 0.4rem 0.75rem;
    text-align: center;
    text-transform: uppercase;
    transition: background 0.15s, border-color 0.15s;
  }

  .sell-btn:hover {
    background: #2a1e0c;
    border-color: #c8a050;
  }
</style>
