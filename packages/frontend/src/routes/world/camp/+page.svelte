<script lang="ts">
  import { goto } from "$app/navigation"
  import AcquaintanceList from "$lib/components/camp/AcquaintanceList.svelte"
  import CollapsibleSection from "$lib/components/CollapsibleSection.svelte"
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
    $wsErrorStore?.command === "getCamp" ||
      $wsErrorStore?.command === "startNpcAction" ||
      $wsErrorStore?.command === "stopNpcAction" ||
      $wsErrorStore?.command === "setFirePit"
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
    sendCommand({ type: "listAcquaintances" })

    progressInterval = setInterval(() => {
      const elapsed = Date.now() - $lastClockUpdateAt
      gatherProgress = $lastClockUpdateAt === 0 ? 0 : Math.min(elapsed / GAME_HOUR_INTERVAL_MS, 1)
    }, 1000)
  })

  onDestroy(() => {
    if (progressInterval !== null) clearInterval(progressInterval)
  })

  function getActionType(npcId: string): string | null {
    const npc = camp?.npcs.find(entry => entry.id === npcId)
    return npc?.currentAction?.type ?? null
  }

  function startAction(npcId: string, actionType: "food_gathering" | "wood_gathering" | "resting") {
    sendCommand({ type: "startNpcAction", npcId, actionType })
  }

  function stopAction(npcId: string) {
    sendCommand({ type: "stopNpcAction", npcId })
  }

  function actionLabel(actionType: string): string {
    if (actionType === "food_gathering") return "Food"
    if (actionType === "wood_gathering") return "Wood"
    if (actionType === "resting") return "Resting"
    return actionType
  }

  /** Returns a descriptor label and severity class for health (10=best). */
  function healthDesc(value: number): { label: string; severity: string } {
    if (value >= 7) return { label: "Healthy", severity: "good" }
    if (value >= 4) return { label: "Unwell", severity: "warn" }
    if (value >= 2) return { label: "Sick", severity: "bad" }
    if (value === 1) return { label: "Dying", severity: "critical" }
    return { label: "Dead", severity: "critical" }
  }

  /** Returns a descriptor label and severity class for morale (10=best). */
  function moraleDesc(value: number): { label: string; severity: string } {
    if (value >= 7) return { label: "Happy", severity: "good" }
    if (value >= 4) return { label: "Discouraged", severity: "warn" }
    if (value >= 2) return { label: "Despondent", severity: "bad" }
    if (value === 1) return { label: "Miserable", severity: "critical" }
    return { label: "Broken", severity: "critical" }
  }

  /** Returns a descriptor label and severity class for fatigue (0=best). */
  function fatigueDesc(value: number): { label: string; severity: string } {
    if (value <= 3) return { label: "Rested", severity: "good" }
    if (value <= 6) return { label: "Tired", severity: "warn" }
    if (value <= 8) return { label: "Exhausted", severity: "bad" }
    if (value === 9) return { label: "Fading", severity: "critical" }
    return { label: "Collapsed", severity: "critical" }
  }

  /** Returns a descriptor label and severity class for hunger (0=best). */
  function hungerDesc(value: number): { label: string; severity: string } {
    if (value <= 3) return { label: "Full", severity: "good" }
    if (value <= 6) return { label: "Peckish", severity: "warn" }
    if (value <= 8) return { label: "Hungry", severity: "bad" }
    if (value === 9) return { label: "Weak", severity: "critical" }
    return { label: "Starving", severity: "critical" }
  }

  function toggleFirePit() {
    if (!camp) return
    const newState = camp.amenities.firePit === "lit" ? "burned_out" : "lit"
    sendCommand({ type: "setFirePit", campId: camp.id, state: newState })
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

    <CollapsibleSection title="Resources">
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
          <span class="resource-label">Wood</span>
          <span class="resource-value">{camp.resources.wood}</span>
        </div>
        <div class="resource">
          <span class="resource-label">Stability</span>
          <span class="resource-value">{camp.stability}</span>
        </div>
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="Amenities">
      <div class="amenities">
        <div class="amenity">
          <span class="amenity-label">Fire Pit</span>
          <span class="amenity-status {camp.amenities.firePit === 'lit' ? 'lit' : 'out'}">
            {camp.amenities.firePit === "lit" ? "Lit" : "Burned Out"}
          </span>
          <button class="action-btn" onclick={toggleFirePit}>
            {camp.amenities.firePit === "lit" ? "Extinguish" : "Light"}
          </button>
        </div>
      </div>
    </CollapsibleSection>

    <CollapsibleSection title="Roster">
      {#if camp.npcs.length === 0}
        <p class="muted">No one's here yet. Attract someone worth keeping.</p>
      {:else}
        <ul class="roster">
          {#each camp.npcs as npc}
            <li>
              <div class="roster-entry">
                <div class="roster-row">
                  <button
                    class="roster-btn"
                    onclick={() => npcPanelStore.open({ key: npc.id, npcId: npc.id, name: npc.name, career: npc.career })}
                  >
                    <span class="npc-name">{npc.name}</span>
                    <span class="npc-career">{npc.career.replace(/_/g, " ")}</span>
                  </button>

                  {#if npc.ownerId === $authStore.playerId}
                    <div class="npc-actions">
                    {#if getActionType(npc.id)}
                      <div class="gather-status">
                        <span class="action-label">{actionLabel(getActionType(npc.id)!)}</span>
                        {#if getActionType(npc.id) !== "resting"}
                          <div class="progress-track">
                            <div class="progress-fill" style="width: {gatherProgress * 100}%"></div>
                          </div>
                        {/if}
                        <button class="action-btn stop" onclick={() => stopAction(npc.id)}>Stop</button>
                      </div>
                    {:else}
                      <button class="action-btn gather" onclick={() => startAction(npc.id, "food_gathering")}>Gather Food</button>
                      <button class="action-btn gather" onclick={() => startAction(npc.id, "wood_gathering")}>Gather Wood</button>
                      <button class="action-btn gather" onclick={() => startAction(npc.id, "resting")}>Rest</button>
                    {/if}
                    </div>
                  {/if}
                </div>
                <div class="npc-stats">
                  <span class="stat stat-{healthDesc(npc.health).severity}">{healthDesc(npc.health).label}</span>
                  <span class="stat stat-{moraleDesc(npc.morale).severity}">{moraleDesc(npc.morale).label}</span>
                  <span class="stat stat-{hungerDesc(npc.hunger).severity}">{hungerDesc(npc.hunger).label}</span>
                  <span class="stat stat-{fatigueDesc(npc.fatigue).severity}">{fatigueDesc(npc.fatigue).label}</span>
                </div>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </CollapsibleSection>

    <AcquaintanceList />
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

  .amenities {
    display: flex;
    gap: 2rem;
  }

  .amenity {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .amenity-label {
    color: #5a4020;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .amenity-status {
    font-size: 0.85rem;
  }

  .amenity-status.lit {
    color: #c89040;
  }

  .amenity-status.out {
    color: #8a7060;
  }

  .action-label {
    color: #8a7060;
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .roster {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .roster li {
    display: flex;
  }

  .roster-entry {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    width: 100%;
  }

  .roster-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
  }

  .npc-stats {
    display: flex;
    gap: 1rem;
    padding-left: 0.25rem;
  }

  .stat {
    font-size: 0.6rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .stat-good {
    color: #7aaa60;
  }

  .stat-warn {
    color: #c8a050;
  }

  .stat-bad {
    color: #c07040;
  }

  .stat-critical {
    color: #c04040;
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
