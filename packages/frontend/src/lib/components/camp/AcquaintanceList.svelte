<script lang="ts">
  import { acquaintanceStore } from "$lib/stores/acquaintances"

  function formatCareer(career: string): string {
    return career.replace(/_/g, " ")
  }
</script>

{#if $acquaintanceStore.length > 0}
  <section class="acquaintances">
    <h3 class="section-label">Past Visitors</h3>
    <div class="list">
      {#each $acquaintanceStore as acquaintance}
        <div class="acquaintance-row">
          <span class="name">{acquaintance.npcName}</span>
          <span class="career">{formatCareer(acquaintance.npcCareer)}</span>
        </div>
      {/each}
    </div>
  </section>
{/if}

<style>
  .acquaintances {
    margin-top: 2rem;
  }

  .section-label {
    color: #8a7060;
    font-size: 0.65rem;
    font-weight: normal;
    letter-spacing: 0.15em;
    margin: 0 0 0.75rem;
    text-transform: uppercase;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .acquaintance-row {
    align-items: center;
    background: #1a1008;
    border: 1px solid #2a1e0e;
    display: flex;
    gap: 0.75rem;
    padding: 0.5rem 0.75rem;
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
