<script lang="ts">
  import type { InWorldDate, NpcDetailEvent } from "@grim-frontier/shared"
  import { npcPanelStore, type PanelEntry } from "$lib/stores/npcPanels"
  import { wsErrorStore } from "$lib/stores/wsError"
  import { sendCommand } from "$lib/ws"
  import { npcDetailStore } from "$lib/wsHandler"
  import { onMount } from "svelte"

  let { entry }: { entry: PanelEntry } = $props()

  let npc = $derived($npcDetailStore.get(entry.npcId) ?? null)

  let activeTab = $state<"profile" | "inventory">("profile")

  const error = $derived(
    $wsErrorStore?.command === "getNpc" ? $wsErrorStore.message : null,
  )

  onMount(() => {
    sendCommand({ type: "getNpc", npcId: entry.npcId })
  })

  function close() {
    npcPanelStore.close(entry.key)
  }

  const characteristicLabels: Record<string, string> = {
    strength: "Strength",
    hand: "Hand",
    presence: "Presence",
    wit: "Wit",
    temper: "Temper",
    grit: "Grit",
    nerve: "Nerve",
    luck: "Luck",
  }

  const dispositionLabels: Record<string, [string, string]> = {
    generosity: ["Greedy", "Generous"],
    mercy: ["Cruel", "Merciful"],
    courage: ["Cautious", "Courageous"],
    contentment: ["Ambitious", "Content"],
    honesty: ["Deceptive", "Honest"],
  }

  const outlookLabels: Record<string, [string, string]> = {
    idealism: ["Cynical", "Idealistic"],
    willfulness: ["Fatalistic", "Willful"],
    trust: ["Suspicious", "Trusting"],
    humility: ["Prideful", "Humble"],
  }

  /** Returns the label for a bipolar axis value (-5 to +5). */
  function axisLabel(poles: [string, string], value: number): string {
    if (value < -2) return `Strong ${poles[0]}`
    if (value < 0) return poles[0]
    if (value === 0) return "Neutral"
    if (value <= 2) return poles[1]
    return `Strong ${poles[1]}`
  }

  /** Formats a skill name from snake_case to Title Case. */
  function formatKey(key: string): string {
    return key.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase())
  }

  /** Returns a description and severity class for health (10=best, 0=worst). */
  function healthDesc(value: number): { label: string; severity: string } {
    if (value >= 7) return { label: "Healthy", severity: "good" }
    if (value >= 4) return { label: "Unwell", severity: "warn" }
    if (value >= 2) return { label: "Sick", severity: "bad" }
    if (value === 1) return { label: "Dying", severity: "critical" }
    return { label: "Dead", severity: "critical" }
  }

  /** Returns a description and severity class for morale (10=best, 0=worst). */
  function moraleDesc(value: number): { label: string; severity: string } {
    if (value >= 7) return { label: "Happy", severity: "good" }
    if (value >= 4) return { label: "Discouraged", severity: "warn" }
    if (value >= 2) return { label: "Despondent", severity: "bad" }
    if (value === 1) return { label: "Miserable", severity: "critical" }
    return { label: "Broken", severity: "critical" }
  }

  /** Returns a description and severity class for energy (10=best, 0=worst). */
  function energyDesc(value: number): { label: string; severity: string } {
    if (value >= 7) return { label: "Rested", severity: "good" }
    if (value >= 4) return { label: "Tired", severity: "warn" }
    if (value >= 2) return { label: "Exhausted", severity: "bad" }
    if (value === 1) return { label: "Fading", severity: "critical" }
    return { label: "Collapsed", severity: "critical" }
  }

  /** Returns a description and severity class for sustenance (10=best, 0=worst). */
  function sustenanceDesc(value: number): { label: string; severity: string } {
    if (value >= 7) return { label: "Full", severity: "good" }
    if (value >= 4) return { label: "Peckish", severity: "warn" }
    if (value >= 2) return { label: "Hungry", severity: "bad" }
    if (value === 1) return { label: "Weak", severity: "critical" }
    return { label: "Starving", severity: "critical" }
  }

  /** Formats an InWorldDate for display. */
  function formatDate(date: InWorldDate): string {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthName = months[(date.month - 1) % 12] ?? "???"
    const hour = date.hour % 12 || 12
    const ampm = date.hour < 12 ? "am" : "pm"
    return `${monthName} ${date.day}, ${date.year} ${hour}${ampm}`
  }

  /** Returns a display label for an inventory item. */
  function inventoryItemLabel(item: { type: string; subtype?: string; quality?: string; name?: string }): string {
    if (item.type === "food") {
      const subtypeLabel = formatKey(item.subtype ?? "")
      const qualityLabel = item.quality ? formatKey(item.quality) : ""
      return qualityLabel ? `${subtypeLabel} (${qualityLabel})` : subtypeLabel
    }
    if (item.type === "fuel") return formatKey(item.subtype ?? "")
    if (item.type === "purchased") return item.name ?? "Unknown"
    return formatKey(item.subtype ?? "")
  }

  /** Returns the total weight carried by an NPC across all inventory items. */
  function totalWeightCarried(inventory: { type: string; count: number; weight?: number }[]): number {
    return inventory.reduce((sum, item) => {
      if (item.type === "purchased" && item.weight !== undefined) {
        return sum + item.weight * item.count
      }
      return sum
    }, 0)
  }

  /** Formats a weight in lbs for display. */
  function formatWeightLbs(lbs: number): string {
    return lbs % 1 === 0 ? lbs.toFixed(0) + " lb" : lbs.toFixed(1) + " lb"
  }
