<script lang="ts">
  import { goto } from "$app/navigation"
  import { apiDeleteCharacter, apiListMyNpcs, type PlayerNpcSummary } from "$lib/api"
  import { authStore } from "$lib/stores/auth"
  import { onMount } from "svelte"

  let characters = $state<PlayerNpcSummary[]>([])
  let loadError = $state<string | null>(null)
  let deletingId = $state<string | null>(null)
  let confirmDeleteId = $state<string | null>(null)

  onMount(async () => {
    if (!$authStore.token) {
      goto("/login")
      return
    }
    try {
      characters = await apiListMyNpcs()
    } catch (err) {
      loadError = err instanceof Error ? err.message : "Failed to load characters"
    }
  })

  async function handleDelete(id: string) {
    deletingId = id
    try {
      await apiDeleteCharacter(id)
      characters = characters.filter(character => character.id !== id)
    } catch (err) {
      loadError = err instanceof Error ? err.message : "Failed to delete character"
    } finally {
      deletingId = null
      confirmDeleteId = null
    }
  }

  function returnToWorld(character: PlayerNpcSummary) {
    if (!character.worldId || !character.campId) return
    authStore.setWorld(character.worldId, character.campId, character.id)
    goto("/world")
  }

  function formatCareer(career: string): string {
    return career.replace(/_/g, " ")
  }
</script>

<svelte:head>
  <title>Characters — Grim Frontier</title>
</svelte:head>

<div class="view">
  <div class="header">
    <h1>Characters</h1>
    <a href="/characters/new" class="create-btn">Create Character</a>
  </div>

  {#if loadError}
    <p class="error">{loadError}</p>
  {:else if characters.length === 0}
    <div class="empty">
      <p class="muted">You have no characters yet.</p>
      <a href="/characters/new" class="create-btn">Create your first character</a>
    </div>
  {:else}
    <ul class="character-list">
      {#each characters as character}
        <li class="character-card">
          <div class="portrait-wrap">
            {#if character.portraitUrl}
              <img src={character.portraitUrl} alt={character.name} class="portrait" />
            {:else}
              <div class="portrait-placeholder">
                <span class="portrait-initials">{character.name[0]}</span>
              </div>
            {/if}
          </div>

          <div class="character-info">
            <a href="/characters/{character.id}" class="character-name">{character.name}</a>
            <span class="character-meta">{formatCareer(character.career)} · Age {character.age}</span>
            {#if character.worldId}
              <span class="world-badge">In World</span>
            {:else}
              <span class="available-badge">Available</span>
            {/if}
          </div>

          <div class="character-actions">
            {#if character.worldId}
              <button class="action-btn primary" onclick={() => returnToWorld(character)}>Return to World</button>
            {:else}
              <a href="/world/join?npcId={character.id}" class="action-btn primary">Join a World</a>
              {#if confirmDeleteId === character.id}
                <div class="confirm-row">
                  <span class="confirm-label">Delete?</span>
                  <button
                    class="action-btn danger"
                    onclick={() => handleDelete(character.id)}
                    disabled={deletingId === character.id}
                  >
                    {deletingId === character.id ? "Deleting…" : "Yes, Delete"}
                  </button>
                  <button class="action-btn" onclick={() => (confirmDeleteId = null)}>Cancel</button>
                </div>
              {:else}
                <button class="action-btn" onclick={() => (confirmDeleteId = character.id)}>Delete</button>
              {/if}
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .view {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    max-width: 640px;
  }

  .header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }

  h1 {
    font-size: 1.5rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .create-btn {
    background: none;
    border: 1px solid #5a4020;
    color: #c4a882;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    padding: 0.35rem 0.75rem;
    text-decoration: none;
    text-transform: uppercase;
    transition: border-color 0.15s, color 0.15s;
  }

  .create-btn:hover {
    border-color: #c4a882;
    color: #e0cba8;
  }

  .empty {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .character-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    list-style: none;
  }

  .character-card {
    border: 1px solid #2a1e0e;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
  }

  .portrait-wrap {
    flex-shrink: 0;
  }

  .portrait {
    width: 56px;
    height: 56px;
    object-fit: cover;
  }

  .portrait-placeholder {
    align-items: center;
    background: #1e1508;
    border: 1px solid #2a1e0e;
    display: flex;
    height: 56px;
    justify-content: center;
    width: 56px;
  }

  .portrait-initials {
    color: #5a4020;
    font-size: 1.2rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .character-info {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  .character-name {
    color: #d4b896;
    font-size: 0.95rem;
    letter-spacing: 0.06em;
    text-decoration: none;
    text-transform: uppercase;
    transition: color 0.15s;
  }

  .character-name:hover {
    color: #e0cba8;
  }

  .character-meta {
    color: #5a4020;
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .world-badge,
  .available-badge {
    align-self: flex-start;
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    padding: 0.1rem 0.4rem;
    text-transform: uppercase;
  }

  .world-badge {
    background: #1a2a10;
    border: 1px solid #3a6b30;
    color: #7aaa4a;
  }

  .available-badge {
    background: #1e1508;
    border: 1px solid #2a1e0e;
    color: #5a4020;
  }

  .character-actions {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    flex-shrink: 0;
    align-items: flex-end;
  }

  .action-btn {
    background: none;
    border: 1px solid #5a4020;
    color: #8a7060;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    padding: 0.25rem 0.6rem;
    text-decoration: none;
    text-transform: uppercase;
    transition: border-color 0.15s, color 0.15s;
  }

  .action-btn:hover:not(:disabled) {
    border-color: #8a7060;
    color: #c4a882;
  }

  .action-btn.primary {
    border-color: #7a5a20;
    color: #c4a882;
  }

  .action-btn.primary:hover {
    border-color: #c4a882;
    color: #e0cba8;
  }

  .action-btn.danger {
    border-color: #6b2020;
    color: #c05030;
  }

  .action-btn.danger:hover:not(:disabled) {
    border-color: #c05030;
    color: #e06040;
  }

  .confirm-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .confirm-label {
    color: #8a7060;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
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
