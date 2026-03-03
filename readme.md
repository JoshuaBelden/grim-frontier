# Grim Frontier — Design Overview

## Concepts

A persistent, async western world simulation where new players are dropped onto the map in a basic camp with almost nothing. They must craft, survive, and influence the world around them.

### The Signature Mechanic: Drifters

NPCs move between camps, towns, and wilderness based on their own needs. Your camp is a place they might stay — if you make it worth staying.

**Why it's different:** Instead of shopping a roster, you're building a place that the right people want to come to. The world's NPC pool is shared and finite — one player attracting skilled NPCs means other camps feel the scarcity.

**The storytelling payoff:** NPCs carry their history with them. An NPC who had a fight at another player's camp arrives at yours with that baggage. Your friend picks up one of your departed NPCs and messages you: _"good luck with her."_ Nobody wrote that story — it emerged from the parameters.

### Core Philosophy

- **You are a drifter in a western civilization.** Players make decisions, befriend NPCs, set actions. The world acts it out. Loyal NPCs start to share the experience.
- **Async by design.** A tick-based simulation runs continuously. You log in to see what happened and make your next moves.
- **Emergent storytelling.** No scripted narratives. Stories emerge from NPC behavior, player decisions, and world events.
- **Risk/reward spiral.** The more you build, the more visible and vulnerable you become.
- **Never zeroed out.** Offline players have protection modifiers. You can be hurt, never destroyed.

### Multiplayer Dynamics

- Other players' camps are visible on the territory map
- Compete for the same NPC talent pool, trade routes, and economy
- Alliance: overlapping patrols, shared trade, joint city-building
- Conflict: territory pressure, wagon raids, NPC poaching
- Reputation spreads through the NPC network — your behavior follows you
- Player-vs-player raids require cause or cost
- Shared cities emerge organically — nobody owns them, everyone contributes

## Core Systems

### Characters

Player's characters are not the heart of the game, Player character interactions with the NPCs of the world are. NPCs are not your units — they have their own lives and move through the world based on their needs and the state of things. Players will join the world after configuring their character, NPCs will be AI generated and controlled.

#### Characteristics

Characteristics are innate physical/biological facts. They are physical attributes of the character that cannot be improved or degraded on their own. While there will be items that improve or degrade a characteristic slightly, these define the near ceiling of the attribute.

- **Strength**: Raw physical power
- **Hand**: Steady precision and coordination
- **Presence**: Leadership and social gravity — how people respond to who you are
- **Wit**: Cunning and intelligence — how well you think and scheme
- **Temper**: Emotional intensity — the fire in a person
- **Grit**: Durability — how much you absorb and keep going
- **Nerve**: Composure — how well you perform when it counts
- **Luck**: Fortune

Characteristics are represented as a value from 1 to 10 where the higher the value the better.

#### Nature

These are all bipolar axes that describe how a person is oriented — their values and their worldview.

**Disposition** — the moral and emotional grain of a person:

- Greed / Generosity
- Cruelty / Mercy
- Courage / Caution
- Ambition / Contentment
- Honesty / Deception

**Outlook** — how characters interpret the world and respond:

- Cynical / Idealistic
- Fatalist / Willful
- Suspicious / Trusting
- Pride / Humility

Nature attributes are represented as a value from -5 to 5

#### Traits

Persistent tendencies that modify how skills are expressed

**Combat**

- **Dead Eye** — total calm when aiming or drawing first | slow to react to sudden ambush
- **Hair Trigger** — reacts before thinking; excellent surprise response | worse at controlled precision
- **Brawler** — dominant in close, dirty fighting and grappling | falls off at range or structured combat
- **Hard to Kill** — absorbs punishment others couldn't survive | doesn't know when to quit
- **Ruthless** — no hesitation at decisive moments | unsettles potential allies, hardens enemies' resolve

**Social**

- **Silver Tongue** — disarms the willing through charm and words | falls flat against hostile or cynical targets
- **Hard Stare** — intimidates through stillness and silence, slow burn | useless where warmth or speed is needed
- **Poker Face** — masks intent and emotion; hard to read | weaker at inspiring or rallying others
- **Man of His Word** — known for keeping promises; creates negotiating leverage | bound by his word even when it costs him
- **Read People** — quick sense of others' angles and moods | acts on reads that are sometimes wrong

