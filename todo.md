## Implementation Plan — MVP

Each phase has a clear deliverable before moving on. Nothing in a later phase should be started until the prior phase is working end-to-end.

### Phase 1 — Foundation

**Deliverable:** `docker-compose up` starts all services, backend connects to Mongo and Redis, shared types are defined.

- [x] Monorepo scaffolding — root `package.json`, `packages/backend`, `packages/frontend`, `packages/shared`
- [x] TypeScript config across all packages, shared types importable from backend and frontend
- [x] `docker-compose.yml` with Mongo, Redis, backend, frontend services
- [x] Backend connects to Mongo (Mongoose) and Redis on startup with health check
- [x] All MVP Mongoose schemas defined: `World`, `Region`, `Territory`, `Town`, `Camp`, `Player`, `NPC`, `GameClock`, `Task`, `Encounter`
- [x] `.env.example` with `CLAUDE_API_KEY` documented

### Phase 2 — Auth & World Creation

**Deliverable:** An admin can create a world via API. A player can register, log in, and join that world. No UI yet — curl or a REST client is enough.

- [x] `POST /auth/register` — creates player, hashes password, returns JWT
- [x] `POST /auth/login` — validates credentials, returns JWT
- [x] JWT middleware + Redis session storage
- [x] `POST /admin/worlds` — creates a World and seeds it with one Region, Territory, Town, and a blank Camp for the joining player using `world.json` for static topology
- [x] `POST /worlds/:id/join` — assigns player to world, creates their Camp document

### Phase 3 — Frontend Shell

**Deliverable:** A player can log in, see their territory on a map, see the clock ticking, and drill into the town or camp. No interactions yet — views are read-only.

- [ ] SvelteKit auth flow — register, login, redirect to world view
- [ ] API client and WebSocket client set up in `packages/frontend/src/lib`
- [ ] Territory view — shows town and player's camp as clickable nodes
- [ ] Town view — placeholder, shows town name and location
- [ ] Camp view — shows resource counts and empty NPC roster
- [ ] Running in-world clock in the page header, updated via WebSocket

### Phase 4 — Map API & Game Clock

**Deliverable:** The world advances in time. A player can query the map hierarchy. All state is readable via API.

- [ ] `GET /worlds/:id/map` — returns Region → Territory with nested Town and Camp refs
- [ ] `GET /towns/:id` — town detail with current encounters list
- [ ] `GET /camps/:id` — camp detail with resources, NPC roster, active tasks
- [ ] `GameClock` tick process — advances in-world date and time on an interval, writes to Mongo, publishes tick event to Redis pub/sub
- [ ] WebSocket gateway — client connects, receives clock updates on each tick

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
