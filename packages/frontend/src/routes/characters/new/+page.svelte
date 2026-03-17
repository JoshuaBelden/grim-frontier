<script lang="ts">
  import { goto } from "$app/navigation"
  import { apiCreateCharacter, type CharacterCreationPayload } from "$lib/api"
  import { authStore } from "$lib/stores/auth"
  import { onMount } from "svelte"

  onMount(() => {
    if (!$authStore.token) goto("/login")
  })

  // ── constants ────────────────────────────────────────────────────────────────

  const CAREERS = [
    "scout", "trapper", "prospector", "lawman", "bounty_hunter", "detective",
    "gunfighter", "rustler", "smuggler", "soldier", "deserter", "cowboy",
    "wrangler", "rancher", "homesteader", "blacksmith", "gunsmith", "leatherworker",
    "carpenter", "butcher", "barber", "dentist", "doctor", "merchant", "trader",
    "saloon_keeper", "gambler", "banker", "lawyer", "preacher", "teacher", "journalist",
  ]

  const ORIGIN_TYPES = ["frontier", "small_town", "city", "foreign"]
  const FAMILY_SITUATIONS = ["settled", "notable", "broken", "orphan", "outcast"]
  const SCAR_TYPES = ["physical", "loss", "debt", "reputation_mark", "obsession"]

  const TRAIT_GROUPS = [
    { label: "Combat", traits: ["dead_eye", "hair_trigger", "brawler", "hard_to_kill", "ruthless"] },
    { label: "Social", traits: ["silver_tongue", "hard_stare", "poker_face", "man_of_his_word", "read_people"] },
    { label: "Craft", traits: ["steady_hands", "horse_whisperer", "tinkerer", "merchants_eye"] },
    { label: "Survival", traits: ["hard_living", "tracker", "last_man_standing", "field_medic"] },
    { label: "Mind", traits: ["cool_head", "gut_feeling", "paranoid", "grudge_holder"] },
    { label: "Background", traits: ["outlaws_eye", "frontier_born", "campaigner", "gamblers_blood"] },
  ]

  const SKILL_GROUPS = [
    { label: "Combat", skills: ["shooting", "brawling", "quick_draw"] },
    { label: "Horsemanship", skills: ["ride", "animal_handling"] },
    { label: "Wilderness", skills: ["track", "navigate", "survive", "scout", "stealth"] },
    { label: "Social", skills: ["persuade", "intimidate", "deceive", "command", "negotiate"] },
    { label: "Craft", skills: ["build", "forge", "leatherwork", "tinker", "doctor"] },
    { label: "Trade", skills: ["appraise", "trade", "gamble"] },
    { label: "Information", skills: ["investigate", "streetwise", "gather"] },
  ]

  const CHAR_BUDGET = 35

  // ── form state ───────────────────────────────────────────────────────────────

  let name = $state("")
  let age = $state(30)
  let career = $state("cowboy")
  let portraitDescription = $state("")

  let characteristics = $state({
    strength: 4,
    hand: 4,
    presence: 4,
    wit: 4,
    temper: 4,
    grit: 4,
    nerve: 4,
    luck: 4,
  })

  let disposition = $state({
    generosity: 0,
    mercy: 0,
    courage: 0,
    contentment: 0,
    honesty: 0,
  })

  let outlook = $state({
    idealism: 0,
    willfulness: 0,
    trust: 0,
    humility: 0,
  })

  let originType = $state("frontier")
  let family = $state("settled")
  let formativeEvent = $state("")

  let hasScar = $state(false)
  let scarType = $state("physical")
  let scarDescription = $state("")
  let scarTrigger = $state("")

  let selectedTraits = $state<string[]>([])
  let selectedSkills = $state<string[]>([])

  let saving = $state(false)
  let saveError = $state<string | null>(null)
  let showConfirm = $state(false)

  // ── derived ──────────────────────────────────────────────────────────────────

  const charSum = $derived(Object.values(characteristics).reduce((sum, value) => sum + value, 0))
  const charRemaining = $derived(CHAR_BUDGET - charSum)

  const canSave = $derived(
    name.trim().length > 0 &&
    age >= 21 && age <= 77 &&
    charSum <= CHAR_BUDGET &&
    selectedTraits.length === 2 &&
    selectedSkills.length === 3
  )

  // ── helpers ──────────────────────────────────────────────────────────────────

  function formatLabel(value: string): string {
    return value.replace(/_/g, " ")
  }

  function toggleTrait(trait: string) {
    if (selectedTraits.includes(trait)) {
      selectedTraits = selectedTraits.filter(selected => selected !== trait)
    } else if (selectedTraits.length < 2) {
      selectedTraits = [...selectedTraits, trait]
    }
  }

  function toggleSkill(skill: string) {
    if (selectedSkills.includes(skill)) {
      selectedSkills = selectedSkills.filter(selected => selected !== skill)
    } else if (selectedSkills.length < 3) {
      selectedSkills = [...selectedSkills, skill]
    }
  }

  // ── randomize ────────────────────────────────────────────────────────────────

  function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  function randomPick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  function randomPickN<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
  }

  function randomizeCharacteristics() {
    // Distribute CHAR_BUDGET points across 8 stats (1-10 each)
    const keys = Object.keys(characteristics) as (keyof typeof characteristics)[]
    const newChars = { strength: 1, hand: 1, presence: 1, wit: 1, temper: 1, grit: 1, nerve: 1, luck: 1 }
    let remaining = CHAR_BUDGET - 8
    for (let iteration = 0; iteration < remaining; iteration++) {
      const key = randomPick(keys)
      if (newChars[key] < 10) {
        newChars[key]++
      }
    }
    characteristics = newChars
  }

  function randomize() {
    name = name // don't randomize name — player always sets this
    age = randomInt(21, 77)
    career = randomPick(CAREERS)
    randomizeCharacteristics()

    disposition = {
      generosity: randomInt(-5, 5),
      mercy: randomInt(-5, 5),
      courage: randomInt(-5, 5),
      contentment: randomInt(-5, 5),
      honesty: randomInt(-5, 5),
    }
    outlook = {
      idealism: randomInt(-5, 5),
      willfulness: randomInt(-5, 5),
      trust: randomInt(-5, 5),
      humility: randomInt(-5, 5),
    }

    originType = randomPick(ORIGIN_TYPES)
    family = randomPick(FAMILY_SITUATIONS)

    const allTraits = TRAIT_GROUPS.flatMap(group => group.traits)
    selectedTraits = randomPickN(allTraits, 2)

    const allSkills = SKILL_GROUPS.flatMap(group => group.skills)
    selectedSkills = randomPickN(allSkills, 3)
  }

  // ── save ─────────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!canSave) return
    saving = true
    saveError = null
    showConfirm = false

    const payload: CharacterCreationPayload = {
      name: name.trim(),
      age,
      career,
      portraitDescription: portraitDescription.trim() || undefined,
      characteristics,
      nature: { disposition, outlook },
      traits: selectedTraits,
      skills: Object.fromEntries(selectedSkills.map(skill => [skill, 4])),
      origin: {
        background: { origin: originType, family, formativeEvent: formativeEvent.trim() || "Rode west with nothing but a name." },
        scars: hasScar && scarDescription.trim()
          ? [{ type: scarType, description: scarDescription.trim(), triggerCondition: scarTrigger.trim() || undefined }]
          : [],
      },
    }

    try {
      const result = await apiCreateCharacter(payload)
      goto(`/characters/${result.npcId}`)
    } catch (err) {
      saveError = err instanceof Error ? err.message : "Failed to save character"
    } finally {
      saving = false
    }
  }