**Craft & Trade**

- **Steady Hands** — precision work holds up under pressure | slow; doesn't perform on pure speed
- **Horse Whisperer** — unusual rapport with animals | extends trust to animals over people, sometimes misplaced
- **Tinkerer** — mechanical intuition; improvised fixes and repairs | overcomplicates things that should be simple
- **Merchant's Eye** — reads value and angles in trade naturally | sees everything as transactional; people sense it

**Survival & Wilderness**

- **Hard Living** — body adapted to deprivation and rough conditions | underprepared for comfort and civilization
- **Tracker** — reads terrain, sign, and movement naturally | absorbed by the hunt; can miss the bigger picture
- **Last Man Standing** — performs better the more depleted he is | has to be desperate to perform at peak
- **Field Medic** — keeps people alive with what's at hand | not a doctor; improvised care has limits

**Mind & Instinct**

- **Cool Head** — doesn't rattle; performs under pressure that breaks others | reads as cold; hard to trust emotionally
- **Gut Feeling** — acts on instinct with better-than-expected results | trusts instinct over evidence even when evidence is right
- **Paranoid** — hard to approach or manipulate; always scanning | can't extend trust even when it's warranted
- **Grudge Holder** — driven and effective against enemies with history | consumed by unresolved ones; hard to let go

**Background**

- **Outlaw's Eye** — reads law, pursuit, and trouble before it arrives | always scanning exits; stands out when he'd rather not
- **Frontier Born** — efficient with resources; at home in wilderness | underprepared for towns, politics, and civilization
- **Campaigner** — disciplined in group tactics; boosts coordinated actions | needs a chain of command; struggles with ambiguity
- **Gambler's Blood** — Luck runs hotter in committed bets | can't walk away when caution is the smarter call

#### Skills

Learned, practiced, and improvable.

**Combat**

- **Shooting** [Hand] — firearms accuracy and handling in all conditions
- **Brawling** [Strength] — unarmed combat, wrestling, melee
- **Quick Draw** [Nerve] — the duel and first-draw specifically; composure is what decides it more than precision

**Horsemanship & Animals**

- **Ride** [Hand] — controlling horses in all conditions, mounted work
- **Animal Handling** [Wit] — livestock care, training, working animals broadly

**Wilderness**

- \*Track\*\* [Wit] — reading sign, following quarry, finding passage
- **Navigate** [Wit] — terrain, routes, orientation, not getting lost
- **Survive** [Grit] — water, shelter, food, enduring exposure
- **Scout** [Wit] — reconnaissance, reading a location before entering, threat detection
- **Stealth** [Hand] — moving through without being seen or heard

**Social**

- **Persuade** [Presence / Temper] — swaying through appeal, charm, or passion; Characteristic used depends on approach
- **Intimidate** [Presence / Temper] — dominating through authority or aggression; same split
- **Deceive** [Wit + Nerve] — lying, misdirection, false impressions; Wit plans it, Nerve holds it
- **Command** [Presence] — directing groups, maintaining order, organizational authority
- **Negotiate** [Wit] — formal dealmaking, contracts, trade terms, alliances

**Craft**

- **Build** [Strength + Wit] — structures, camp construction, carpentry
- **Forge** [Hand] — metalwork, smithing, repair of metal equipment
- **Leatherwork** [Hand] — saddles, holsters, gear
- **Tinker** [Wit + Hand] — mechanical repair, improvised solutions, gunsmithing adjacent; also covers lockpicking
- **Doctor** [Hand + Wit] — surgery, medicine, wound treatment, disease; Hand for the work, Wit for the knowledge

**Trade & Economy**

- **Appraise** [Wit] — evaluating goods, spotting value and deception
- **Trade** [Wit + Presence] — executing transactions, reading the market
- **Gamble** [Wit + Nerve + Luck] — three Characteristics contribute: strategy, composure, and fortune

**Information**

