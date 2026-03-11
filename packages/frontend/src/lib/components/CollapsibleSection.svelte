<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    title: string
    open?: boolean
    children: Snippet
  }

  let { title, open: initialOpen = false, children }: Props = $props()
  let expanded = $state(initialOpen)
</script>

<section>
  <button class="section-header" onclick={() => (expanded = !expanded)}>
    <h2>{title}</h2>
    <span class="toggle">{expanded ? "−" : "+"}</span>
  </button>
  {#if expanded}
    <div class="section-content">
      {@render children()}
    </div>
  {/if}
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
  }

  .section-header {
    align-items: center;
    background: none;
    border: none;
    border-bottom: 1px solid #2a1e0e;
    color: inherit;
    cursor: pointer;
    display: flex;
    font-family: inherit;
    justify-content: space-between;
    padding: 0 0 0.5rem;
  }

  .section-header:hover h2,
  .section-header:hover .toggle {
    color: #d4b896;
  }

  h2 {
    border: none;
    color: #8a7060;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    margin: 0;
    padding: 0;
    text-transform: uppercase;
  }

  .toggle {
    color: #8a7060;
    font-size: 0.85rem;
  }

  .section-content {
    padding-top: 1rem;
  }
</style>
