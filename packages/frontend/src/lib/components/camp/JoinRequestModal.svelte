<script lang="ts">
  import { joinRequestStore } from "$lib/stores/joinRequests"
  import { sendCommand } from "$lib/ws"

  let currentRequest = $derived($joinRequestStore[0] ?? null)

  function accept() {
    if (!currentRequest) return
    sendCommand({ type: "respondJoinRequest", requestId: currentRequest.requestId, response: "accept" })
  }

  function decline() {
    if (!currentRequest) return
    sendCommand({ type: "respondJoinRequest", requestId: currentRequest.requestId, response: "decline" })
  }

  function formatCareer(career: string): string {
    return career.replace(/_/g, " ")
  }
</script>

{#if currentRequest}
  <div class="overlay" role="dialog" aria-modal="true">
    <div class="modal">
      <div class="modal-header">
        <span class="header-label">Camp Request</span>
        <span class="header-name">{currentRequest.npcName}</span>
      </div>
      <div class="modal-body">
        <div class="career">{formatCareer(currentRequest.npcCareer)}</div>
        <p class="origin-summary">{currentRequest.originSummary}</p>
      </div>
      <div class="modal-actions">
        <button class="btn btn-decline" onclick={decline}>Decline</button>
        <button class="btn btn-accept" onclick={accept}>Accept</button>
      </div>
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
    z-index: 200;
  }

  .modal {
    background: #120c04;
    border: 1px solid #5a4020;
    max-width: 420px;
    width: 90vw;
  }

  .modal-header {
    border-bottom: 1px solid #2a1e0e;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 1rem 1.25rem;
  }

  .header-label {
    color: #8a7060;
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .header-name {
    color: #d4b896;
    font-size: 1.1rem;
    letter-spacing: 0.04em;
  }

  .modal-body {
    padding: 1rem 1.25rem;
  }

  .career {
    color: #8a7060;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    margin-bottom: 0.75rem;
    text-transform: uppercase;
  }

  .origin-summary {
    color: #a89070;
    font-size: 0.8rem;
    line-height: 1.5;
    margin: 0;
  }

  .modal-actions {
    border-top: 1px solid #2a1e0e;
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    padding: 1rem 1.25rem;
  }

  .btn {
    border: 1px solid #5a4020;
    cursor: pointer;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    padding: 0.5rem 1.25rem;
    text-transform: uppercase;
    transition: border-color 0.15s, background 0.15s;
  }

  .btn-decline {
    background: transparent;
    color: #8a7060;
  }

  .btn-decline:hover {
    border-color: #8a7060;
    color: #d4b896;
  }

  .btn-accept {
    background: #2a1e0e;
    color: #d4b896;
  }

  .btn-accept:hover {
    background: #3a2e1e;
    border-color: #d4b896;
  }
</style>
