<script lang="ts">
  import { authStore } from "$lib/stores/auth"
  import { campDetailStore } from "$lib/stores/camp"
  import { sendCommand } from "$lib/ws"
  import { npcDetailStore } from "$lib/wsHandler"
  import type { FoodInventoryItem, FoodStoreType, FuelInventoryItem, FuelStoreType, InventoryItem, PurchasedInventoryItem } from "@grim-frontier/shared"

  let { visible = $bindable(false) }: { visible?: boolean } = $props()

  const playerNpc = $derived($authStore.npcId ? $npcDetailStore.get($authStore.npcId) ?? null : null)
  const camp = $derived($campDetailStore)

  interface FoodRow {
    kind: "food"
    subtype: FoodStoreType
    label: string
    qualityLabel: string
  }

  interface FuelRow {
    kind: "fuel"
    subtype: FuelStoreType
    label: string
  }

  type ItemRow = FoodRow | FuelRow

  const rows: ItemRow[] = [
    { kind: "food", subtype: "raw", label: "Raw", qualityLabel: "Poor" },
    { kind: "food", subtype: "staple", label: "Staple", qualityLabel: "Basic" },
    { kind: "food", subtype: "fresh", label: "Fresh", qualityLabel: "Good" },
    { kind: "food", subtype: "prepared", label: "Prepared", qualityLabel: "Hearty" },
    { kind: "fuel", subtype: "sticks", label: "Sticks" },
    { kind: "fuel", subtype: "splitLogs", label: "Split Logs" },
    { kind: "fuel", subtype: "coal", label: "Coal" },
    { kind: "fuel", subtype: "oil", label: "Oil" },
  ]

  function npcCount(row: ItemRow): number {
    const inventory = playerNpc?.inventory ?? []
    if (row.kind === "food") {
      const entry = inventory.find(
        item => item.type === "food" && item.subtype === row.subtype,
      ) as FoodInventoryItem | undefined
      return entry?.count ?? 0
    }
    const entry = inventory.find(
      item => item.type === "fuel" && item.subtype === row.subtype,
    ) as FuelInventoryItem | undefined
    return entry?.count ?? 0
  }

  function campCount(row: ItemRow): number {
    if (!camp) return 0
    if (row.kind === "food") return camp.foodStores[row.subtype].count
    return camp.fuelStores[row.subtype]
  }

  function transferToNpc(row: ItemRow) {
    if (!playerNpc) return
    let item: InventoryItem
    if (row.kind === "food") {
      const quality = camp!.foodStores[row.subtype].quality
      item = { type: "food", subtype: row.subtype, quality, count: 1 }
    } else {
      item = { type: "fuel", subtype: row.subtype, count: 1 }
    }
    sendCommand({ type: "transferToNpc", npcId: playerNpc.id, item })
  }

  function transferToCamp(row: ItemRow) {
    if (!playerNpc) return
    let item: InventoryItem
    if (row.kind === "food") {
      const npcEntry = (playerNpc.inventory ?? []).find(
        inv => inv.type === "food" && inv.subtype === row.subtype,
      ) as FoodInventoryItem | undefined
      if (!npcEntry) return
      item = { type: "food", subtype: row.subtype, quality: npcEntry.quality, count: 1 }
    } else {
      item = { type: "fuel", subtype: row.subtype, count: 1 }
    }
    sendCommand({ type: "transferToCamp", npcId: playerNpc.id, item })
  }

  function rowLabel(row: ItemRow): string {
    if (row.kind === "food") return `${row.label} (${row.qualityLabel})`
    return row.label
  }

  interface StorageRow {
    name: string
    npcCount: number
    campCount: number
    item: PurchasedInventoryItem
  }

  const storageRows = $derived.by(() => {
    const npcItems = (playerNpc?.inventory ?? []).filter(item => item.type === "purchased") as PurchasedInventoryItem[]
    const campItems = ($campDetailStore?.storage ?? []) as PurchasedInventoryItem[]
    const names = new Set([...npcItems.map(item => item.name), ...campItems.map(item => item.name)])
    return [...names].sort().map(name => {
      const npcEntry = npcItems.find(item => item.name === name)
      const campEntry = campItems.find(item => item.name === name)
      const baseItem = npcEntry ?? campEntry!
      return {
        name,
        npcCount: npcEntry?.count ?? 0,
        campCount: campEntry?.count ?? 0,
        item: { type: "purchased" as const, name, count: 1, weight: baseItem.weight, traits: baseItem.traits, category: baseItem.category },
      }
    })
  })

  function transferStorageToNpc(row: StorageRow) {
    if (!playerNpc) return
    sendCommand({ type: "transferToNpc", npcId: playerNpc.id, item: row.item })
  }

  function transferStorageToCamp(row: StorageRow) {
    if (!playerNpc) return
    sendCommand({ type: "transferToCamp", npcId: playerNpc.id, item: row.item })
  }
</script>

