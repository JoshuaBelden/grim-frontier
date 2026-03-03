<script lang="ts">
  import { onMount } from "svelte";

  let serverStatus = $state<"connecting" | "ok" | "error">("connecting");

  onMount(async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      serverStatus = data.status === "ok" ? "ok" : "error";
    } catch {
      serverStatus = "error";
    }
  });
</script>

<svelte:head>
  <title>Grim Frontier</title>
</svelte:head>

<main>
  <h1>Grim Frontier</h1>
  <p>The frontier awaits.</p>
  <p>
    Server:
    {#if serverStatus === "connecting"}
      checking…
    {:else if serverStatus === "ok"}
      online
    {:else}
      unreachable
    {/if}
  </p>
</main>

<style>
  main {
    font-family: monospace;
    padding: 2rem;
    color: #d4b896;
    background: #1a1208;
    min-height: 100vh;
  }

  h1 {
    font-size: 2rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
</style>
