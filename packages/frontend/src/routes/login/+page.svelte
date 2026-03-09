<script lang="ts">
  import { goto } from "$app/navigation"
  import { apiGetMe, apiGetNpc, apiLogin } from "$lib/api"
  import { authStore } from "$lib/stores/auth"

  let username = $state("")
  let password = $state("")
  let error = $state<string | null>(null)
  let loading = $state(false)

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    error = null
    loading = true
    try {
      const { token, playerId } = await apiLogin(username, password)
      authStore.setAuth(token, playerId, username)

      const me = await apiGetMe()
      const npcId = me.npcIds[0] ?? null
      if (npcId && me.campId) {
        const npc = await apiGetNpc(npcId)
        if (npc.worldId) {
          authStore.setWorld(npc.worldId, me.campId, npcId)
          goto("/world")
          return
        }
      }
      goto("/world/join")
    } catch (err) {
      error = err instanceof Error ? err.message : "Login failed"
    } finally {
      loading = false
    }
  }
</script>

<svelte:head>
  <title>Sign In — Grim Frontier</title>
</svelte:head>

<main>
  <a href="/" class="back">← Back</a>
  <h1>Sign In</h1>

  <form onsubmit={handleSubmit}>
    <label>
      <span>Username</span>
      <input type="text" bind:value={username} autocomplete="username" required />
    </label>
    <label>
      <span>Password</span>
      <input type="password" bind:value={password} autocomplete="current-password" required />
    </label>
    {#if error}
      <p class="error">{error}</p>
    {/if}
    <button type="submit" disabled={loading}>
      {loading ? "Signing in…" : "Sign In"}
    </button>
  </form>

  <p class="footer">No account? <a href="/register">Register</a></p>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3rem 2rem;
    gap: 1.5rem;
  }

  .back {
    align-self: flex-start;
    font-size: 0.8rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  h1 {
    font-size: 1.5rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 320px;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  label span {
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #8a7060;
  }

  .error {
    color: #c0512a;
    font-size: 0.85rem;
  }

  .footer {
    font-size: 0.8rem;
    color: #8a7060;
  }
</style>
