import type { FastifyInstance } from "fastify"
import { ObjectId } from "mongodb"
import { generateNpcPool } from "../core/npcGenerator.js"
import worldTopology from "../core/topology.js"
import { INITIAL_IN_WORLD_DATE, seedWorld } from "../core/world.js"
import { WorldClock } from "../core/worldClock.js"
import {
  acquaintances,
  camps,
  encounters,
  gameClocks,
  joinRequests,
  npcs,
  players,
  regions,
  stores,
  tasks,
  territories,
  towns,
  worlds,
} from "../models/collections.js"

/** Request body for NPC pool generation. */
interface GenerateNpcsBody {
  count?: number
}

/** Request body for NPC portrait generation. */
interface GeneratePortraitsBody {
  npcId?: string
}

/** Request body for world creation. */
interface CreateWorldBody {
  name: string
}

/** Admin routes for world management. No auth required in MVP — admin ops via curl. */
export async function adminRoutes(
  app: FastifyInstance,
  opts: { clock: WorldClock; broadcast: (worldId: string, message: object) => void; intervalMs: number },
) {
  const { clock, broadcast, intervalMs } = opts

  app.post("/admin/tick/start", async (_request, reply) => {
    if (clock.isRunning) {
      return reply.status(200).send({ status: "already running" })
    }
    clock.start(broadcast, intervalMs)
    return reply.status(200).send({ status: "started" })
  })

  app.post("/admin/tick/pause", async (_request, reply) => {
    if (!clock.isRunning) {
      return reply.status(200).send({ status: "already paused" })
    }
    clock.pause()
    return reply.status(200).send({ status: "paused" })
  })
  app.post<{ Body: CreateWorldBody }>("/admin/worlds", async (request, reply) => {
    const { name } = request.body

    if (!name) {
      return reply.status(400).send({ error: "name is required" })
    }

    const result = await seedWorld(name, worldTopology)

    return reply.status(201).send(result)
  })

  app.post("/admin/worlds/reset", async (_request, reply) => {
    await Promise.all([
      worlds.deleteMany({}),
      regions.deleteMany({}),
      territories.deleteMany({}),
      towns.deleteMany({}),
      camps.deleteMany({}),
      npcs.deleteMany({ ownerId: { $exists: true } }),
      encounters.deleteMany({}),
      tasks.deleteMany({}),
      gameClocks.deleteMany({}),
      stores.deleteMany({}),
      joinRequests.deleteMany({}),
      acquaintances.deleteMany({}),
      players.updateMany({}, { $unset: { campId: "" }, $set: { npcIds: [] } }),
    ])

    clock.clearAll()
    const result = await seedWorld("Grim Frontier", worldTopology)
    clock.setDate(result.worldId, INITIAL_IN_WORLD_DATE)

    const townIds = Object.values(result.landmarkIds)
    const unownedNpcs = await npcs.find({ ownerId: { $exists: false } }).toArray()
    const bulkOps = unownedNpcs.map(npc => {
      const randomTownId = townIds[Math.floor(Math.random() * townIds.length)]
      return {
        updateOne: {
          filter: { _id: npc._id },
          update: {
            $set: {
              worldId: result.worldId,
              locationId: randomTownId,
              locationType: "town" as const,
              status: "drifting" as const,
              health: 10,
              morale: 10,
              sustenance: 10,
              energy: 10,
              updatedAt: new Date(),
            },
            $unset: { campId: "" as const, currentAction: "" as const },
          },
        },
      }
    })

    if (bulkOps.length > 0) {
      await npcs.bulkWrite(bulkOps)
    }

    return reply.status(201).send(result)
  })

  app.post<{ Body: GenerateNpcsBody }>("/admin/npcs/generate", async (request, reply) => {
    const rawCount = request.body?.count ?? 20
    const count = Math.max(1, Math.min(50, rawCount))

    let pool
    try {
      pool = await generateNpcPool(count)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes("ANTHROPIC_API_KEY")) {
        return reply.status(503).send({ error: "Claude API key not configured" })
      }
      return reply.status(502).send({ error: message })
    }

    const result = await npcs.insertMany(pool)
    const ids = Object.values(result.insertedIds).map(id => id.toString())

    return reply.status(201).send({ generated: count, ids })
  })

  app.post<{ Body: GeneratePortraitsBody }>("/admin/npcs/generate-portraits", async (request, reply) => {
    const { npcId } = request.body ?? {}
    const sdServiceUrl = process.env.SD_SERVICE_URL ?? "http://sd-service:8000"

    const query = npcId
      ? { _id: new ObjectId(npcId) }
      : { portraitUrl: { $exists: false }, portraitDescription: { $exists: true } }

    const targets = await npcs.find(query).toArray()

    if (targets.length === 0) {
      return reply.status(200).send({ generated: 0, ids: [], reason: "no matching npcs" })
    }

    const generated: string[] = []
    const errors: string[] = []

    for (const npc of targets) {
      const npcIdStr = npc._id.toString()
      const prompt = buildPortraitPrompt(npc.portraitDescription!)

      try {
        const response = await fetch(`${sdServiceUrl}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, npc_id: npcIdStr }),
        })

        if (!response.ok) {
          errors.push(`${npcIdStr}: sd-service returned ${response.status}`)
          continue
        }

        const { filename } = (await response.json()) as { filename: string }
        await npcs.updateOne({ _id: npc._id }, { $set: { portraitUrl: `/portraits/${filename}`, updatedAt: new Date() } })
        generated.push(npcIdStr)
      } catch (error) {
        errors.push(`${npcIdStr}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    return reply.status(200).send({ generated: generated.length, ids: generated, errors })
  })
}

/** Builds an image generation prompt from a portrait description. */
function buildPortraitPrompt(portraitDescription: string): string {
  return `${portraitDescription}, old west portrait, dramatic lighting, highly detailed, photorealistic, weathered`
}
