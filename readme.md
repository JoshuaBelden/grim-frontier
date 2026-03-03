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

**Prerequisites:** Docker + Docker Compose

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

## Development

Source files in `packages/backend/src/` and `packages/frontend/src/` are volume-mounted — changes are picked up automatically without rebuilding.

Config file changes (`vite.config.ts`, `svelte.config.js`) are also mounted. Fastify routes restart automatically via `bun --watch`.

To rebuild after changing a `package.json`:
```bash
docker compose up --build
```
