<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    title: string
    open?: boolean
    children: Snippet
  }

  let { title, open: initialOpen = true, children }: Props = $props()
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
    background: #1e1508;
    border: 1px solid #3a2a14;
    border-radius: 2px;
    display: flex;
    flex-direction: column;
  }

  .section-header {
    align-items: center;
    background: none;
    border: none;
    border-bottom: 1px solid #3a2a14;
    color: inherit;
    cursor: pointer;
    display: flex;
    font-family: inherit;
    justify-content: space-between;
    padding: 0.6rem 1rem;
  }

  .section-header:hover h2,
  .section-header:hover .toggle {
    color: #d4b896;
  }

  h2 {
    border: none;
    color: #b09070;
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    margin: 0;
    padding: 0;
    text-transform: uppercase;
  }

  .toggle {
    color: #b09070;
    font-size: 0.85rem;
  }

  .section-content {
    padding: 1rem;
  }
</style>
