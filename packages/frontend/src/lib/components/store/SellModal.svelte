<script lang="ts">
  import type { FoodInventoryItem, FuelInventoryItem, InventoryItem, TownDetailStore } from "@grim-frontier/shared"
  import { sendCommand } from "$lib/ws"
  import { npcDetailStore } from "$lib/wsHandler"

  let { store, npcId, onClose }: { store: TownDetailStore; npcId: string; onClose: () => void } = $props()

  const RAW_FOOD_RATE = 0.03
  const STICKS_RATE = 0.02

  let lastEarned = $state<number | null>(null)
  let rawFoodQty = $state(0)
  let sticksQty = $state(0)
  let initialized = $state(false)

  let npc = $derived($npcDetailStore.get(npcId) ?? null)

  let maxRawFood = $derived(
    npc?.inventory
      .filter(item => item.type === "food" && (item as FoodInventoryItem).subtype === "raw")
      .reduce((sum, item) => sum + item.count, 0) ?? 0,
  )

  let maxSticks = $derived(
    npc?.inventory
      .filter(item => item.type === "fuel" && (item as FuelInventoryItem).subtype === "sticks")
      .reduce((sum, item) => sum + item.count, 0) ?? 0,
  )

  $effect(() => {
    if (!npc) return
    if (!initialized) {
      rawFoodQty = maxRawFood
      sticksQty = maxSticks
      initialized = true
      return
    }
    if (rawFoodQty > maxRawFood) rawFoodQty = maxRawFood
    if (sticksQty > maxSticks) sticksQty = maxSticks
  })

  let totalPayout = $derived(
    Math.round((rawFoodQty * RAW_FOOD_RATE + sticksQty * STICKS_RATE) * 100) / 100,
  )

  let canSell = $derived(rawFoodQty > 0 || sticksQty > 0)

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) onClose()
  }

  /** Distributes a requested qty across available inventory stacks. */
  function buildSellItems(): InventoryItem[] {
    if (!npc) return []
    const items: InventoryItem[] = []

    let remaining = rawFoodQty
    for (const item of npc.inventory) {
      if (remaining <= 0) break
      if (item.type === "food" && (item as FoodInventoryItem).subtype === "raw") {
        const take = Math.min(remaining, item.count)
        if (take > 0) items.push({ ...item, count: take } as FoodInventoryItem)
        remaining -= take
      }
    }

    if (sticksQty > 0) {
      items.push({ type: "fuel", subtype: "sticks", count: sticksQty })
    }

    return items
  }

  function sell() {
    if (!npc || !canSell) return
    lastEarned = totalPayout
    sendCommand({ type: "sellItems", npcId, storeId: store.id, items: buildSellItems() })
  }

  function setRawFood(value: number) {
    rawFoodQty = Math.max(0, Math.min(maxRawFood, isNaN(value) ? 0 : value))
  }

  function setSticks(value: number) {
    sticksQty = Math.max(0, Math.min(maxSticks, isNaN(value) ? 0 : value))
  }

  function formatMoney(amount: number): string {
    return "$" + amount.toFixed(2)
  }
</script>

