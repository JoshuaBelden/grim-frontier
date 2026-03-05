<script lang="ts">
  import { goto } from "$app/navigation"
  import { apiGetMe } from "$lib/api"
  import { authStore } from "$lib/stores/auth"
  import { onMount } from "svelte"

  onMount(async () => {
    const { token, worldId } = $authStore
    if (!token) return

    if (worldId) {
      goto("/world")
      return
    }

    try {
      const me = await apiGetMe()
      if (me.worldId && me.campId) {
        authStore.setWorld(me.worldId, me.campId)
        goto("/world")
      } else {
        goto("/world/join")
      }
    } catch {
      authStore.clear()
    }
  })
</script>

<svelte:head>
  <title>Grim Frontier</title>
</svelte:head>

<main>
  <h1>Grim Frontier</h1>
  <p class="tagline">The frontier awaits.</p>
  <nav>
    <a href="/login">Sign In</a>
    <span class="sep">—</span>
    <a href="/register">Register</a>
  </nav>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    gap: 1.5rem;
    padding: 2rem;
  }

  h1 {
    font-size: 3rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .tagline {
    color: #8a7060;
    font-size: 0.9rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  nav {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .sep {
    color: #5a4020;
  }
</style>