{#if visible}
  <div class="modal-backdrop" onclick={() => (visible = false)} role="presentation"></div>
  <div class="inventory-panel">
    <div class="panel-header">
      <span class="panel-title">Camp Inventory — {playerNpc?.name ?? "NPC"}</span>
      <button class="close-btn" onclick={() => (visible = false)}>✕</button>
    </div>

    <div class="panel-body">
      <div class="col-headers">
        <span class="col-npc">NPC</span>
        <span class="col-buttons"></span>
        <span class="col-label">Item</span>
        <span class="col-buttons"></span>
        <span class="col-camp">Camp</span>
      </div>

      <div class="section-label">Food</div>
      {#each rows.filter(row => row.kind === "food") as row}
        {@const npc = npcCount(row)}
        {@const camp = campCount(row)}
        <div class="item-row">
          <span class="count npc-count" class:zero={npc === 0}>{npc}</span>
          <button
            class="transfer-btn"
            onclick={() => transferToCamp(row)}
            disabled={npc === 0}
            title="Transfer to camp"
          >→</button>
          <span class="item-label">{rowLabel(row)}</span>
          <button
            class="transfer-btn"
            onclick={() => transferToNpc(row)}
            disabled={camp === 0}
            title="Transfer to NPC"
          >←</button>
          <span class="count camp-count" class:zero={camp === 0}>{camp}</span>
        </div>
      {/each}

      <div class="section-label">Fuel</div>
      {#each rows.filter(row => row.kind === "fuel") as row}
        {@const npc = npcCount(row)}
        {@const camp = campCount(row)}
        <div class="item-row">
          <span class="count npc-count" class:zero={npc === 0}>{npc}</span>
          <button
            class="transfer-btn"
            onclick={() => transferToCamp(row)}
            disabled={npc === 0}
            title="Transfer to camp"
          >→</button>
          <span class="item-label">{rowLabel(row)}</span>
          <button
            class="transfer-btn"
            onclick={() => transferToNpc(row)}
            disabled={camp === 0}
            title="Transfer to NPC"
          >←</button>
          <span class="count camp-count" class:zero={camp === 0}>{camp}</span>
        </div>
      {/each}

      {#if storageRows.length > 0}
        <div class="section-label">Storage</div>
        {#each storageRows as row}
          <div class="item-row">
            <span class="count npc-count" class:zero={row.npcCount === 0}>{row.npcCount}</span>
            <button
              class="transfer-btn"
              onclick={() => transferStorageToCamp(row)}
              disabled={row.npcCount === 0}
              title="Transfer to camp"
            >→</button>
            <span class="item-label">{row.name}</span>
            <button
              class="transfer-btn"
              onclick={() => transferStorageToNpc(row)}
              disabled={row.campCount === 0}
              title="Transfer to NPC"
            >←</button>
            <span class="count camp-count" class:zero={row.campCount === 0}>{row.campCount}</span>
          </div>
        {/each}
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    background: rgba(0, 0, 0, 0.6);
    bottom: 0;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 19;
  }

  .inventory-panel {
    background: #120c04;
    border: 1px solid #5a4020;
    display: flex;
    flex-direction: column;
    left: 50%;
    max-height: 80vh;
    position: fixed;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 520px;
    z-index: 20;
  }

  .panel-header {
    align-items: center;
    border-bottom: 1px solid #2a1e0e;
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 1rem;
  }

  .panel-title {
    color: #8a7060;
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .close-btn {
    background: none;
    border: 1px solid #3a2e1e;
    color: #8a7060;
    cursor: pointer;
    font-size: 0.75rem;
    padding: 0.15rem 0.4rem;
    transition: border-color 0.15s;
  }

  .close-btn:hover {
    border-color: #d4b896;
    color: #d4b896;
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem 1rem;
  }

  .col-headers {
    display: grid;
    grid-template-columns: 3rem 2rem 1fr 2rem 3rem;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 0.5rem;
    padding: 0 0.25rem;
  }

  .col-npc,
  .col-camp {
    color: #5a4020;
    font-size: 0.55rem;
    letter-spacing: 0.1em;
    text-align: center;
    text-transform: uppercase;
  }

  .col-camp {
    text-align: center;
  }

  .col-label {
    color: #5a4020;
    font-size: 0.55rem;
    letter-spacing: 0.1em;
    text-align: center;
    text-transform: uppercase;
  }

  .section-label {
    color: #5a4020;
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    margin: 0.75rem 0 0.35rem;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid #1e1508;
    text-transform: uppercase;
  }

  .item-row {
    align-items: center;
    display: grid;
    gap: 0.5rem;
    grid-template-columns: 3rem 2rem 1fr 2rem 3rem;
    margin-bottom: 0.25rem;
    padding: 0.3rem 0.25rem;
  }

  .item-row:hover {
    background: #1a1008;
  }

  .count {
    color: #d4b896;
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    text-align: center;
  }

  .count.zero {
    color: #3a2e1e;
  }

  .npc-count {
    text-align: center;
  }

  .camp-count {
    text-align: center;
  }

  .item-label {
    color: #8a7060;
    font-size: 0.7rem;
    letter-spacing: 0.06em;
    text-align: center;
    text-transform: uppercase;
  }

  .transfer-btn {
    background: #1a1008;
    border: 1px solid #3a2e1e;
    color: #8a7060;
    cursor: pointer;
    font-size: 0.75rem;
    padding: 0.2rem 0.35rem;
    transition: border-color 0.15s, color 0.15s;
    width: 100%;
  }

  .transfer-btn:hover:not(:disabled) {
    border-color: #c4a882;
    color: #d4b896;
  }

  .transfer-btn:disabled {
    color: #2a1e0e;
    border-color: #1e1508;
    cursor: default;
  }
</style>
