<script lang="ts">
  import { npcPanelStore } from "$lib/stores/npcPanels"
  import NpcPanel from "./NpcPanel.svelte"

  const panels = npcPanelStore
</script>

{#if $panels.length > 0}
  <div class="overlay" role="dialog" aria-modal="true">
    <div class="panels">
      {#each $panels as entry (entry.key)}
        <NpcPanel {entry} />
      {/each}
    </div>
  </div>
{/if}

<style>
  .overlay {
    align-items: center;
    background: rgba(0, 0, 0, 0.75);
    bottom: 0;
    display: flex;
    justify-content: center;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 100;
  }

  .panels {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    max-width: 95vw;
    overflow-x: auto;
    padding: 1rem;
  }
</style>
