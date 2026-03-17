<script lang="ts">
  import { goto } from "$app/navigation"
  import { page } from "$app/stores"
  import { apiGeneratePortrait, apiGetNpc, type NpcDetailResponse } from "$lib/api"
  import { authStore } from "$lib/stores/auth"
  import { onMount } from "svelte"

  let npc = $state<NpcDetailResponse | null>(null)
  let loadError = $state<string | null>(null)
  let generatingPortrait = $state(false)
  let portraitError = $state<string | null>(null)

  const npcId = $derived($page.params.id)

  onMount(async () => {
    if (!$authStore.token) {
      goto("/login")
      return
    }
    try {
      npc = await apiGetNpc(npcId)
    } catch (err) {
      loadError = err instanceof Error ? err.message : "Failed to load character"
    }
  })

  async function handleGeneratePortrait() {
    if (!npc) return
    generatingPortrait = true
    portraitError = null
    try {
      const result = await apiGeneratePortrait(npcId)
      npc = { ...npc, portraitUrl: result.portraitUrl }
    } catch (err) {
      portraitError = err instanceof Error ? err.message : "Portrait generation failed"
    } finally {
      generatingPortrait = false
    }
  }

  function returnToWorld() {
    if (!npc?.worldId || !npc.campId) return
    authStore.setWorld(npc.worldId, npc.campId, npc.id)
    goto("/world")
  }

  function formatLabel(value: string): string {
    return value.replace(/_/g, " ")
  }

  function formatNatureValue(value: number): string {
    return value > 0 ? `+${value}` : String(value)
  }
</script>

<svelte:head>
  <title>{npc ? npc.name : "Character"} — Grim Frontier</title>
</svelte:head>