</script>

<div class="panel">
  <button class="close" onclick={close} aria-label="Close">✕</button>

  <div class="panel-header">
    <div class="header-text">
      <p class="career-label">{entry.career ? formatKey(entry.career) : "Player"}</p>
      <h2 class="name">{entry.name}</h2>
      {#if npc}
        <span class="age">{npc.age} years old</span>
        <span class="status">{npc.status.replace(/_/g, " ")}</span>
        {#if npc.status === "travelling" && npc.travelDestination}
          <span class="location travelling">Heading to {npc.travelDestination}</span>
        {:else if npc.locationName}
          <span class="location">{npc.locationName}</span>
        {/if}
        <span class="money">${(npc.money ?? 0).toFixed(2)}</span>
      {/if}
    </div>
    <div class="portrait-container">
      <img
        src={npc?.portraitUrl ?? "/images/default-avatar.png"}
        alt={entry.name}
        class="portrait"
      />
    </div>
  </div>

  <nav class="tab-bar">
    <button class="tab" class:tab-active={activeTab === "profile"} onclick={() => (activeTab = "profile")}>
      Profile
    </button>
    <button class="tab" class:tab-active={activeTab === "inventory"} onclick={() => (activeTab = "inventory")}>
      Inventory
    </button>
  </nav>

  <div class="panel-content">
    {#if activeTab === "profile"}
      {#if error}
        <p class="state-message error">{error}</p>
      {:else if !npc}
        <p class="state-message muted">Loading…</p>
      {:else}
        <section>
          <h3 class="section-heading">Condition</h3>
          <div class="vitals">
            <div class="vital">
              <span class="vital-label">Health</span>
              <div class="bar-track">
                <div class="bar-fill severity-{healthDesc(npc.health).severity}" style="width: {npc.health * 10}%"></div>
              </div>
              <span class="vital-desc severity-text-{healthDesc(npc.health).severity}">{healthDesc(npc.health).label}</span>
            </div>
            <div class="vital">
              <span class="vital-label">Morale</span>
              <div class="bar-track">
                <div class="bar-fill severity-{moraleDesc(npc.morale).severity}" style="width: {npc.morale * 10}%"></div>
              </div>
              <span class="vital-desc severity-text-{moraleDesc(npc.morale).severity}">{moraleDesc(npc.morale).label}</span>
            </div>
            <div class="vital">
              <span class="vital-label">Energy</span>
              <div class="bar-track">
                <div class="bar-fill severity-{energyDesc(npc.energy).severity}" style="width: {npc.energy * 10}%"></div>
              </div>
              <span class="vital-desc severity-text-{energyDesc(npc.energy).severity}">{energyDesc(npc.energy).label}</span>
            </div>
            <div class="vital">
              <span class="vital-label">Sustenance</span>
              <div class="bar-track">
                <div class="bar-fill severity-{sustenanceDesc(npc.sustenance).severity}" style="width: {npc.sustenance * 10}%"></div>
              </div>
              <span class="vital-desc severity-text-{sustenanceDesc(npc.sustenance).severity}">{sustenanceDesc(npc.sustenance).label}</span>
            </div>
          </div>
          {#if npc.lastRestedAt}
            <span class="last-rested">Last rested: {formatDate(npc.lastRestedAt)}</span>
          {:else}
            <span class="last-rested">Never rested</span>
          {/if}
        </section>

        <section>
          <h3 class="section-heading">Characteristics</h3>
          <div class="characteristics">
            {#each Object.entries(characteristicLabels) as [key, label]}
              {@const value = npc.characteristics[key as keyof typeof npc.characteristics]}
              <div class="characteristic">
                <span class="char-label">{label}</span>
                <div class="bar-track">
                  <div class="bar-fill" style="width: {value * 10}%"></div>
                </div>
                <span class="char-value">{value}</span>
              </div>
            {/each}
          </div>
        </section>

        <div class="two-col-row">
          <section>
            <h3 class="section-heading">Disposition</h3>
            <div class="axes">
              {#each Object.entries(dispositionLabels) as [key, poles]}
                {@const value = npc.nature.disposition[key as keyof typeof npc.nature.disposition]}
                <div class="axis">
                  <span class="axis-key">{formatKey(key)}</span>
                  <span class="axis-value">{axisLabel(poles, value)}</span>
                  <span class="axis-raw">({value > 0 ? "+" : ""}{value})</span>
                </div>
              {/each}
            </div>
          </section>

          <section>
            <h3 class="section-heading">Outlook</h3>
            <div class="axes">
              {#each Object.entries(outlookLabels) as [key, poles]}
                {@const value = npc.nature.outlook[key as keyof typeof npc.nature.outlook]}
                <div class="axis">
                  <span class="axis-key">{formatKey(key)}</span>
                  <span class="axis-value">{axisLabel(poles, value)}</span>
                  <span class="axis-raw">({value > 0 ? "+" : ""}{value})</span>
                </div>
              {/each}
            </div>
          </section>
        </div>

        <section>
          <h3 class="section-heading">Traits</h3>
          {#if npc.traits.length === 0}
            <p class="muted">None</p>
          {:else}
            <div class="tags">
              {#each npc.traits as trait}
                <span class="tag">{formatKey(trait)}</span>
              {/each}
            </div>
          {/if}
        </section>

        <section>
          <h3 class="section-heading">Skills</h3>
          {#if Object.keys(npc.skills).length === 0}
            <p class="muted">None</p>
          {:else}
            <div class="skills">
              {#each Object.entries(npc.skills) as [skillName, level]}
                <div class="skill">
                  <span class="skill-name">{formatKey(skillName)}</span>
                  <div class="bar-track">
                    <div class="bar-fill" style="width: {(level ?? 0) * 10}%"></div>
                  </div>
                  <span class="skill-value">{level}</span>
                </div>
              {/each}
            </div>
          {/if}
        </section>

        <section>
          <h3 class="section-heading">Origin</h3>
          <div class="origin-grid">
            <span class="origin-label">From</span>
            <span>{formatKey(npc.origin.background.origin)}</span>
            <span class="origin-label">Family</span>
            <span>{formatKey(npc.origin.background.family)}</span>
            <span class="origin-label">Formative Event</span>
            <span>{npc.origin.background.formativeEvent}</span>
          </div>
        </section>

        {#if npc.origin.scars.length > 0}
          <section>
            <h3 class="section-heading">Scars</h3>
            <ul class="scars">
              {#each npc.origin.scars as scar}
                <li>
                  <span class="scar-type">{formatKey(scar.type)}</span>
                  <span class="scar-desc">{scar.description}</span>
                  {#if scar.triggerCondition}
                    <span class="scar-trigger">Trigger: {scar.triggerCondition}</span>
                  {/if}
                </li>
              {/each}
            </ul>
          </section>
        {/if}

        {#if npc.origin.pursuits.shortTerm || npc.origin.pursuits.longTerm || npc.origin.pursuits.secret}
          <section>
            <h3 class="section-heading">Pursuits</h3>
            <div class="origin-grid">
              {#if npc.origin.pursuits.shortTerm}
                <span class="origin-label">Near</span>
                <span>{npc.origin.pursuits.shortTerm}</span>
              {/if}
              {#if npc.origin.pursuits.longTerm}
                <span class="origin-label">Far</span>
                <span>{npc.origin.pursuits.longTerm}</span>
              {/if}
              {#if npc.origin.pursuits.secret}
                <span class="origin-label">Secret</span>
                <span class="secret">{npc.origin.pursuits.secret}</span>
              {/if}
            </div>
          </section>
        {/if}
      {/if}
    {/if}

    {#if activeTab === "inventory"}
      {#if !npc}
        <p class="state-message muted">Loading…</p>
      {:else if !npc.inventory || npc.inventory.length === 0}
        <p class="state-message muted">Nothing carried</p>
      {:else}
        <ul class="inventory-list">
          {#each npc.inventory as item}
            <li class="inventory-item">
              <span class="inv-label">{inventoryItemLabel(item)}</span>
              <span class="inv-weight">
                {#if item.type === "purchased" && item.weight !== undefined}
                  {formatWeightLbs(item.weight * item.count)}
                {:else}
                  —
                {/if}
              </span>
              <span class="inv-count">×{item.count}</span>
            </li>
          {/each}
        </ul>
        <div class="inventory-total">
          <span class="inv-total-label">Carried</span>
          <span class="inv-total-weight">{formatWeightLbs(totalWeightCarried(npc.inventory))}</span>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .panel {
    background: #110c06;
    border: 1px solid #5a4020;
    display: flex;
    flex-direction: column;
    height: 85vh;
    min-width: 900px;
    overflow: hidden;
    position: relative;
    width: 1100px;
  }

  .close {
    background: none;
    border: none;
    color: #8a7060;
    cursor: pointer;
    font-size: 0.85rem;
    left: 0.75rem;
    line-height: 1;
    padding: 0.5rem;
    position: absolute;
    top: 0.75rem;
    transition: color 0.15s;
    z-index: 1;
  }

  .close:hover {
    color: #d4b896;
  }

  .panel-header {
    align-items: stretch;
    border-bottom: 1px solid #2a1e0e;
    display: flex;
    flex-direction: row;
    flex-shrink: 0;
    overflow: hidden;
  }

  .header-text {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
    padding: 1.25rem 1.25rem 1rem 2.5rem;
  }

  .portrait-container {
    flex-shrink: 0;
    width: 240px;
  }

  .portrait {
    display: block;
    height: 100%;
    object-fit: cover;
    object-position: center;
    width: 100%;
  }

  .career-label {
    color: #5a4020;
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .name {
    font-size: 1.3rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .age {
    color: #8a7060;
    font-size: 0.65rem;
    letter-spacing: 0.06em;
  }

  .status {
    color: #8a7060;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .location {
    color: #5a4020;
    font-size: 0.6rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .location.travelling {
    color: #9a8a4a;
    font-style: italic;
  }

  .money {
    color: #c8a050;
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    margin-top: 0.15rem;
  }

  .tab-bar {
    border-bottom: 1px solid #2a1e0e;
    display: flex;
    flex-shrink: 0;
    gap: 0;
  }

  .tab {
    background: none;
    border: none;
    border-right: 1px solid #2a1e0e;
    color: #5a4020;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    padding: 0.55rem 1.25rem;
    text-transform: uppercase;
    transition: color 0.15s;
  }

  .tab:hover {
    color: #8a7060;
  }

  .tab-active {
    color: #d4b896;
  }

  .panel-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 1.5rem;
    min-height: 0;
    overflow-y: auto;
    padding: 1.25rem;
  }

  .state-message {
    padding: 0;
  }

  .two-col-row {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: 1fr 1fr;
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-heading {
    border-bottom: 1px solid #2a1e0e;
    color: #8a7060;
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    padding-bottom: 0.4rem;
    text-transform: uppercase;
  }

  .vitals {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .vital {
    align-items: center;
    display: grid;
    gap: 0.5rem;
    grid-template-columns: 70px 1fr auto;
  }

  .vital-label {
    color: #8a7060;
    font-size: 0.7rem;
    letter-spacing: 0.05em;
  }

  .vital-desc {
    font-size: 0.65rem;
    letter-spacing: 0.05em;
    min-width: 64px;
    text-align: right;
    text-transform: uppercase;
  }

  .severity-good {
    background: #3a6b30;
  }

  .severity-warn {
    background: #6b5a30;
  }

  .severity-bad {
    background: #6b3a20;
  }

  .severity-critical {
    background: #6b2020;
  }

  .severity-text-good {
    color: #7aaa60;
  }

  .severity-text-warn {
    color: #c8a050;
  }

  .severity-text-bad {
    color: #c07040;
  }

  .severity-text-critical {
    color: #c04040;
  }

  .last-rested {
    color: #5a4020;
    font-size: 0.6rem;
    letter-spacing: 0.05em;
  }

  .characteristics,
  .skills {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .characteristic,
  .skill {
    align-items: center;
    display: grid;
    gap: 0.5rem;
    grid-template-columns: 72px 1fr 24px;
  }

  .char-label,
  .skill-name {
    color: #8a7060;
    font-size: 0.7rem;
    letter-spacing: 0.05em;
  }

  .char-value,
  .skill-value {
    color: #d4b896;
    font-size: 0.7rem;
    text-align: right;
  }

  .bar-track {
    background: #1e1508;
    border: 1px solid #2a1e0e;
    height: 6px;
  }

  .bar-fill {
    background: #5a4020;
    height: 100%;
    transition: width 0.3s ease;
  }

  .axes {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .axis {
    align-items: baseline;
    display: flex;
    gap: 0.5rem;
  }

  .axis-key {
    color: #5a4020;
    font-size: 0.65rem;
    letter-spacing: 0.05em;
    min-width: 72px;
    text-transform: uppercase;
  }

  .axis-value {
    color: #d4b896;
    font-size: 0.75rem;
  }

  .axis-raw {
    color: #5a4020;
    font-size: 0.65rem;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .tag {
    border: 1px solid #2a1e0e;
    color: #8a7060;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    padding: 0.2rem 0.5rem;
    text-transform: uppercase;
  }

  .origin-grid {
    column-gap: 1rem;
    display: grid;
    grid-template-columns: auto 1fr;
    row-gap: 0.4rem;
  }

  .origin-label {
    color: #5a4020;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .origin-grid span:not(.origin-label) {
    color: #c8b08a;
    font-size: 0.75rem;
  }

  .secret {
    color: #8a7060 !important;
    font-style: italic;
  }

  .scars {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    list-style: none;
  }

  .scars li {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .scar-type {
    color: #5a4020;
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .scar-desc {
    color: #c8b08a;
    font-size: 0.75rem;
  }

  .scar-trigger {
    color: #8a7060;
    font-size: 0.65rem;
    font-style: italic;
  }

  .inventory-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    list-style: none;
  }

  .inventory-item {
    align-items: baseline;
    display: flex;
    gap: 0.5rem;
    justify-content: space-between;
  }

  .inv-label {
    color: #c8b08a;
    flex: 1;
    font-size: 0.7rem;
    letter-spacing: 0.04em;
  }

  .inv-weight {
    color: #6a5040;
    font-size: 0.65rem;
    letter-spacing: 0.04em;
    text-align: right;
    white-space: nowrap;
  }

  .inv-count {
    color: #8a7060;
    font-size: 0.65rem;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .inventory-total {
    align-items: baseline;
    border-top: 1px solid #1e1508;
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    padding-top: 0.4rem;
  }

  .inv-total-label {
    color: #5a4020;
    font-size: 0.55rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .inv-total-weight {
    color: #c8b08a;
    font-size: 0.7rem;
    letter-spacing: 0.04em;
  }

  .muted {
    color: #5a4020;
    font-size: 0.8rem;
  }

  .error {
    color: #c0512a;
    font-size: 0.8rem;
  }
</style>
