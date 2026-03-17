<script lang="ts">
  import { goto } from "$app/navigation"
  import { page } from "$app/stores"
  import { apiGetNpc, apiGetWorlds, apiJoinWorld, type NpcDetailResponse, type WorldListItem } from "$lib/api"
  import { authStore } from "$lib/stores/auth"
  import { onMount } from "svelte"

  let worlds = $state<WorldListItem[]>([])
  let npc = $state<NpcDetailResponse | null>(null)
  let loadError = $state<string | null>(null)
  let joiningId = $state<string | null>(null)
  let joinError = $state<string | null>(null)

  const npcId = $derived($page.url.searchParams.get("npcId") ?? "")

  onMount(async () => {
    if (!$authStore.token) {
      goto("/login")
      return
    }

    if (!npcId) {
      goto("/characters")
      return
    }

    try {
      const [worldList, npcDetail] = await Promise.all([apiGetWorlds(), apiGetNpc(npcId)])
      worlds = worldList
      npc = npcDetail
    } catch (err) {
      loadError = err instanceof Error ? err.message : "Failed to load"
    }
  })

  async function joinWorld(worldId: string) {
    joiningId = worldId
    joinError = null
    try {
      const result = await apiJoinWorld(worldId, npcId)
      authStore.setWorld(result.worldId, result.campId, result.npcId)
      goto("/world")
    } catch (err) {
      joinError = err instanceof Error ? err.message : "Failed to join world"
    } finally {
      joiningId = null
    }
  }

  function formatDate(date: WorldListItem["inWorldDate"]) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${months[date.month - 1]} ${date.day}, ${date.year}`
  }

  function formatLabel(value: string): string {
    return value.replace(/_/g, " ")
  }
</script>

<svelte:head>
  <title>Join World — Grim Frontier</title>
</svelte:head>

<div class="view">
  <div class="page-header">
    <a href="/characters" class="back-link">← Characters</a>
    <h1>Join a World</h1>
  </div>

  {#if loadError}
    <p class="error">{loadError}</p>
  {:else}
    {#if npc}
      <div class="selected-character">
        <div class="char-portrait">
          {#if npc.portraitUrl}
            <img src={npc.portraitUrl} alt={npc.name} class="portrait" />
          {:else}
            <div class="portrait-placeholder">{npc.name[0]}</div>
          {/if}
        </div>
        <div class="char-info">
          <span class="char-name">{npc.name}</span>
          <span class="char-meta">{formatLabel(npc.career)} · Age {npc.age}</span>
          <span class="char-note">Joining as this character is permanent. They cannot leave the world once entered.</span>
        </div>
      </div>
    {/if}

    {#if worlds.length === 0}
      <p class="muted">No active worlds found.</p>
    {:else}
      <ul class="world-list">
        {#each worlds as world}
          <li class="world-row">
            <div class="world-info">
              <span class="world-name">{world.name}</span>
              <span class="world-date">{formatDate(world.inWorldDate)}</span>
            </div>
            <button onclick={() => joinWorld(world.id)} disabled={joiningId !== null}>
              {joiningId === world.id ? "Joining…" : "Join"}
            </button>
          </li>
        {/each}
      </ul>
      {#if joinError}
        <p class="error">{joinError}</p>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .view {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    max-width: 480px;
  }

  .page-header {
    display: flex;
    align-items: baseline;
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

  h1 {
    font-size: 1.5rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .selected-character {
    border: 1px solid #2a1e0e;
    display: flex;
    gap: 0.85rem;
    padding: 0.75rem 1rem;
  }

  .char-portrait {
    flex-shrink: 0;
  }

  .portrait {
    height: 56px;
    object-fit: cover;
    width: 56px;
  }

  .portrait-placeholder {
    align-items: center;
    background: #1e1508;
    border: 1px solid #2a1e0e;
    color: #3a2a10;
    display: flex;
    font-size: 1.2rem;
    height: 56px;
    justify-content: center;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    width: 56px;
  }

  .char-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .char-name {
    color: #d4b896;
    font-size: 0.95rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .char-meta {
    color: #5a4020;
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .char-note {
    color: #5a4020;
    font-size: 0.65rem;
    letter-spacing: 0.04em;
    margin-top: 0.15rem;
  }

  .world-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    list-style: none;
  }

  .world-row {
    border: 1px solid #2a1e0e;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
  }

  .world-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .world-name {
    font-size: 0.95rem;
    letter-spacing: 0.05em;
  }

  .world-date {
    color: #5a4020;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
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