<div class="overlay" role="dialog" aria-modal="true" onclick={handleOverlayClick}>
  <div class="modal">
    <button class="close-btn" onclick={onClose}>&#x2715;</button>

    <div class="modal-header">
      <span class="store-type">general store</span>
      <h2 class="store-name">{store.name}</h2>
      <span class="modal-subtitle">Sell Goods</span>
    </div>

    <div class="modal-rule"></div>

    <div class="modal-body">
      {#if !npc}
        <p class="muted">Loading…</p>
      {:else}
        <div class="balance-row">
          <span class="balance-label">Current Funds</span>
          <span class="balance-amount">{formatMoney(npc.money ?? 0)}</span>
        </div>

        {#if lastEarned !== null}
          <div class="earned-notice">Received {formatMoney(lastEarned)}</div>
        {/if}

        <div class="items-table">
          <div class="table-header">
            <span>Item</span>
            <span class="col-qty">Qty</span>
            <span class="col-rate">Rate</span>
            <span class="col-total">Total</span>
          </div>

          <div class="table-row" class:empty={maxRawFood === 0}>
            <span class="item-name">Raw Food</span>
            <div class="qty-cell">
              <button
                class="stepper"
                onclick={() => setRawFood(rawFoodQty - 1)}
                disabled={rawFoodQty === 0 || maxRawFood === 0}
              >−</button>
              <input
                class="qty-input"
                type="number"
                min="0"
                max={maxRawFood}
                value={rawFoodQty}
                oninput={event => setRawFood(+(event.target as HTMLInputElement).value)}
                disabled={maxRawFood === 0}
              />
              <button
                class="stepper"
                onclick={() => setRawFood(rawFoodQty + 1)}
                disabled={rawFoodQty >= maxRawFood}
              >+</button>
              <button
                class="max-btn"
                onclick={() => setRawFood(maxRawFood)}
                disabled={rawFoodQty >= maxRawFood}
              >max</button>
              <span class="available">/{maxRawFood}</span>
            </div>
            <span class="item-rate">{formatMoney(RAW_FOOD_RATE)}/ea</span>
            <span class="item-total">{formatMoney(rawFoodQty * RAW_FOOD_RATE)}</span>
          </div>

          <div class="table-row" class:empty={maxSticks === 0}>
            <span class="item-name">Sticks</span>
            <div class="qty-cell">
              <button
                class="stepper"
                onclick={() => setSticks(sticksQty - 1)}
                disabled={sticksQty === 0 || maxSticks === 0}
              >−</button>
              <input
                class="qty-input"
                type="number"
                min="0"
                max={maxSticks}
                value={sticksQty}
                oninput={event => setSticks(+(event.target as HTMLInputElement).value)}
                disabled={maxSticks === 0}
              />
              <button
                class="stepper"
                onclick={() => setSticks(sticksQty + 1)}
                disabled={sticksQty >= maxSticks}
              >+</button>
              <button
                class="max-btn"
                onclick={() => setSticks(maxSticks)}
                disabled={sticksQty >= maxSticks}
              >max</button>
              <span class="available">/{maxSticks}</span>
            </div>
            <span class="item-rate">{formatMoney(STICKS_RATE)}/ea</span>
            <span class="item-total">{formatMoney(sticksQty * STICKS_RATE)}</span>
          </div>
        </div>

        <div class="modal-rule"></div>

        <div class="payout-row">
          <span class="payout-label">Total Payout</span>
          <span class="payout-amount">{formatMoney(totalPayout)}</span>
        </div>

        <div class="actions">
          <button class="sell-btn" onclick={sell} disabled={!canSell}>
            Sell
          </button>
          <button class="cancel-btn" onclick={onClose}>Close</button>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .overlay {
    align-items: center;
    background: rgba(0, 0, 0, 0.8);
    bottom: 0;
    display: flex;
    justify-content: center;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 200;
  }

  .modal {
    background: #1e150a;
    border: 2px solid #5a4020;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.6);
    max-height: 85vh;
    max-width: 480px;
    overflow-y: auto;
    position: relative;
    width: 92vw;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #8a7060;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.75rem;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 1;
  }

  .close-btn:hover {
    color: #d4b896;
  }

  .modal-header {
    border-bottom: 1px solid #3a2a18;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 1.5rem 1.5rem 1rem;
    text-align: center;
  }

  .store-type {
    color: #5a4020;
    font-size: 0.6rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .store-name {
    font-size: 1.3rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #d4b896;
  }

  .modal-subtitle {
    color: #8a7060;
    font-size: 0.65rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .modal-rule {
    border-top: 1px solid #3a2a18;
    margin: 0 1.5rem;
  }

  .modal-body {
    padding: 1rem 1.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .muted {
    color: #8a7060;
    font-size: 0.85rem;
  }

  .balance-row {
    align-items: center;
    display: flex;
    justify-content: space-between;
  }

  .balance-label {
    color: #8a7060;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .balance-amount {
    color: #c8a050;
    font-size: 1rem;
    letter-spacing: 0.06em;
  }

  .earned-notice {
    background: #1a2a0a;
    border: 1px solid #3a5020;
    color: #88c050;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    padding: 0.4rem 0.75rem;
    text-align: center;
    text-transform: uppercase;
  }

  .items-table {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .table-header {
    color: #5a4020;
    display: grid;
    font-size: 0.6rem;
    grid-template-columns: 1fr auto auto auto;
    gap: 0.75rem;
    letter-spacing: 0.14em;
    padding-bottom: 0.35rem;
    border-bottom: 1px solid #2a1e0e;
    text-transform: uppercase;
    align-items: center;
  }

  .col-qty,
  .col-rate,
  .col-total {
    text-align: right;
  }

  .table-row {
    display: grid;
    font-size: 0.8rem;
    grid-template-columns: 1fr auto auto auto;
    gap: 0.75rem;
    padding: 0.4rem 0;
    align-items: center;
  }

  .item-name {
    color: #d4b896;
  }

  .table-row.empty .item-name {
    color: #4a3a2a;
  }

  .qty-cell {
    align-items: center;
    display: flex;
    gap: 0.2rem;
  }

  .stepper {
    background: #2a1e0e;
    border: 1px solid #4a3418;
    color: #8a7060;
    cursor: pointer;
    font-size: 0.75rem;
    height: 1.6rem;
    line-height: 1;
    padding: 0;
    width: 1.6rem;
    transition: border-color 0.1s, color 0.1s;
  }

  .stepper:hover:not(:disabled) {
    border-color: #8a6030;
    color: #d4b896;
  }

  .stepper:disabled {
    color: #3a2a1a;
    border-color: #2a1a0a;
    cursor: not-allowed;
  }

  .qty-input {
    background: #120c04;
    border: 1px solid #4a3418;
    color: #d4b896;
    font-family: inherit;
    font-size: 0.8rem;
    height: 1.6rem;
    text-align: center;
    width: 3rem;
  }

  .qty-input:disabled {
    color: #3a2a1a;
    border-color: #2a1a0a;
  }

  /* hide number input spinners */
  .qty-input::-webkit-outer-spin-button,
  .qty-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .qty-input[type="number"] {
    -moz-appearance: textfield;
  }

  .max-btn {
    background: transparent;
    border: 1px solid #3a2a18;
    color: #6a5030;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.55rem;
    height: 1.6rem;
    letter-spacing: 0.08em;
    padding: 0 0.35rem;
    text-transform: uppercase;
    transition: border-color 0.1s, color 0.1s;
  }

  .max-btn:hover:not(:disabled) {
    border-color: #6a5030;
    color: #c8a050;
  }

  .max-btn:disabled {
    color: #3a2a1a;
    border-color: #2a1a0a;
    cursor: not-allowed;
  }

  .available {
    color: #4a3a2a;
    font-size: 0.7rem;
    min-width: 2rem;
  }

  .item-rate {
    color: #6a5840;
    font-size: 0.75rem;
    text-align: right;
  }

  .table-row.empty .item-rate {
    color: #3a2a1a;
  }

  .item-total {
    color: #c8a050;
    font-size: 0.8rem;
    text-align: right;
    min-width: 3.5rem;
  }

  .table-row.empty .item-total {
    color: #4a3a2a;
  }

  .payout-row {
    align-items: center;
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0 0.25rem;
  }

  .payout-label {
    color: #8a7060;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .payout-amount {
    color: #c8a050;
    font-size: 1.1rem;
    letter-spacing: 0.06em;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }

  .sell-btn {
    background: #3a2a10;
    border: 1px solid #6a4a20;
    color: #d4b896;
    cursor: pointer;
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    padding: 0.6rem 1rem;
    text-transform: uppercase;
    transition: background 0.15s, border-color 0.15s;
  }

  .sell-btn:hover:not(:disabled) {
    background: #4a3a18;
    border-color: #c8a050;
    color: #f0d8a0;
  }

  .sell-btn:disabled {
    color: #4a3a2a;
    border-color: #3a2a18;
    cursor: not-allowed;
  }

  .cancel-btn {
    background: transparent;
    border: 1px solid #3a2a18;
    color: #6a5040;
    cursor: pointer;
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    padding: 0.5rem 1rem;
    text-transform: uppercase;
    transition: border-color 0.15s, color 0.15s;
  }

  .cancel-btn:hover {
    border-color: #5a4020;
    color: #8a7060;
  }
</style>