</script>

<svelte:head>
  <title>Create Character — Grim Frontier</title>
</svelte:head>

<div class="view">
  <div class="page-header">
    <a href="/characters" class="back-link">← Characters</a>
    <h1>Create Character</h1>
    <button class="randomize-btn" onclick={randomize} type="button">Randomize</button>
  </div>

  <div class="form">

    <!-- Identity -->
    <section class="section">
      <h2 class="section-title">Identity</h2>
      <div class="field">
        <label for="name">Name</label>
        <input id="name" type="text" bind:value={name} placeholder="Enter a name" maxlength="40" />
      </div>
      <div class="row">
        <div class="field">
          <label for="age">Age</label>
          <input id="age" type="number" bind:value={age} min="21" max="77" />
        </div>
        <div class="field wide">
          <label for="career">Career</label>
          <select id="career" bind:value={career}>
            {#each CAREERS as careerOption}
              <option value={careerOption}>{formatLabel(careerOption)}</option>
            {/each}
          </select>
        </div>
      </div>
    </section>

    <!-- Portrait -->
    <section class="section">
      <h2 class="section-title">Portrait Description</h2>
      <p class="section-note">One or two sentences describing their appearance. Used to generate an AI portrait.</p>
      <textarea
        bind:value={portraitDescription}
        placeholder="A weathered face framed by a dust-gray beard, eyes narrowed from years of staring into the sun…"
        rows="3"
      ></textarea>
    </section>

    <!-- Characteristics -->
    <section class="section">
      <div class="section-header-row">
        <h2 class="section-title">Characteristics</h2>
        <span class="budget" class:over={charRemaining < 0}>
          {charRemaining >= 0 ? charRemaining : 0} points remaining
        </span>
      </div>
      <div class="char-grid">
        {#each Object.keys(characteristics) as key}
          <div class="char-row">
            <span class="char-label">{formatLabel(key)}</span>
            <input
              type="range"
              min="0"
              max="10"
              value={characteristics[key as keyof typeof characteristics]}
              oninput={e => {
                const attempted = Number((e.target as HTMLInputElement).value)
                const capped = Math.min(attempted, characteristics[key as keyof typeof characteristics] + charRemaining)
                characteristics[key as keyof typeof characteristics] = capped
                ;(e.target as HTMLInputElement).value = String(capped)
              }}
              class="char-slider"
            />
            <span class="char-value">{characteristics[key as keyof typeof characteristics]}</span>
          </div>
        {/each}
      </div>
      <p class="section-note">Total: {charSum} / {CHAR_BUDGET}</p>
    </section>

    <!-- Disposition -->
    <section class="section">
      <h2 class="section-title">Disposition</h2>
      <div class="nature-grid">
        <div class="nature-row">
          <span class="nature-label">Generosity</span>
          <span class="nature-pole neg">Greedy</span>
          <input type="range" min="-5" max="5" value={disposition.generosity} oninput={e => { disposition.generosity = Number((e.target as HTMLInputElement).value) }} class="nature-slider" />
          <span class="nature-pole pos">Generous</span>
          <span class="nature-value">{disposition.generosity > 0 ? `+${disposition.generosity}` : disposition.generosity}</span>
        </div>
        <div class="nature-row">
          <span class="nature-label">Mercy</span>
          <span class="nature-pole neg">Cruel</span>
          <input type="range" min="-5" max="5" value={disposition.mercy} oninput={e => { disposition.mercy = Number((e.target as HTMLInputElement).value) }} class="nature-slider" />
          <span class="nature-pole pos">Merciful</span>
          <span class="nature-value">{disposition.mercy > 0 ? `+${disposition.mercy}` : disposition.mercy}</span>
        </div>
        <div class="nature-row">
          <span class="nature-label">Courage</span>
          <span class="nature-pole neg">Cautious</span>
          <input type="range" min="-5" max="5" value={disposition.courage} oninput={e => { disposition.courage = Number((e.target as HTMLInputElement).value) }} class="nature-slider" />
          <span class="nature-pole pos">Courageous</span>
          <span class="nature-value">{disposition.courage > 0 ? `+${disposition.courage}` : disposition.courage}</span>
        </div>
        <div class="nature-row">
          <span class="nature-label">Contentment</span>
          <span class="nature-pole neg">Ambitious</span>
          <input type="range" min="-5" max="5" value={disposition.contentment} oninput={e => { disposition.contentment = Number((e.target as HTMLInputElement).value) }} class="nature-slider" />
          <span class="nature-pole pos">Content</span>
          <span class="nature-value">{disposition.contentment > 0 ? `+${disposition.contentment}` : disposition.contentment}</span>
        </div>
        <div class="nature-row">
          <span class="nature-label">Honesty</span>
          <span class="nature-pole neg">Deceptive</span>
          <input type="range" min="-5" max="5" value={disposition.honesty} oninput={e => { disposition.honesty = Number((e.target as HTMLInputElement).value) }} class="nature-slider" />
          <span class="nature-pole pos">Honest</span>
          <span class="nature-value">{disposition.honesty > 0 ? `+${disposition.honesty}` : disposition.honesty}</span>
        </div>
      </div>
    </section>

    <!-- Outlook -->
    <section class="section">
      <h2 class="section-title">Outlook</h2>
      <div class="nature-grid">
        <div class="nature-row">
          <span class="nature-label">Idealism</span>
          <span class="nature-pole neg">Cynical</span>
          <input type="range" min="-5" max="5" value={outlook.idealism} oninput={e => { outlook.idealism = Number((e.target as HTMLInputElement).value) }} class="nature-slider" />
          <span class="nature-pole pos">Idealistic</span>
          <span class="nature-value">{outlook.idealism > 0 ? `+${outlook.idealism}` : outlook.idealism}</span>
        </div>
        <div class="nature-row">
          <span class="nature-label">Willfulness</span>
          <span class="nature-pole neg">Fatalistic</span>
          <input type="range" min="-5" max="5" value={outlook.willfulness} oninput={e => { outlook.willfulness = Number((e.target as HTMLInputElement).value) }} class="nature-slider" />
          <span class="nature-pole pos">Willful</span>
          <span class="nature-value">{outlook.willfulness > 0 ? `+${outlook.willfulness}` : outlook.willfulness}</span>
        </div>
        <div class="nature-row">
          <span class="nature-label">Trust</span>
          <span class="nature-pole neg">Suspicious</span>
          <input type="range" min="-5" max="5" value={outlook.trust} oninput={e => { outlook.trust = Number((e.target as HTMLInputElement).value) }} class="nature-slider" />
          <span class="nature-pole pos">Trusting</span>
          <span class="nature-value">{outlook.trust > 0 ? `+${outlook.trust}` : outlook.trust}</span>
        </div>
        <div class="nature-row">
          <span class="nature-label">Humility</span>
          <span class="nature-pole neg">Prideful</span>
          <input type="range" min="-5" max="5" value={outlook.humility} oninput={e => { outlook.humility = Number((e.target as HTMLInputElement).value) }} class="nature-slider" />
          <span class="nature-pole pos">Humble</span>
          <span class="nature-value">{outlook.humility > 0 ? `+${outlook.humility}` : outlook.humility}</span>
        </div>
      </div>
    </section>

    <!-- Origin -->
    <section class="section">
      <h2 class="section-title">Origin</h2>
      <div class="row">
        <div class="field">
          <label for="origin-type">Where from</label>
          <select id="origin-type" bind:value={originType}>
            {#each ORIGIN_TYPES as option}
              <option value={option}>{formatLabel(option)}</option>
            {/each}
          </select>
        </div>
        <div class="field">
          <label for="family">Family</label>
          <select id="family" bind:value={family}>
            {#each FAMILY_SITUATIONS as option}
              <option value={option}>{formatLabel(option)}</option>
            {/each}
          </select>
        </div>
      </div>
      <div class="field">
        <label for="formative-event">Formative event <span class="optional">(optional)</span></label>
        <textarea
          id="formative-event"
          bind:value={formativeEvent}
          placeholder="Left home young, rode west with nothing but a bedroll and a name."
          rows="2"
        ></textarea>
      </div>
    </section>

    <!-- Scar -->
    <section class="section">
      <div class="section-header-row">
        <h2 class="section-title">Scar <span class="optional">(optional)</span></h2>
        <label class="toggle-label">
          <input type="checkbox" bind:checked={hasScar} />
          Add a scar
        </label>
      </div>
      {#if hasScar}
        <div class="row">
          <div class="field">
            <label for="scar-type">Type</label>
            <select id="scar-type" bind:value={scarType}>
              {#each SCAR_TYPES as option}
                <option value={option}>{formatLabel(option)}</option>
              {/each}
            </select>
          </div>
        </div>
        <div class="field">
          <label for="scar-desc">Description</label>
          <textarea id="scar-desc" bind:value={scarDescription} placeholder="Lost two fingers in a sawmill accident…" rows="2"></textarea>
        </div>
        <div class="field">
          <label for="scar-trigger">Trigger condition <span class="optional">(optional)</span></label>
          <input id="scar-trigger" type="text" bind:value={scarTrigger} placeholder="When confronted with fire…" />
        </div>
      {/if}
    </section>

    <!-- Traits -->
    <section class="section">
      <div class="section-header-row">
        <h2 class="section-title">Traits</h2>
        <span class="pick-count">{selectedTraits.length} / 2 selected</span>
      </div>
      {#each TRAIT_GROUPS as group}
        <div class="trait-group">
          <span class="group-label">{group.label}</span>
          <div class="trait-chips">
            {#each group.traits as trait}
              <button
                type="button"
                class="chip"
                class:selected={selectedTraits.includes(trait)}
                class:disabled={!selectedTraits.includes(trait) && selectedTraits.length >= 2}
                onclick={() => toggleTrait(trait)}
              >
                {formatLabel(trait)}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </section>

    <!-- Skills -->
    <section class="section">
      <div class="section-header-row">
        <h2 class="section-title">Starting Skills</h2>
        <span class="pick-count">{selectedSkills.length} / 3 selected</span>
      </div>
      <p class="section-note">Chosen skills start at level 4.</p>
      {#each SKILL_GROUPS as group}
        <div class="trait-group">
          <span class="group-label">{group.label}</span>
          <div class="trait-chips">
            {#each group.skills as skill}
              <button
                type="button"
                class="chip"
                class:selected={selectedSkills.includes(skill)}
                class:disabled={!selectedSkills.includes(skill) && selectedSkills.length >= 3}
                onclick={() => toggleSkill(skill)}
              >
                {formatLabel(skill)}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </section>

    <!-- Save -->
    <section class="section save-section">
      {#if saveError}
        <p class="error">{saveError}</p>
      {/if}
      <button
        type="button"
        class="save-btn"
        disabled={!canSave || saving}
        onclick={() => (showConfirm = true)}
      >
        Save Character
      </button>
    </section>
  </div>
</div>

<!-- Confirm modal -->
{#if showConfirm}
  <div class="modal-backdrop" role="dialog" aria-modal="true">
    <div class="modal">
      <h2 class="modal-title">Save Character?</h2>
      <p class="modal-body">
        Once saved, this character cannot be edited. Their traits, skills, characteristics, and background are permanent.
      </p>
      <div class="modal-actions">
        <button class="save-btn" onclick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Yes, Save"}
        </button>
        <button class="cancel-btn" onclick={() => (showConfirm = false)} disabled={saving}>Cancel</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    max-width: 680px;
  }

  .page-header {
    align-items: baseline;
    display: flex;
    gap: 1rem;
  }

  .back-link {
    color: #5a4020;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    text-decoration: none;
    text-transform: uppercase;
    transition: color 0.15s;
  }

  .back-link:hover {
    color: #c4a882;
  }

  h1 {
    flex: 1;
    font-size: 1.5rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .randomize-btn {
    background: none;
    border: 1px solid #5a4020;
    color: #8a7060;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    padding: 0.3rem 0.7rem;
    text-transform: uppercase;
    transition: border-color 0.15s, color 0.15s;
  }

  .randomize-btn:hover {
    border-color: #c4a882;
    color: #c4a882;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .section {
    border: 1px solid #2a1e0e;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
  }

  .section-header-row {
    align-items: baseline;
    display: flex;
    justify-content: space-between;
  }

  .section-title {
    font-size: 0.8rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #c4a882;
  }

  .section-note {
    color: #5a4020;
    font-size: 0.7rem;
    letter-spacing: 0.06em;
  }

  .optional {
    color: #5a4020;
    font-size: 0.65rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .field.wide {
    flex: 1;
  }

  label {
    color: #8a7060;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  input[type="text"],
  input[type="number"],
  select,
  textarea {
    background: #0e0a04;
    border: 1px solid #2a1e0e;
    color: #c4a882;
    font-family: inherit;
    font-size: 0.85rem;
    padding: 0.4rem 0.6rem;
  }

  input[type="text"]:focus,
  input[type="number"]:focus,
  select:focus,
  textarea:focus {
    border-color: #5a4020;
    outline: none;
  }

  textarea {
    resize: vertical;
  }

  .row {
    display: flex;
    gap: 1rem;
  }

  /* Characteristics */
  .char-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .char-row {
    align-items: center;
    display: flex;
    gap: 0.75rem;
  }

  .char-label {
    color: #8a7060;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    width: 80px;
    flex-shrink: 0;
  }

  .char-slider {
    flex: 1;
    accent-color: #7a5a20;
  }

  .char-value {
    color: #c4a882;
    font-size: 0.8rem;
    text-align: right;
    width: 20px;
  }

  .budget {
    color: #7aaa4a;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .budget.over {
    color: #c0512a;
  }

  /* Nature sliders */
  .nature-grid {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .nature-row {
    align-items: center;
    display: grid;
    gap: 0.5rem;
    grid-template-columns: 90px 80px 1fr 80px 32px;
  }

  .nature-label {
    color: #8a7060;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .nature-pole {
    font-size: 0.6rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .nature-pole.neg {
    color: #5a4020;
    text-align: left;
  }

  .nature-pole.pos {
    color: #5a6a30;
  }

  .nature-slider {
    accent-color: #7a5a20;
  }

  .nature-value {
    color: #c4a882;
    font-size: 0.75rem;
    text-align: center;
  }

  /* Toggle */
  .toggle-label {
    align-items: center;
    color: #8a7060;
    display: flex;
    font-size: 0.65rem;
    gap: 0.4rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* Traits / Skills */
  .trait-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 0.5rem;
  }

  .group-label {
    color: #5a4020;
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .trait-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .chip {
    background: #0e0a04;
    border: 1px solid #2a1e0e;
    color: #8a7060;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    padding: 0.25rem 0.6rem;
    text-transform: uppercase;
    transition: all 0.15s;
  }

  .chip:hover:not(.disabled) {
    border-color: #5a4020;
    color: #c4a882;
  }

  .chip.selected {
    background: #1a1208;
    border-color: #7a5a20;
    color: #c4a882;
  }

  .chip.disabled {
    cursor: default;
    opacity: 0.4;
  }

  .pick-count {
    color: #8a7060;
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* Save */
  .save-section {
    align-items: flex-start;
  }

  .save-btn {
    background: #1a1208;
    border: 1px solid #7a5a20;
    color: #c4a882;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    padding: 0.5rem 1.25rem;
    text-transform: uppercase;
    transition: all 0.15s;
  }

  .save-btn:hover:not(:disabled) {
    border-color: #c4a882;
    color: #e0cba8;
  }

  .save-btn:disabled {
    cursor: default;
    opacity: 0.4;
  }

  .error {
    color: #c0512a;
    font-size: 0.85rem;
  }

  /* Confirm modal */
  .modal-backdrop {
    background: rgba(0, 0, 0, 0.75);
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    left: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 100;
  }

  .modal {
    background: #0e0a04;
    border: 1px solid #5a4020;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 420px;
    padding: 1.5rem;
    width: 90%;
  }

  .modal-title {
    color: #c4a882;
    font-size: 1rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .modal-body {
    color: #8a7060;
    font-size: 0.85rem;
    line-height: 1.5;
  }

  .modal-actions {
    display: flex;
    gap: 0.75rem;
  }

  .cancel-btn {
    background: none;
    border: 1px solid #2a1e0e;
    color: #5a4020;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    padding: 0.4rem 0.9rem;
    text-transform: uppercase;
    transition: all 0.15s;
  }

  .cancel-btn:hover:not(:disabled) {
    border-color: #5a4020;
    color: #8a7060;
  }
</style>