- **Investigate** [Wit] — piecing together evidence, reading scenes and patterns
- **Streetwise** [Wit + Presence] — local knowledge, who to ask, where things happen
- **Gather** [Wit] — extracting information from people or places, covertly or through relationship

#### Careers

Careers define mechanical purpose in unlocking exclusive traits, here's one exclusive trait per career.

- **Scout** — Ghost Trail: moves through territory without leaving readable sign; difficult to track
- **Trapper** — Set and Wait: exceptional patience under stillness; can hold a position or wait out a situation without degrading
- **Prospector** — Diviner: uncanny sense for what's hidden or underground; better at finding concealed caches, veins, and water
- **Lawman** — The Badge: community-backed authority that produces automatic compliance in most people; degrades if honor is publicly compromised
- **Bounty Hunter** — Never Lost a Trail: exceptional persistence in pursuit; doesn't abandon targets that others would
- **Detective** — Piece It Together: constructs a picture from fragments; reads crime scenes, patterns, and inconsistencies others miss
- **Gunfighter** — The Name: their fighting reputation makes others hesitate or freeze; can degrade through public defeat
- **Rustler** — Drive the Herd: can move large groups of animals quickly and quietly under pressure
- **Smuggler** — The Route: knows hidden paths, timing windows, and cache points; better at moving anything unseen
- **Soldier** — Formation: bonus in coordinated group actions — patrol efficiency, group combat, organized defense
- **Deserter** — Go to Ground: can disappear and stay lost when being hunted; exceptional evasion
- **Cowboy** — Rope Work: can lasso targets, animals, and objects with precision under pressure
- **Wrangler** — Horse Sense: can evaluate, break, and manage any horse; mounts don't spook around them
- **Rancher** — Land Read: deep knowledge of territory, water, and grazing; better at managing resources across a large area
- **Homesteader** — Make Do: can build and repair with minimal materials; improvisation under scarcity
- **Blacksmith** — The Iron Work: can craft, modify, and repair metal tools and weapons at a level others can't reach
- **Gunsmith** — Read the Gun: can evaluate, modify, and clear any firearm; weapons they maintain don't fail
- **Leatherworker** — Fitted Work: gear they make or maintain gives the wearer a persistent minor edge
- **Carpenter** — Load-Bearing: understands structural integrity; builds, assesses, and sabotages structures with precision
- **Butcher** — Efficient Cut: anatomical knowledge that applies to wounds as well as livestock; better at targeting
- **Barber** — The Chair: people talk; has passive access to community gossip and local intelligence others have to work for
- **Dentist** — Work Through It: can function while causing or experiencing significant pain; useful in interrogation and field surgery
- **Doctor** — Stabilize: can pull someone back from the edge others would lose; not guaranteed, but possible when no one else could
- **Merchant** — The Angle: always sees what someone needs before they say it; reads opportunity in a room
- **Trader** — Regional Read: knows what's scarce where; better prices, better route decisions, better sense of what's coming
- **Saloon Keeper** — The Room: reads a crowd's mood and tension; can manage or escalate social situations in public spaces
- **Gambler** — Tell Reader: exceptional at identifying involuntary signals — hesitation, deception, the tell
- **Banker** — The Ledger: remembers every arrangement; has leverage over those who owe and knows who else does
- **Lawyer** — The Argument: can build a case that shifts opinion in disputes, negotiations, and public confrontations
- **Preacher** — The Word: speaks with moral authority that can shame, inspire, or absolve; loses power if their conduct is compromised
- **Teacher** — The Method: can accelerate another character's skill development beyond what experience alone would produce
- **Journalist** — On Record: what they publish becomes part of the world's reputation layer; can amplify or damage notoriety in ways others can't

#### Origin

Origin is the full off-screen history — everything that made this person before the game clock started.

##### Background

The circumstances a character came from before their Career. For players, this is partially written, partially structured. For NPCs, it's generated.

What it contains:

**Where they're from** — frontier, small town, city, foreign, itinerant (born on the move)
**Family situation** — settled family, notable family, broken family, orphan, outcast
**Formative event** — the thing that shaped them most before their career began

