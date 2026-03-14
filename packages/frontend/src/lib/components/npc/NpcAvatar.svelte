<script lang="ts">
  import { npcPanelStore, type PanelEntry } from "$lib/stores/npcPanels"
  import { npcDetailStore } from "$lib/wsHandler"

  let { entry }: { entry: PanelEntry } = $props()

  let npcDetail = $derived($npcDetailStore.get(entry.npcId))
  let money = $derived(npcDetail?.money)
  let portraitUrl = $derived(npcDetail?.portraitUrl ?? "/images/default-avatar.png")

  function handleClick() {
    npcPanelStore.open(entry)
  }
</script>

<button class="avatar" onclick={handleClick} title={entry.name}>
  <img src={portraitUrl} alt={entry.name} class="portrait" />
  <span class="name">{entry.name}</span>
  {#if entry.location}
    <span class="location">{entry.location}</span>
  {/if}
  {#if money !== undefined}
    <span class="money">${money.toFixed(2)}</span>
  {/if}
</button>

<style>
  .avatar {
    align-items: center;
    background: #1a1008;
    border: 1px solid #5a4020;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem 0.4rem;
    transition: border-color 0.15s;
    width: 56px;
  }

  .avatar:hover {
    border-color: #d4b896;
  }

  .portrait {
    height: 40px;
    object-fit: cover;
    width: 40px;
  }

  .name {
    color: #8a7060;
    font-size: 0.55rem;
    letter-spacing: 0.06em;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
    width: 100%;
  }

  .location {
    color: #5a4020;
    font-size: 0.5rem;
    letter-spacing: 0.04em;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
    width: 100%;
  }

  .money {
    color: #c8a050;
    font-size: 0.5rem;
    letter-spacing: 0.04em;
    text-align: center;
    width: 100%;
  }
</style>
