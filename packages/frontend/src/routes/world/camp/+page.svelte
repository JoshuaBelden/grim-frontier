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
  import type { FoodStoreType, FuelStoreType } from "@grim-frontier/shared"
  import { onDestroy, onMount } from "svelte"

  let camp = $derived($campDetailStore)

  const error = $derived(
    $wsErrorStore?.command === "getCamp" ||
      $wsErrorStore?.command === "startNpcAction" ||
      $wsErrorStore?.command === "stopNpcAction" ||
      $wsErrorStore?.command === "setFirePit" ||
      $wsErrorStore?.command === "setPreferredFood" ||
      $wsErrorStore?.command === "setActiveFuelSource" ||
      $wsErrorStore?.command === "setSuspendJoinRequests"
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

  function startAction(npcId: string, actionType: "food_gathering" | "fuel_gathering" | "resting" | "stand_watch") {
    sendCommand({ type: "startNpcAction", npcId, actionType })
  }

  function stopAction(npcId: string) {
    sendCommand({ type: "stopNpcAction", npcId })
  }

  function actionLabel(actionType: string): string {
    if (actionType === "food_gathering") return "Food"
    if (actionType === "fuel_gathering") return "Fuel"
    if (actionType === "resting") return "Resting"
    if (actionType === "stand_watch") return "Watching"
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

  /** Returns a descriptor label and severity class for energy (10=best). */
  function energyDesc(value: number): { label: string; severity: string } {
    if (value >= 7) return { label: "Rested", severity: "good" }
    if (value >= 4) return { label: "Tired", severity: "warn" }
    if (value >= 2) return { label: "Exhausted", severity: "bad" }
    if (value === 1) return { label: "Fading", severity: "critical" }
    return { label: "Collapsed", severity: "critical" }
  }

  /** Returns a descriptor label and severity class for sustenance (10=best). */
  function sustenanceDesc(value: number): { label: string; severity: string } {
    if (value >= 7) return { label: "Full", severity: "good" }
    if (value >= 4) return { label: "Peckish", severity: "warn" }
    if (value >= 2) return { label: "Hungry", severity: "bad" }
    if (value === 1) return { label: "Weak", severity: "critical" }
    return { label: "Starving", severity: "critical" }
  }

  function toggleFirePit() {
    if (!camp) return
    const newState = camp.amenities.firePit === "lit" ? "burned_out" : "lit"
    sendCommand({ type: "setFirePit", campId: camp.id, state: newState })
  }

  function toggleSuspendJoinRequests() {
    if (!camp) return
    sendCommand({ type: "setSuspendJoinRequests", campId: camp.id, suspended: !camp.suspendJoinRequests })
  }

  function setPreferredFood(foodType: FoodStoreType) {
    if (!camp) return
    sendCommand({ type: "setPreferredFood", campId: camp.id, foodType })
  }

  function setActiveFuelSource(fuelType: FuelStoreType) {
    if (!camp) return
    sendCommand({ type: "setActiveFuelSource", campId: camp.id, fuelType })
  }

  const foodLabels: Record<FoodStoreType, string> = {
    raw: "Raw",
    staple: "Staple",
    fresh: "Fresh",
    prepared: "Prepared",
  }

  const fuelLabels: Record<FuelStoreType, string> = {
    sticks: "Sticks",
    splitLogs: "Split Logs",
    coal: "Coal",
    oil: "Oil",
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

    <div class="join-requests-row">
      <span class="join-requests-label">Join Requests</span>
      <span class="join-requests-status {camp.suspendJoinRequests ? 'out' : 'lit'}">
        {camp.suspendJoinRequests ? "Suspended" : "Open"}
      </span>
      <button class="action-btn" onclick={toggleSuspendJoinRequests}>
        {camp.suspendJoinRequests ? "Resume" : "Suspend"}
      </button>
    </div>

    <div class="stores-row">
      <div class="stores-col">
        <CollapsibleSection title="Food Stores">
          <div class="stores-grid">
            {#each ["raw", "staple", "fresh", "prepared"] as FoodStoreType[] as foodType}
              {@const entry = camp.foodStores[foodType]}
              <div class="store-item" class:active={camp.preferredFood === foodType}>
                <div class="store-header">
                  <span class="store-label">{foodLabels[foodType]}</span>
                </div>
                <span class="store-value">{entry.count}</span>
                <button
                  class="action-btn"
                  class:selected={camp.preferredFood === foodType}
                  onclick={() => setPreferredFood(foodType)}
                >
                  {camp.preferredFood === foodType ? "Eating" : "Eat"}
                </button>
              </div>
            {/each}
          </div>
        </CollapsibleSection>
      </div>

      <div class="stores-col">
        <CollapsibleSection title="Fuel Stores">
          <div class="stores-grid">
            {#each ["sticks", "splitLogs", "coal", "oil"] as FuelStoreType[] as fuelType}
              {@const amount = camp.fuelStores[fuelType]}
              <div class="store-item" class:active={camp.amenities.activeFuelSource === fuelType}>
                <div class="store-header">
                  <span class="store-label">{fuelLabels[fuelType]}</span>
                </div>
                <span class="store-value">{amount}</span>
                <button
                  class="action-btn"
                  class:selected={camp.amenities.activeFuelSource === fuelType}
                  onclick={() => setActiveFuelSource(fuelType)}
                >
                  {camp.amenities.activeFuelSource === fuelType ? "Burning" : "Burn"}
                </button>
              </div>
            {/each}
          </div>
        </CollapsibleSection>
      </div>
    </div>

    <CollapsibleSection title="Amenities">
      <div class="amenities-grid">
        <div class="amenity-item" class:active={camp.amenities.firePit === "lit"}>
          <span class="amenity-label">Fire Pit</span>
          <span class="amenity-value {camp.amenities.firePit === 'lit' ? 'lit' : 'out'}">
            {camp.amenities.firePit === "lit" ? "Lit" : "Burned Out"}
          </span>
          <button class="action-btn" onclick={toggleFirePit}>
            {camp.amenities.firePit === "lit" ? "Extinguish" : "Light"}
          </button>
        </div>
        <div class="amenity-item">
          <span class="amenity-label">Protection</span>
          <span class="amenity-value">{camp.amenities.protection}</span>
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
                    onclick={() =>
                      npcPanelStore.open({ key: npc.id, npcId: npc.id, name: npc.name, career: npc.career })}
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
                        <button class="action-btn gather" onclick={() => startAction(npc.id, "food_gathering")}
                          >Gather Food</button
                        >
                        <button class="action-btn gather" onclick={() => startAction(npc.id, "fuel_gathering")}
                          >Gather Fuel</button
                        >
                        <button class="action-btn gather" onclick={() => startAction(npc.id, "stand_watch")}
                          >Stand Watch</button
                        >
                        <button class="action-btn gather" onclick={() => startAction(npc.id, "resting")}>Rest</button>
                      {/if}
                    </div>
                  {:else if getActionType(npc.id)}
                    <span class="action-label">{actionLabel(getActionType(npc.id)!)}</span>
                  {/if}
                </div>
                <div class="npc-stats">
                  <span class="stat stat-{healthDesc(npc.health).severity}">{healthDesc(npc.health).label}</span>
                  <span class="stat stat-{moraleDesc(npc.morale).severity}">{moraleDesc(npc.morale).label}</span>
                  <span class="stat stat-{energyDesc(npc.energy).severity}">{energyDesc(npc.energy).label}</span>
                  <span class="stat stat-{sustenanceDesc(npc.sustenance).severity}">{sustenanceDesc(npc.sustenance).label}</span>
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

  .stores-row {
    display: flex;
    gap: 2rem;
  }

  .stores-col {
    flex: 1;
    min-width: 0;
  }

  .stores-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  .store-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem;
    border: 1px solid #2a1e0e;
    border-radius: 2px;
  }

  .store-item.active {
    border-color: #5a4020;
  }

  .store-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .store-label {
    color: #5a4020;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .store-quality {
    color: #8a7060;
    font-size: 0.55rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .store-value {
    font-size: 1.5rem;
    letter-spacing: 0.05em;
  }

  .join-requests-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .join-requests-label {
    color: #5a4020;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .join-requests-status {
    font-size: 0.85rem;
  }

  .join-requests-status.lit {
    color: #c89040;
  }

  .join-requests-status.out {
    color: #8a7060;
  }

  .amenities-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }

  .amenity-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem;
    border: 1px solid #2a1e0e;
    border-radius: 2px;
  }

  .amenity-item.active {
    border-color: #5a4020;
  }

  .amenity-label {
    color: #5a4020;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .amenity-value {
    font-size: 1.5rem;
    letter-spacing: 0.05em;
  }

  .amenity-value.lit {
    color: #c89040;
  }

  .amenity-value.out {
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

  .action-btn.selected {
    border-color: #c89040;
    color: #c89040;
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