<div class="view">
  <div class="page-header">
    <a href="/characters" class="back-link">← Characters</a>
  </div>

  {#if loadError}
    <p class="error">{loadError}</p>
  {:else if !npc}
    <p class="muted">Loading…</p>
  {:else}
    <div class="character-layout">

      <!-- Portrait + actions -->
      <div class="sidebar">
        <div class="portrait-section">
          {#if npc.portraitUrl}
            <img src={npc.portraitUrl} alt={npc.name} class="portrait" />
          {:else}
            <div class="portrait-placeholder">
              <span class="portrait-initials">{npc.name[0]}</span>
              <span class="portrait-label">No portrait</span>
            </div>
          {/if}
          {#if portraitError}
            <p class="error small">{portraitError}</p>
          {/if}
          <button
            class="portrait-btn"
            onclick={handleGeneratePortrait}
            disabled={generatingPortrait || !npc.portraitDescription}
            title={!npc.portraitDescription ? "Add a portrait description first" : ""}
          >
            {generatingPortrait ? "Generating…" : npc.portraitUrl ? "Regenerate Portrait" : "Generate Portrait"}
          </button>
        </div>

        <div class="identity-block">
          <h1 class="npc-name">{npc.name}</h1>
          <span class="npc-career">{formatLabel(npc.career)}</span>
          <span class="npc-age">Age {npc.age}</span>
          {#if npc.worldId}
            <span class="world-badge">In World</span>
          {/if}
        </div>

        <div class="action-block">
          {#if npc.worldId}
            <button class="action-btn primary" onclick={returnToWorld}>Return to World</button>
          {:else}
            <a href="/world/join?npcId={npc.id}" class="action-btn primary">Join a World</a>
          {/if}
        </div>
      </div>

      <!-- Details -->
      <div class="details">

        {#if npc.portraitDescription}
          <section class="detail-section">
            <h2 class="detail-title">Portrait Description</h2>
            <p class="detail-text">{npc.portraitDescription}</p>
          </section>
        {/if}

        <!-- Characteristics -->
        <section class="detail-section">
          <h2 class="detail-title">Characteristics</h2>
          <div class="stat-grid">
            {#each Object.entries(npc.characteristics) as [key, value]}
              <div class="stat-row">
                <span class="stat-label">{formatLabel(key)}</span>
                <div class="stat-bar">
                  <div class="stat-fill" style="width: {value * 10}%"></div>
                </div>
                <span class="stat-value">{value}</span>
              </div>
            {/each}
          </div>
        </section>

        <!-- Disposition -->
        <section class="detail-section">
          <h2 class="detail-title">Disposition</h2>
          <div class="nature-display">
            {#each Object.entries(npc.nature.disposition) as [key, value]}
              <div class="nature-row">
                <span class="nature-label">{formatLabel(key)}</span>
                <div class="nature-bar-wrap">
                  <div class="nature-bar">
                    <div
                      class="nature-fill"
                      style="width: {Math.abs(value) * 10}%; margin-left: {value < 0 ? (50 - Math.abs(value) * 10) : 50}%"
                      class:positive={value > 0}
                      class:negative={value < 0}
                    ></div>
                    <div class="nature-midline"></div>
                  </div>
                </div>
                <span class="nature-value">{formatNatureValue(value)}</span>
              </div>
            {/each}
          </div>
        </section>

        <!-- Outlook -->
        <section class="detail-section">
          <h2 class="detail-title">Outlook</h2>
          <div class="nature-display">
            {#each Object.entries(npc.nature.outlook) as [key, value]}
              <div class="nature-row">
                <span class="nature-label">{formatLabel(key)}</span>
                <div class="nature-bar-wrap">
                  <div class="nature-bar">
                    <div
                      class="nature-fill"
                      style="width: {Math.abs(value) * 10}%; margin-left: {value < 0 ? (50 - Math.abs(value) * 10) : 50}%"
                      class:positive={value > 0}
                      class:negative={value < 0}
                    ></div>
                    <div class="nature-midline"></div>
                  </div>
                </div>
                <span class="nature-value">{formatNatureValue(value)}</span>
              </div>
            {/each}
          </div>
        </section>

        <!-- Traits -->
        {#if npc.traits.length > 0}
          <section class="detail-section">
            <h2 class="detail-title">Traits</h2>
            <div class="chip-list">
              {#each npc.traits as trait}
                <span class="chip">{formatLabel(trait)}</span>
              {/each}
            </div>
          </section>
        {/if}

        <!-- Skills -->
        {#if Object.keys(npc.skills).length > 0}
          <section class="detail-section">
            <h2 class="detail-title">Skills</h2>
            <div class="skill-list">
              {#each Object.entries(npc.skills) as [skill, level]}
                <div class="skill-row">
                  <span class="skill-name">{formatLabel(skill)}</span>
                  <span class="skill-level">{level}</span>
                </div>
              {/each}
            </div>
          </section>
        {/if}

        <!-- Origin -->
        <section class="detail-section">
          <h2 class="detail-title">Background</h2>
          <div class="origin-grid">
            <div class="origin-item">
              <span class="origin-label">Origin</span>
              <span class="origin-value">{formatLabel(npc.origin.background.origin)}</span>
            </div>
            <div class="origin-item">
              <span class="origin-label">Family</span>
              <span class="origin-value">{formatLabel(npc.origin.background.family)}</span>
            </div>
          </div>
          {#if npc.origin.background.formativeEvent}
            <p class="detail-text">{npc.origin.background.formativeEvent}</p>
          {/if}
        </section>

        <!-- Scars -->
        {#if npc.origin.scars.length > 0}
          <section class="detail-section">
            <h2 class="detail-title">Scars</h2>
            {#each npc.origin.scars as scar}
              <div class="scar-item">
                <span class="scar-type">{formatLabel(scar.type)}</span>
                <p class="scar-desc">{scar.description}</p>
                {#if scar.triggerCondition}
                  <p class="scar-trigger">Trigger: {scar.triggerCondition}</p>
                {/if}
              </div>
            {/each}
          </section>
        {/if}

      </div>
    </div>
  {/if}
</div>

<style>
  .view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 900px;
  }

  .page-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .back-link {
    color: #5a4020;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-decoration: none;
    text-transform: uppercase;
    transition: color 0.15s;
  }

  .back-link:hover {
    color: #c4a882;
  }

  .character-layout {
    display: grid;
    gap: 2rem;
    grid-template-columns: 220px 1fr;
  }

  /* Sidebar */
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .portrait-section {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .portrait {
    width: 100%;
    object-fit: cover;
  }

  .portrait-placeholder {
    align-items: center;
    aspect-ratio: 1;
    background: #0e0a04;
    border: 1px solid #2a1e0e;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    justify-content: center;
    width: 100%;
  }

  .portrait-initials {
    color: #3a2a10;
    font-size: 3rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .portrait-label {
    color: #3a2a10;
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .portrait-btn {
    background: none;
    border: 1px solid #5a4020;
    color: #8a7060;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    padding: 0.35rem 0.6rem;
    text-align: center;
    text-transform: uppercase;
    transition: all 0.15s;
    width: 100%;
  }

  .portrait-btn:hover:not(:disabled) {
    border-color: #c4a882;
    color: #c4a882;
  }

  .portrait-btn:disabled {
    cursor: default;
    opacity: 0.4;
  }

  .identity-block {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .npc-name {
    color: #d4b896;
    font-size: 1.1rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .npc-career,
  .npc-age {
    color: #5a4020;
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .world-badge {
    align-self: flex-start;
    background: #1a2a10;
    border: 1px solid #3a6b30;
    color: #7aaa4a;
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    margin-top: 0.25rem;
    padding: 0.1rem 0.4rem;
    text-transform: uppercase;
  }

  .action-block {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-btn {
    background: none;
    border: 1px solid #5a4020;
    color: #8a7060;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    padding: 0.35rem 0.6rem;
    text-align: center;
    text-decoration: none;
    text-transform: uppercase;
    transition: all 0.15s;
  }

  .action-btn.primary {
    border-color: #7a5a20;
    color: #c4a882;
  }

  .action-btn.primary:hover {
    border-color: #c4a882;
    color: #e0cba8;
  }

  /* Details */
  .details {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .detail-section {
    border: 1px solid #2a1e0e;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.85rem;
  }

  .detail-title {
    color: #c4a882;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .detail-text {
    color: #8a7060;
    font-size: 0.85rem;
    line-height: 1.5;
  }

  /* Stat bars */
  .stat-grid {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .stat-row {
    align-items: center;
    display: flex;
    gap: 0.6rem;
  }

  .stat-label {
    color: #5a4020;
    font-size: 0.65rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    width: 80px;
  }

  .stat-bar {
    background: #0e0a04;
    border: 1px solid #1e1508;
    flex: 1;
    height: 6px;
  }

  .stat-fill {
    background: #7a5a20;
    height: 100%;
    transition: width 0.3s;
  }

  .stat-value {
    color: #c4a882;
    font-size: 0.75rem;
    text-align: right;
    width: 18px;
  }

  /* Nature bars */
  .nature-display {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .nature-row {
    align-items: center;
    display: flex;
    gap: 0.6rem;
  }

  .nature-label {
    color: #5a4020;
    font-size: 0.65rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    width: 90px;
  }

  .nature-bar-wrap {
    flex: 1;
  }

  .nature-bar {
    background: #0e0a04;
    border: 1px solid #1e1508;
    height: 6px;
    position: relative;
  }

  .nature-fill {
    height: 100%;
    position: absolute;
    top: 0;
    transition: width 0.3s;
  }

  .nature-fill.positive {
    background: #3a6b30;
  }

  .nature-fill.negative {
    background: #6b3a20;
  }

  .nature-midline {
    background: #2a1e0e;
    height: 100%;
    left: 50%;
    position: absolute;
    top: 0;
    width: 1px;
  }

  .nature-value {
    color: #c4a882;
    font-size: 0.7rem;
    text-align: right;
    width: 28px;
  }

  /* Chips */
  .chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .chip {
    background: #1a1208;
    border: 1px solid #3a2a10;
    color: #8a7060;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    padding: 0.2rem 0.5rem;
    text-transform: uppercase;
  }

  /* Skills */
  .skill-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .skill-row {
    align-items: center;
    display: flex;
    gap: 0.5rem;
    justify-content: space-between;
  }

  .skill-name {
    color: #8a7060;
    font-size: 0.7rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .skill-level {
    color: #c4a882;
    font-size: 0.75rem;
  }

  /* Origin */
  .origin-grid {
    display: flex;
    gap: 1.5rem;
  }

  .origin-item {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .origin-label {
    color: #5a4020;
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .origin-value {
    color: #c4a882;
    font-size: 0.8rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  /* Scars */
  .scar-item {
    border-left: 2px solid #3a2a10;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-left: 0.75rem;
  }

  .scar-type {
    color: #8a7060;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .scar-desc {
    color: #8a7060;
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .scar-trigger {
    color: #5a4020;
    font-size: 0.7rem;
    font-style: italic;
  }

  .small {
    font-size: 0.75rem;
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
