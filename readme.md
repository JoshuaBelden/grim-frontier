# Grim Frontier

A persistent, async western world simulation. Tick-based and multiplayer — you build a camp, attract AI-driven NPCs (Drifters), and shape a world that keeps moving while you're offline.

See [docs/concept.md](docs/concept.md) for full design overview.

## Stack

| Layer    | Tech                              |
|----------|-----------------------------------|
| Frontend | SvelteKit 5 + Vite                |
| Backend  | Node.js + Fastify + WebSockets    |
| Database | MongoDB (primary persistent state)|
| Cache    | Redis (event bus, hot-path cache) |
| AI       | Claude API (NPC generation)       |

Monorepo: `packages/backend`, `packages/frontend`, `packages/shared`.

## Getting Started

**Prerequisites:** Docker + Docker Compose, [Bun](https://bun.sh)

Install Bun if you don't have it:
```bash
brew install bun
```

After cloning, install dependencies (links the workspace packages and satisfies editor tooling):
```bash
bun install
```

```bash
# 1. Copy env and add your Claude API key
cp .env.example .env

# 2. Start all services
docker compose up --build
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| Backend  | http://localhost:3000        |
| MongoDB  | mongodb://localhost:27017    |
| Redis    | redis://localhost:6379       |

## Checking Services

**Backend health** (MongoDB + Redis status):
```bash
curl localhost:3000/health
# {"status":"ok","mongo":"connected","redis":"connected"}
```

**Container status:**
```bash
docker compose ps
```

**Logs:**
```bash
docker compose logs backend
docker compose logs frontend
docker compose logs -f          # follow all services
```

**Restart a service:**
```bash
docker compose restart backend
```

**Clear generated images:**
```bash
# If the SD service is running:
docker compose exec sd-service sh -c "rm -f /images/*.jpg"

# If the SD service is stopped:
docker compose run --rm sd-service sh -c "rm -f /images/*.jpg"
```

## Development

Source files in `packages/backend/src/` and `packages/frontend/src/` are volume-mounted — changes are picked up automatically without rebuilding.

Config file changes (`vite.config.ts`, `svelte.config.js`) are also mounted. Fastify routes restart automatically via `bun --watch`.

To rebuild after changing a `package.json`:
```bash
docker compose up --build
```

## Admin Endpoints

No auth required — designed for `curl` during local development.

The world tick does **not** start automatically on server boot — use the endpoints below to control it explicitly.

**Start the tick:**
```bash
curl -X POST localhost:3000/admin/tick/start
# { "status": "started" } or { "status": "already running" }
```

**Pause the tick** (world state is preserved, safe to resume):
```bash
curl -X POST localhost:3000/admin/tick/pause
# { "status": "paused" } or { "status": "already paused" }
```

**Create a world:**
```bash
curl -X POST localhost:3000/admin/worlds \
  -H 'Content-Type: application/json' \
  -d '{"name": "Grim Frontier"}'
# Returns: { worldId, landmarkIds }
```

**Reset world** (wipes all game state and re-seeds):
```bash
curl -X POST localhost:3000/admin/worlds/reset
# Returns: reseeded world data
```

**Generate NPC pool** (uses Claude API):
```bash
curl -X POST localhost:3000/admin/npcs/generate \
  -H 'Content-Type: application/json' \
  -d '{"count": 20}'
# count: 1–50, default 20
# Returns: { generated, ids }
```

**Generate portraits for NPCs** (uses SD service):
```bash
# All NPCs without portraits:
curl -X POST localhost:3000/admin/npcs/generate-portraits

# Specific NPC:
curl -X POST localhost:3000/admin/npcs/generate-portraits \
  -H 'Content-Type: application/json' \
  -d '{"npcId": "<npc-id>"}'
# Returns: { generated, ids, errors? }
```

Portraits are served as static files at `http://localhost:3000/portraits/<filename>`.

## Image Generation (SD Service)

The SD service runs on port 8000 (Stable Diffusion v1.5, 512×512).

**Health check:**
```bash
curl localhost:8000/health
# { "status": "ok", "model_loaded": true }
```

**Generate NPC portrait:**
```bash
curl -X POST localhost:8000/generate \
  -H 'Content-Type: application/json' \
  -d '{"prompt": "grizzled cowboy, weathered face", "npc_id": "abc123"}'
# Returns: { "filename": "npc-abc123.jpg" }
# Saved to /images/npc-{npc_id}.jpg inside the container
```

**Generate custom image:**
```bash
curl -X POST localhost:8000/generate/custom \
  -H 'Content-Type: application/json' \
  -d '{"prompt": "abandoned saloon at dusk", "image_id": "saloon1", "negative_prompt": "people, horses"}'
# Returns: { "filename": "img-saloon1.jpg" }
```

Typically you trigger portrait generation through the admin endpoint rather than the SD service directly.

## Debugging

Launch configs are in `.vscode/launch.json`. Docker must be running before attaching.

**Backend** — Bun exposes the inspector on port 9229. Use the **"Attach: Backend (Docker)"** config to attach. Reconnects automatically on file-change reloads.

**Frontend** — Use **"Debug: Frontend (Chrome)"** to open a Chrome instance with the debugger connected to `http://localhost:5173`. Set breakpoints directly in `.svelte` and `.ts` files — Vite source maps wire them up.

**Full stack** — **"Debug: Full Stack"** runs both simultaneously.
