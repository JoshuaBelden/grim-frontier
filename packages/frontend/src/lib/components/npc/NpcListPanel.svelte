<script lang="ts">
  import { npcListStore } from "$lib/stores/npcList"
  import { npcPanelStore } from "$lib/stores/npcPanels"
  import { sendCommand, wsConnected } from "$lib/ws"

  let visible = $state(false)
  let hasFetched = $state(false)

  $effect(() => {
    if ($wsConnected && !hasFetched) {
      hasFetched = true
      sendCommand({ type: "listNpcs" })
    }
  })

  function toggle() {
    visible = !visible
  }

  function openNpc(npc: (typeof $npcListStore)[0]) {
    npcPanelStore.open({
      key: npc.id,
      npcId: npc.id,
      name: npc.name,
      career: npc.career,
      location: npc.locationName ?? undefined,
    })
  }

  function formatStatus(status: string): string {
    return status.replace("_", " ")
  }
</script>

<div class="npc-list-toggle">
  <button class="toggle-btn" onclick={toggle} title="NPC Debug List">
    {visible ? "✕" : "NPCs"}
  </button>
</div>

{#if visible}
  <div class="npc-list-panel">
    <div class="panel-header">
      <span class="panel-title">All NPCs ({$npcListStore.length})</span>
      <button class="refresh-btn" onclick={() => sendCommand({ type: "listNpcs" })} title="Refresh">↻</button>
    </div>
    <div class="panel-body">
      {#each $npcListStore as npc}
        <button class="npc-row" onclick={() => openNpc(npc)}>
          <div class="npc-name">{npc.name}</div>
          <div class="npc-meta">
            <span class="npc-career">{npc.career}</span>
            <span class="npc-status" class:drifting={npc.status === "drifting"} class:at-camp={npc.status === "at_camp"}
              >{formatStatus(npc.status)}</span
            >
          </div>
          {#if npc.locationName}
            <div class="npc-location">
              {npc.locationType === "camp" ? "⛺" : "🏘"} {npc.locationName}
            </div>
          {:else}
            <div class="npc-location faded">Unknown</div>
          {/if}
        </button>
      {:else}
        <div class="empty">No NPCs found</div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .npc-list-toggle {
    position: fixed;
    top: 0.75rem;
    right: 5rem;
    z-index: 20;
  }

  .toggle-btn {
    background: #1a1008;
    border: 1px solid #5a4020;
    color: #8a7060;
    cursor: pointer;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    padding: 0.35rem 0.6rem;
    text-transform: uppercase;
    transition: border-color 0.15s;
  }

  .toggle-btn:hover {
    border-color: #d4b896;
    color: #d4b896;
  }

  .npc-list-panel {
    background: #120c04;
    border-left: 1px solid #2a1e0e;
    bottom: 0;
    display: flex;
    flex-direction: column;
    position: fixed;
    right: 0;
    top: 0;
    width: 280px;
    z-index: 15;
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

  .refresh-btn {
    background: none;
    border: 1px solid #3a2e1e;
    color: #8a7060;
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0.15rem 0.4rem;
    transition: border-color 0.15s;
  }

  .refresh-btn:hover {
    border-color: #d4b896;
    color: #d4b896;
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
  }

  .npc-row {
    background: #1a1008;
    border: 1px solid #2a1e0e;
    cursor: pointer;
    display: block;
    margin-bottom: 0.35rem;
    padding: 0.5rem 0.6rem;
    text-align: left;
    transition: border-color 0.15s;
    width: 100%;
  }

  .npc-row:hover {
    border-color: #5a4020;
  }

  .npc-name {
    color: #d4b896;
    font-size: 0.75rem;
    letter-spacing: 0.06em;
  }

  .npc-meta {
    align-items: center;
    display: flex;
    gap: 0.5rem;
    margin-top: 0.2rem;
  }

  .npc-career {
    color: #6a5a40;
    font-size: 0.6rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .npc-status {
    color: #5a4020;
    font-size: 0.55rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .npc-status.drifting {
    color: #7a6a40;
  }

  .npc-status.at-camp {
    color: #7a9a4a;
  }

  .npc-location {
    color: #6a5a40;
    font-size: 0.6rem;
    margin-top: 0.2rem;
  }

  .npc-location.faded {
    color: #3a2e1e;
    font-style: italic;
  }

  .empty {
    color: #3a2e1e;
    font-size: 0.7rem;
    padding: 1rem;
    text-align: center;
  }
</style>