What it does mechanically: Background sets the starting position of 2-3 Nature axes before Career adjusts them further. A character who grew up poor on the frontier starts with different Greed/Generosity and Cynical/Idealistic values than one from a merchant family in a city. Career then nudges a few more. The player gets to see and accept (or adjust within limits) these starting positions.

##### Scars

Scars are the marks life has left — physical, personal, and reputational. Not just wounds. A lost family, a betrayal, an unpaid debt, a thing that can't be let go. Characters start with 1-3.

**Physical** — a wound that healed wrong; modifies specific Grit, Hand, or Strength checks depending on location and nature; tells a visible story
**Loss** — someone or something gone; affects Nerve or Temper in specific triggering contexts; the absence is still present
**Debt** — financial, moral, or relational; creates ongoing pressure and a named party; the creditor may appear in the world
**Reputation mark** — something that happened that follows them; affects how strangers receive them before anything is said
**Obsession** — a thing they can't release; compulsion, haunting, or vendetta; pushes behavior in specific directions under pressure

Mechanically, scars work as conditional modifiers — they only apply when the triggering condition is present. A physical scar on the shooting hand doesn't affect Brawling. A loss scar tied to a dead partner surfaces when similar situations arise.

For NPCs, scars are hidden until enough trust is built to see them — they're part of the fog of war on character nature.

##### Pursuits

What drives the character forward. Three layers:

**Secrets** — what they're hiding and from whom. Players define their own. NPC secrets are generated and hidden behind the trust threshold. A secret can be a past crime, a false identity, a relationship, a loyalty to something that conflicts with their current situation. When an NPC's secret is revealed, it changes how the player understands everything about their history.

**Short-term** — what they want to accomplish soon. For players, self-set and updatable. For NPCs, generated and drives the Drift — an NPC with a short-term goal to find work with a skilled gunhand is more likely to drift toward a camp that has one. Short-term pursuits resolve, and new ones form.

**Long-term** — the deep drive. The thing the character ultimately wants out of life. For players, this is their north star. For NPCs, it's the ambition that shapes their entire arc — a character with a long-term pursuit of building something real behaves differently than one who wants revenge, or freedom, or just enough money to disappear. Long-term pursuits don't resolve easily; they define the character's trajectory across the whole game.

Background sets starting Nature values. Scars add conditional modifiers and story hooks. Career unlocks the exclusive trait and elevates starting skills. Pursuits drive ongoing behavior — for NPCs through the Drift, for players through self-directed play.

The full Origin is what makes a character feel like they existed before you met them. An NPC who drifts into your camp carries all of this — you can see the Career, get hints of the Background, observe the Scars over time, and only learn the Secrets when you've earned that level of trust.

### Morals, Loyalty, and Relationships

Two independent axes, not a single good/evil slider:

|                   | High Honor             | Low Honor       |
| ----------------- | ---------------------- | --------------- |
| **High Ruthless** | The Hard but Fair Boss | The Outlaw King |
| **Low Ruthless**  | The Quiet Rancher      | The Drifter     |

Each combination attracts different NPCs, events, and opportunities. The game never tells you which is right.

#### Relationships

Relationship is the emotional state between two characters — how warmly or hostilely one regards the other. All relationships begin at **Neutral** and move over time based on behavior, shared experience, and camp conditions.

| Tier             | Range | What it means                                                                                                         |
| ---------------- | ----- | --------------------------------------------------------------------------------------------------------------------- |
| **Hostile**      | -3    | Actively working against you — spreading word, undermining the camp, looking for a way out or a way to hurt you       |
| **Enemy**        | -2    | No goodwill; will not cooperate; conflict with them poisons the camp's social atmosphere                              |
| **Unfriendly**   | -1    | Cold, performative at best; effectiveness drops; drift toward leaving                                                 |
| **Neutral**      | 0     | Default. Observing. No investment yet in either direction                                                             |
| **Acquaintance** | 1     | Comfortable; stays around; extends basic trust; does the job without friction                                         |
| **Friend**       | 2     | Shares more; works harder; will speak up for you; defends you in your absence                                         |
| **Inner Circle** | 3     | Deep trust; knows your situation; will take personal risk on your behalf; the hardest to earn and the hardest to lose |

