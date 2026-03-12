<script lang="ts">
  import type { TownDetailStore } from "@grim-frontier/shared"

  let { store, onClose }: { store: TownDetailStore; onClose: () => void } = $props()

  let groupedItems = $derived(() => {
    const groups: Record<string, typeof store.inventory> = {}
    for (const item of store.inventory) {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    }
    return groups
  })

  function formatPrice(price: number): string {
    return "$" + price.toFixed(2)
  }

  function formatCategory(category: string): string {
    return category.replace(/_/g, " ")
  }

  function formatStoreType(type: string): string {
    return type.replace(/_/g, " ")
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) onClose()
  }
</script>

<div class="overlay" role="dialog" aria-modal="true" onclick={handleOverlayClick}>
  <div class="catalog">
    <button class="close-btn" onclick={onClose}>&#x2715;</button>

    <div class="catalog-header">
      <span class="store-type">{formatStoreType(store.type)}</span>
      <h2 class="store-name">{store.name}</h2>
      <span class="proprietor">{store.proprietor}, Proprietor</span>
    </div>

    <div class="catalog-description">
      <p>{store.description}</p>
    </div>

    <div class="catalog-rule"></div>

    <div class="catalog-body">
      {#each Object.entries(groupedItems()) as [category, items]}
        <div class="category-group">
          <h3 class="category-header">{formatCategory(category)}</h3>
          <ul class="item-list">
            {#each items as item}
              <li class="item-row">
                <span class="item-name">
                  {item.name}
                  {#if item.description}
                    <span class="item-note">{item.description}</span>
                  {/if}
                </span>
                <span class="item-dots"></span>
                <span class="item-price">{formatPrice(item.price)}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .overlay {
    align-items: center;
    background: rgba(0, 0, 0, 0.8);
    bottom: 0;
    display: flex;
    justify-content: center;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 200;
  }

  .catalog {
    background: #1e150a;
    border: 2px solid #5a4020;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.6);
    max-height: 85vh;
    max-width: 520px;
    overflow-y: auto;
    position: relative;
    width: 92vw;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #8a7060;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.75rem;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 1;
  }

  .close-btn:hover {
    background: transparent;
    color: #d4b896;
  }

  .catalog-header {
    border-bottom: 1px solid #3a2a18;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 1.5rem 1.5rem 1rem;
    text-align: center;
  }

  .store-type {
    color: #5a4020;
    font-size: 0.6rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .store-name {
    font-size: 1.5rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #d4b896;
  }

  .proprietor {
    color: #8a7060;
    font-family: "Corinthia", cursive;
    font-size: 1.3rem;
  }

  .catalog-description {
    padding: 1rem 1.5rem;
  }

  .catalog-description p {
    color: #a89070;
    font-size: 0.78rem;
    font-style: italic;
    line-height: 1.6;
    margin: 0;
  }

  .catalog-rule {
    border-top: 1px solid #3a2a18;
    margin: 0 1.5rem;
  }

  .catalog-body {
    padding: 0.5rem 1.5rem 1.5rem;
  }

  .category-group {
    margin-top: 1rem;
  }

  .category-header {
    border-bottom: 1px solid #2a1e0e;
    color: #8a7060;
    font-size: 0.6rem;
    letter-spacing: 0.18em;
    margin-bottom: 0.5rem;
    padding-bottom: 0.35rem;
    text-transform: uppercase;
  }

  .item-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .item-row {
    align-items: baseline;
    display: flex;
    font-size: 0.8rem;
    gap: 0.25rem;
    padding: 0.2rem 0;
  }

  .item-name {
    color: #d4b896;
    flex-shrink: 0;
  }

  .item-note {
    color: #6a5040;
    font-size: 0.7rem;
    font-style: italic;
  }

  .item-dots {
    border-bottom: 1px dotted #3a2a18;
    flex: 1;
    margin-bottom: 0.25em;
    min-width: 1rem;
  }

  .item-price {
    color: #c8a050;
    flex-shrink: 0;
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    text-align: right;
  }
</style>
