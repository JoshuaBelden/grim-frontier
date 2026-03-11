<script lang="ts">
  import type { InWorldDate, NpcDetailEvent } from "@grim-frontier/shared"
  import { authStore } from "$lib/stores/auth"
  import { npcPanelStore, type PanelEntry } from "$lib/stores/npcPanels"
  import { wsErrorStore } from "$lib/stores/wsError"
  import { sendCommand } from "$lib/ws"
  import { npcDetailStore } from "$lib/wsHandler"
  import { onMount } from "svelte"

  let { entry }: { entry: PanelEntry } = $props()

  let npc = $derived($npcDetailStore.get(entry.npcId) ?? null)

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

  /** Returns a description and severity class for fatigue (0=best, 10=worst). */
  function fatigueDesc(value: number): { label: string; severity: string } {
    if (value <= 3) return { label: "Rested", severity: "good" }
    if (value <= 6) return { label: "Tired", severity: "warn" }
    if (value <= 8) return { label: "Exhausted", severity: "bad" }
    if (value === 9) return { label: "Fading", severity: "critical" }
    return { label: "Collapsed", severity: "critical" }
  }

  /** Returns a description and severity class for hunger (0=best, 10=worst). */
  function hungerDesc(value: number): { label: string; severity: string } {
    if (value <= 3) return { label: "Full", severity: "good" }
    if (value <= 6) return { label: "Peckish", severity: "warn" }
    if (value <= 8) return { label: "Hungry", severity: "bad" }
    if (value === 9) return { label: "Weak", severity: "critical" }
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

  function startResting() {
    sendCommand({ type: "startNpcAction", npcId: entry.npcId, actionType: "resting" })
  }
</script>

<div class="panel">
  <button class="close" onclick={close} aria-label="Close">✕</button>

  <div class="panel-header">
    <p class="career-label">{entry.career ? formatKey(entry.career) : "Player"}</p>
    <h2 class="name">{entry.name}</h2>
    {#if npc}
      <span class="status">{npc.status.replace(/_/g, " ")}</span>
      {#if npc.status === "travelling" && npc.travelDestination}
        <span class="location travelling">Heading to {npc.travelDestination}</span>
      {:else if npc.locationName}
        <span class="location">{npc.locationName}</span>
      {/if}
    {/if}
  </div>

  <div class="panel-body">
    {#if error}
      <p class="error">{error}</p>
    {:else if !npc}
      <p class="muted">Loading…</p>
    {:else}
      <section>
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
            <span class="vital-label">Fatigue</span>
            <div class="bar-track">
              <div class="bar-fill severity-{fatigueDesc(npc.fatigue).severity}" style="width: {npc.fatigue * 10}%"></div>
            </div>
            <span class="vital-desc severity-text-{fatigueDesc(npc.fatigue).severity}">{fatigueDesc(npc.fatigue).label}</span>
          </div>
          <div class="vital">
            <span class="vital-label">Hunger</span>
            <div class="bar-track">
              <div class="bar-fill severity-{hungerDesc(npc.hunger).severity}" style="width: {npc.hunger * 10}%"></div>
            </div>
            <span class="vital-desc severity-text-{hungerDesc(npc.hunger).severity}">{hungerDesc(npc.hunger).label}</span>
          </div>
        </div>
        {#if npc.status === "at_camp" && npc.ownerId === $authStore.playerId}
          <div class="rest-action">
            <button class="action-btn" onclick={startResting}>Rest</button>
            {#if npc.lastRestedAt}
              <span class="last-rested">Last rested: {formatDate(npc.lastRestedAt)}</span>
            {:else}
              <span class="last-rested">Never rested</span>
            {/if}
          </div>
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
  </div>
</div>

<style>
  .panel {
    background: #110c06;
    border: 1px solid #5a4020;
    display: flex;
    flex-direction: column;
    height: 85vh;
    min-width: 380px;
    overflow: hidden;
    position: relative;
    width: 420px;
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
  }

  .close:hover {
    color: #d4b896;
  }

  .panel-header {
    border-bottom: 1px solid #2a1e0e;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 1.25rem 1.25rem 1rem 2.5rem;
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

  .panel-body {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    overflow-y: auto;
    padding: 1.25rem;
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
    grid-template-columns: 60px 1fr auto;
  }

  .vital-label {
    color: #8a7060;
    font-size: 0.7rem;
    letter-spacing: 0.05em;
  }

  .vital-desc {
    font-size: 0.65rem;
    letter-spacing: 0.05em;
    text-align: right;
    text-transform: uppercase;
    min-width: 72px;
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

  .rest-action {
    align-items: center;
    display: flex;
    gap: 0.75rem;
    margin-top: 0.25rem;
  }

  .action-btn {
    background: #2a1e0e;
    border: 1px solid #5a4020;
    color: #d4b896;
    cursor: pointer;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    padding: 0.3rem 0.75rem;
    text-transform: uppercase;
    transition: background 0.15s;
  }

  .action-btn:hover {
    background: #3a2e1e;
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
    grid-template-columns: 80px 1fr 24px;
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
    min-width: 80px;
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

  .muted {
    color: #5a4020;
    font-size: 0.8rem;
  }

  .error {
    color: #c0512a;
    font-size: 0.8rem;
  }
</style>