**What moves a relationship upward:**

- Consistent behavior that aligns with the NPC's Nature values (a generous act lands differently with a Generous NPC than a Greedy one)
- Honoring commitments — especially ones that cost you something visible
- Shared hardship: surviving danger together, weathering a loss, being present in a bad moment
- Revealing something true about yourself — vulnerability builds faster than performance
- Camp stability and a clear direction that matches what they're looking for

**What moves a relationship downward:**

- Breaking a promise, especially a public one
- Behavior that conflicts with their core Disposition or Outlook (deceiving an Honest NPC; showing mercy to someone a Ruthless NPC would finish)
- Letting harm come to people they care about
- Being cold or absent during events that mattered
- Camp decline — instability erodes confidence before it erodes warmth

Relationships move slowly. A single act doesn't transform a stranger into a friend. The accumulation is what counts.

#### Loyalty

Loyalty is separate from relationship. It measures behavioral commitment — how much an NPC will stay and act in your interest when tested. A warm relationship without loyalty means they like you but will leave for a better situation. Loyalty without warmth means they feel bound by something even as the feeling has cooled.

| Tier              | What it means                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------- |
| **Transactional** | Here for the work. Will leave if a better offer appears or conditions worsen             |
| **Invested**      | Believes in what you're building. Harder to poach; won't leave over minor friction       |
| **Bound**         | Deep commitment. Won't leave even when it's costly. Influence and obligation intertwined |

Loyalty generally trails relationship — an NPC won't become Bound until they've spent time as a Friend or Inner Circle. But it can persist after a relationship cools. An NPC who was Inner Circle and now feels Unfriendly might still stay because of what you built together — until something breaks it.

**What builds loyalty:**

- Duration at a high relationship tier — time at Friend or Inner Circle deposits into loyalty slowly
- Kept promises that had real cost to keep
- Being known — when their Scars have been seen and you didn't use them against them
- Camp direction that aligns with their long-term pursuit: the NPC who wants to build something real becomes loyal to a camp that's actually building
- Standing by people they care about

**What erodes loyalty:**

- Breaking trust at a moment that mattered
- Camp decline with no sign of recovery
- Another character (NPC or player) actively working against their connection to you — and succeeding
- A long-term pursuit they can no longer pursue while staying

#### The Hidden Social Graph

NPCs have relationships with each other that players can't see directly. Two NPCs who arrive separately may have shared history — a past rivalry, a debt, a friendship from before. This graph is the fog behind the camp's surface.

Effects surface through behavior: two NPCs who won't work a shift together, one speaking up for another unprompted, friction that has no visible cause. Players can observe without understanding, understand without controlling.

These hidden relationships can be learned — slowly, through trust. An Inner Circle NPC will eventually share what they know about the people around them. An NPC's Secrets often live inside these hidden connections.

The graph also creates vulnerability. An NPC loyal to you may have a competing loyalty you don't know about. If another player or faction activates that loyalty, you find out when it matters most.

#### How Relationship and Loyalty Interact

An NPC stays when both are present. Relationship determines whether they _want_ to. Loyalty determines whether they _do_ when tested.

| Relationship | Loyalty | What happens                                                                                |
| ------------ | ------- | ------------------------------------------------------------------------------------------- |
| High         | High    | Inner circle. Stays through hard times. Will not be poached easily.                         |
| High         | Low     | Fair-weather. Moves on when something better appears. Doesn't hold against you — just goes. |
| Low          | High    | Bound but cold. Obligation without warmth. Volatile if the binding is ever broken.          |
| Low          | Low     | Already leaving. The question is whether they take something with them when they go.        |

### Camp Management

TBD, but with some initial ideas:

- Build and upgrade structures that unlock new capabilities
- Set camp posture: open, closed, aggressive, defensive
- Camp visually evolves from bedroll to full settlement
- Stability determines how well camp functions offline
  | Parameter | Effect |
  | ---------- | -------------------------------------------------- |
  | Reputation | NPC quality attracted, trade terms, raid frequency |
  | Wealth | Visible to others — opportunity and threat |
  | Stability | Offline performance, NPC morale |
  | Territory | Patrol radius, resource access, political weight |
  | Notoriety | Fame/fear — separate from reputation |

