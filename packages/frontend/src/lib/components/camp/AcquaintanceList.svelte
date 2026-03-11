<script lang="ts">
  import CollapsibleSection from "$lib/components/CollapsibleSection.svelte"
  import { acquaintanceStore } from "$lib/stores/acquaintances"
  import { npcPanelStore } from "$lib/stores/npcPanels"

  function formatCareer(career: string): string {
    return career.replace(/_/g, " ")
  }
</script>

{#if $acquaintanceStore.length > 0}
  <CollapsibleSection title="Past Visitors">
    <div class="list">
      {#each $acquaintanceStore as acquaintance}
        <button
          class="acquaintance-row"
          onclick={() =>
            npcPanelStore.open({
              key: acquaintance.npcId,
              npcId: acquaintance.npcId,
              name: acquaintance.npcName,
              career: acquaintance.npcCareer,
            })}
        >
          <span class="name">{acquaintance.npcName}</span>
          <span class="career">{formatCareer(acquaintance.npcCareer)}</span>
        </button>
      {/each}
    </div>
  </CollapsibleSection>
{/if}

<style>
  .list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .acquaintance-row {
    align-items: center;
    background: #1a1008;
    border: 1px solid #2a1e0e;
    color: inherit;
    cursor: pointer;
    display: flex;
    font-family: inherit;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
    text-align: left;
    width: 100%;
  }

  .acquaintance-row:hover .name {
    color: #d4b896;
  }

  .name {
    color: #a89070;
    font-size: 0.75rem;
    letter-spacing: 0.04em;
  }

  .career {
    color: #6a5a40;
    font-size: 0.6rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
</style>
