<script lang="ts">
  import type { Snippet } from 'svelte'
  let { children }: { children: Snippet } = $props()
</script>

{@render children()}

<style>
  :global(*) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    background: #1a1208;
    color: #d4b896;
    font-family: monospace;
    min-height: 100vh;
  }

  :global(a) {
    color: #d4b896;
    text-decoration: none;
  }

  :global(a:hover) {
    text-decoration: underline;
  }

  :global(input) {
    background: #2a1e0e;
    border: 1px solid #5a4020;
    color: #d4b896;
    font-family: monospace;
    font-size: 1rem;
    padding: 0.5rem 0.75rem;
    width: 100%;
  }

  :global(input:focus) {
    border-color: #d4b896;
    outline: none;
  }

  :global(button) {
    background: transparent;
    border: 1px solid #d4b896;
    color: #d4b896;
    cursor: pointer;
    font-family: monospace;
    font-size: 0.9rem;
    letter-spacing: 0.1em;
    padding: 0.5rem 1.25rem;
    text-transform: uppercase;
  }

  :global(button:hover) {
    background: #d4b896;
    color: #1a1208;
  }

  :global(button:disabled) {
    cursor: not-allowed;
    opacity: 0.5;
  }
</style>