### Conflict

TBD

### Economy

TBD, but with some initial ideas:

- Regional supply and demand visible as signal levels (not spreadsheets)
- Each region has a resource profile — what it produces and what it lacks
- Prices shift based on what players are actually doing
- NPC factions (railroads, cattle barons) act as economic weather systems
- Player-to-player trade agreements enforced by the reputation system

### Territory

- World is a graph of nodes (towns, settlements, camps) and edges (roads, trails, passes)
- Geography funnels movement — chokepoints have real political value
- Static topology stored in a world JSON file
- Live state (control, danger, player-built routes) stored in the database

## Style and Asthetics

Letterpress / Woodblock Print — the technique behind western wanted posters, broadside bills, and saloon signage. Heavy ink, imperfect registration, worn edges, slab-serif type. 

Frontier Cartography — hand-illustrated survey maps, parchment, hatch-shaded terrain, hand-lettered place names.

Dime Novel Illustration — 1870s-1900s pulp fiction covers. Black line art with limited color wash, dramatic scenes, high contrast.

Dark Americana / Frontier Gothic — the overall mood, not a specific technique. Aged leather, stamped metal, paper with burn-through.

Frontier gothic letterpress — parchment and aged leather as base materials, woodcut-style illustration for figures and landmarks, selective color (muted earth tones, one warm accent like ember-orange or blood-red), heavy vignette.

Map Example: https://chartogne-taillet.com/en


## Tech Stack

### Frontend

| Tech           | Role                                               |
| -------------- | -------------------------------------------------- |
| **SvelteKit**  | UI framework — reactivity maps to live world state |
| **Three.js**   | 3D world rendering, added after text UI is solid   |
| **WebSockets** | Live world state pushed to client                  |

### Backend

| Tech                        | Role                                                        |
| --------------------------- | ----------------------------------------------------------- |
| **Node.js**                 | Gateway server, WebSocket routing, auth                     |
| **Redis pub/sub**           | Event bus — tick system, plugin events, cross-service comms |
| **Multiple tick processes** | Each module runs its own interval independently             |
| **Claude API**              | NPC generation — characteristics, backstory, persona        |

### Database

| Tech           | Role                                                                        |
| -------------- | --------------------------------------------------------------------------- |
| **MongoDB**    | All persistent state — players, NPCs, camps, economy, territory, event logs |
| **Redis**      | Session tokens, hot-path cache (world clock, active NPC positions)          |
| **world.json** | Static map topology — in git, never in the database                         |

MongoDB is the single source of truth for game state. Redis is ephemeral — anything in Redis can be rebuilt from Mongo on restart. Cross-document relationships use ObjectId references rather than embedding to keep documents manageable.

### Project Structure

Monorepo with a single `docker-compose.yml` at the root. One command starts the full stack.

```
grim-frontier/
  docker-compose.yml
  packages/
    backend/          # Node.js — API, WebSocket gateway, tick engine
      src/
        routes/       # HTTP endpoints
        services/     # WorldService, NPCService, CampService, etc.
        models/       # Mongoose schemas
        tick/         # Tick processes — clock, NPC drift, task resolution
        websocket/    # WebSocket gateway
    frontend/         # SvelteKit
      src/
        routes/       # Page components
        lib/          # Shared stores, API client, WebSocket client
    shared/           # TypeScript types shared between packages
```

### Docker

```yaml
# docker-compose.yml
services:
  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine

  backend:
    build: ./packages/backend
    depends_on: [mongo, redis]
    environment:
      - MONGO_URL=mongodb://mongo:27017/grim-frontier
      - REDIS_URL=redis://redis:6379
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}

  frontend:
    build: ./packages/frontend
    depends_on: [backend]
    ports:
      - "5173:5173"

volumes:
  mongo_data:
```

`CLAUDE_API_KEY` is the only secret that needs to be set in a local `.env` file. Everything else is internal to the Docker network.

### Plugin Architecture

