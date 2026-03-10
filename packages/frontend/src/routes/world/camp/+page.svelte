<script lang="ts">
  import { goto } from "$app/navigation"
  import { GAME_HOUR_INTERVAL_MS } from "$lib/constants"
  import { authStore } from "$lib/stores/auth"
  import { campDetailStore } from "$lib/stores/camp"
  import { npcPanelStore } from "$lib/stores/npcPanels"
  import { wsErrorStore } from "$lib/stores/wsError"
  import { sendCommand } from "$lib/ws"
  import { lastClockUpdateAt } from "$lib/wsHandler"
  import { onDestroy, onMount } from "svelte"

  let camp = $derived($campDetailStore)

  const error = $derived(
    $wsErrorStore?.command === "getCamp" || $wsErrorStore?.command === "startNpcAction" || $wsErrorStore?.command === "stopNpcAction"
      ? $wsErrorStore.message
      : null,
  )

  /** Progress (0–1) through the current game hour, updated every second. */
  let gatherProgress = $state(0)

  let progressInterval: ReturnType<typeof setInterval> | null = null

  onMount(() => {
    const { campId } = $authStore
    if (!campId) {
      goto("/world/join")
      return
    }
    sendCommand({ type: "getCamp", campId })

    progressInterval = setInterval(() => {
      const elapsed = Date.now() - $lastClockUpdateAt
      gatherProgress = $lastClockUpdateAt === 0 ? 0 : Math.min(elapsed / GAME_HOUR_INTERVAL_MS, 1)
    }, 1000)
  })

  onDestroy(() => {
    if (progressInterval !== null) clearInterval(progressInterval)
  })

  function isGathering(npcId: string): boolean {
    const npc = camp?.npcs.find(entry => entry.id === npcId)
    return npc?.currentAction?.type === "food_gathering"
  }

  function startGathering(npcId: string) {
    sendCommand({ type: "startNpcAction", npcId, actionType: "food_gathering" })
  }

  function stopGathering(npcId: string) {
    sendCommand({ type: "stopNpcAction", npcId })
  }
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
              <div class="roster-row">
                <button
                  class="roster-btn"
                  onclick={() => npcPanelStore.open({ key: npc.id, npcId: npc.id, name: npc.name, career: npc.career })}
                >
                  <span class="npc-name">{npc.name}</span>
                  <span class="npc-career">{npc.career.replace(/_/g, " ")}</span>
                </button>

                <div class="npc-actions">
                  {#if isGathering(npc.id)}
                    <div class="gather-status">
                      <div class="progress-track">
                        <div class="progress-fill" style="width: {gatherProgress * 100}%"></div>
                      </div>
                      <button class="action-btn stop" onclick={() => stopGathering(npc.id)}>Stop</button>
                    </div>
                  {:else}
                    <button class="action-btn gather" onclick={() => startGathering(npc.id)}>Gather Food</button>
                  {/if}
                </div>
              </div>
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

  .roster-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
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
    flex: 1;
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

  .npc-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .gather-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .progress-track {
    width: 80px;
    height: 4px;
    background: #2a1e0e;
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #7a9a4a;
    border-radius: 2px;
    transition: width 0.5s linear;
  }

  .action-btn {
    background: none;
    border: 1px solid #5a4020;
    border-radius: 2px;
    color: #8a7060;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    padding: 0.2rem 0.5rem;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .action-btn:hover {
    border-color: #d4b896;
    color: #d4b896;
  }

  .action-btn.stop {
    border-color: #6a3020;
    color: #8a5040;
  }

  .action-btn.stop:hover {
    border-color: #c0512a;
    color: #c0512a;
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