New systems are independent processes that subscribe to existing events and publish new ones. The core never changes. A weather plugin just listens and publishes — nothing else needs to know it exists.

---

## Implementation Plan — MVP

Each phase has a clear deliverable before moving on. Nothing in a later phase should be started until the prior phase is working end-to-end.

### Phase 1 — Foundation

**Deliverable:** `docker-compose up` starts all services, backend connects to Mongo and Redis, shared types are defined.

- [ ] Monorepo scaffolding — root `package.json`, `packages/backend`, `packages/frontend`, `packages/shared`
- [ ] TypeScript config across all packages, shared types importable from backend and frontend
- [ ] `docker-compose.yml` with Mongo, Redis, backend, frontend services
- [ ] Backend connects to Mongo (Mongoose) and Redis on startup with health check
- [ ] All MVP Mongoose schemas defined: `World`, `Region`, `Territory`, `Town`, `Camp`, `Player`, `NPC`, `GameClock`, `Task`, `Encounter`
- [ ] `.env.example` with `CLAUDE_API_KEY` documented

### Phase 2 — Auth & World Creation

**Deliverable:** An admin can create a world via API. A player can register, log in, and join that world. No UI yet — curl or a REST client is enough.

- [ ] `POST /auth/register` — creates player, hashes password, returns JWT
- [ ] `POST /auth/login` — validates credentials, returns JWT
- [ ] JWT middleware + Redis session storage
- [ ] `POST /admin/worlds` — creates a World and seeds it with one Region, Territory, Town, and a blank Camp for the joining player using `world.json` for static topology
- [ ] `POST /worlds/:id/join` — assigns player to world, creates their Camp document

### Phase 3 — Map API & Game Clock

**Deliverable:** The world advances in time. A player can query the map hierarchy. All state is readable via API.

- [ ] `GET /worlds/:id/map` — returns Region → Territory with nested Town and Camp refs
- [ ] `GET /towns/:id` — town detail with current encounters list
- [ ] `GET /camps/:id` — camp detail with resources, NPC roster, active tasks
- [ ] `GameClock` tick process — advances in-world date and time on an interval, writes to Mongo, publishes tick event to Redis pub/sub
- [ ] WebSocket gateway — client connects, receives clock updates on each tick

### Phase 4 — Frontend Shell

**Deliverable:** A player can log in, see their territory on a map, see the clock ticking, and drill into the town or camp. No interactions yet — views are read-only.

- [ ] SvelteKit auth flow — register, login, redirect to world view
- [ ] API client and WebSocket client set up in `packages/frontend/src/lib`
- [ ] Territory view — shows town and player's camp as clickable nodes
- [ ] Town view — placeholder, shows town name and location
- [ ] Camp view — shows resource counts and empty NPC roster
- [ ] Running in-world clock in the page header, updated via WebSocket

### Phase 5 — NPC Generation & Encounters

**Deliverable:** NPCs appear in the town as encounters. A player can view an NPC, track them, and invite them to camp.

- [ ] `NPCService.generate()` — calls Claude API with world context, creates a structured NPC document (characteristics, nature, one trait, career, short backstory)
- [ ] Encounter spawn tick — periodically creates an Encounter in the Territory's town if below NPC threshold
- [ ] Town view updated — displays active encounters with NPC name and visible career
- [ ] Encounter detail view — shows NPC characteristics and backstory
- [ ] `POST /encounters/:id/track` — player marks NPC as tracked
- [ ] `POST /encounters/:id/invite` — moves NPC to player's camp, removes Encounter
- [ ] Camp view updated — NPC roster shows invited NPCs

### Phase 6 — Camp Mechanics

**Deliverable:** A player can collect resources at camp and assign a camp NPC to a chore. The tick system resolves tasks over time.

- [ ] `POST /camps/:id/collect` — player action that adds food/supplies to camp resources
- [ ] `POST /npcs/:id/tasks` — assigns a Task document to an NPC (chore type, duration)
- [ ] Task resolution tick — on each tick, checks active tasks, resolves completed ones, updates camp resources and NPC state
- [ ] Camp view updated — shows resource collection button, NPC task assignment UI, active task progress
