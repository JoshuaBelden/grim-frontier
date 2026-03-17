import type { Career, NPC, Trait } from "@grim-frontier/shared"
import type { FastifyInstance } from "fastify"
import { ObjectId } from "mongodb"
import { authenticate } from "../middleware/authenticate.js"
import { npcs, players } from "../models/collections.js"

const SD_SERVICE_URL = process.env.SD_SERVICE_URL ?? "http://sd-service:8000"

/** Request body for creating a player-owned NPC. */
interface CreateCharacterBody {
  name: string
  age: number
  career: Career
  portraitDescription?: string
  characteristics: {
    strength: number
    hand: number
    presence: number
    wit: number
    temper: number
    grit: number
    nerve: number
    luck: number
  }
  nature: {
    disposition: {
      generosity: number
      mercy: number
      courage: number
      contentment: number
      honesty: number
    }
    outlook: {
      idealism: number
      willfulness: number
      trust: number
      humility: number
    }
  }
  traits: Trait[]
  skills: Partial<Record<string, number>>
  origin: {
    background: {
      origin: string
      family: string
      formativeEvent: string
    }
    scars: Array<{ type: string; description: string; triggerCondition?: string }>
  }
}

/** Player character management routes — create, list, delete, and generate portraits. */
export async function characterRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateCharacterBody }>("/characters", { preHandler: authenticate }, async (request, reply) => {
    const { playerId } = request.user
    const body = request.body

    if (!body.name?.trim()) {
      return reply.status(400).send({ error: "name is required" })
    }

    if (body.age < 21 || body.age > 77) {
      return reply.status(400).send({ error: "age must be between 21 and 77" })
    }

    const charValues = Object.values(body.characteristics)
    const charSum = charValues.reduce((sum, value) => sum + value, 0)
    if (charSum > 35) {
      return reply.status(400).send({ error: "characteristics total cannot exceed 35" })
    }

    if (body.traits.length !== 2) {
      return reply.status(400).send({ error: "exactly 2 traits are required" })
    }

    const skillKeys = Object.keys(body.skills)
    if (skillKeys.length !== 3) {
      return reply.status(400).send({ error: "exactly 3 skills are required" })
    }

    const player = await players.findOne({ _id: new ObjectId(playerId) })
    if (!player) {
      return reply.status(404).send({ error: "Player not found" })
    }

    const now = new Date()
    const npcId = new ObjectId()

    const npc: NPC & { _id: ObjectId } = {
      _id: npcId,
      ownerId: playerId,
      name: body.name.trim(),
      age: body.age,
      health: 10,
      morale: 10,
      sustenance: 10,
      energy: 10,
      characteristics: body.characteristics,
      nature: body.nature,
      traits: body.traits,
      career: body.career,
      skills: body.skills,
      origin: {
        background: body.origin.background as NPC["origin"]["background"],
        scars: body.origin.scars as NPC["origin"]["scars"],
        pursuits: {},
      },
      portraitDescription: body.portraitDescription?.trim() || undefined,
      relationships: [],
      inventory: [],
      money: 50,
      status: "drifting",
      createdAt: now,
      updatedAt: now,
    }

    await npcs.insertOne(npc)
    await players.updateOne({ _id: new ObjectId(playerId) }, { $push: { npcIds: npcId.toString() } })

    return reply.status(201).send({ npcId: npcId.toString() })
  })

  app.get("/players/me/npcs", { preHandler: authenticate }, async (request, reply) => {
    const { playerId } = request.user

    const player = await players.findOne({ _id: new ObjectId(playerId) })
    if (!player) {
      return reply.status(404).send({ error: "Player not found" })
    }

    if (player.npcIds.length === 0) {
      return []
    }

    const npcObjectIds = player.npcIds.map(id => new ObjectId(id))
    const playerNpcs = await npcs.find({ _id: { $in: npcObjectIds } }).toArray()

    return playerNpcs.map(npc => ({
      id: npc._id!.toString(),
      name: npc.name,
      career: npc.career,
      age: npc.age,
      portraitUrl: npc.portraitUrl ?? null,
      worldId: npc.worldId ?? null,
      campId: npc.campId ?? null,
      status: npc.status,
    }))
  })

  app.delete<{ Params: { id: string } }>("/characters/:id", { preHandler: authenticate }, async (request, reply) => {
    const { playerId } = request.user
    let npcId: ObjectId
    try {
      npcId = new ObjectId(request.params.id)
    } catch {
      return reply.status(400).send({ error: "Invalid NPC id" })
    }

    const npc = await npcs.findOne({ _id: npcId })
    if (!npc) {
      return reply.status(404).send({ error: "NPC not found" })
    }
    if (npc.ownerId !== playerId) {
      return reply.status(403).send({ error: "Not your NPC" })
    }
    if (npc.worldId) {
      return reply.status(409).send({ error: "Cannot delete an NPC that has joined a world" })
    }

    await npcs.deleteOne({ _id: npcId })
    await players.updateOne({ _id: new ObjectId(playerId) }, { $pull: { npcIds: request.params.id } })

    return reply.status(204).send()
  })

  app.post<{ Params: { id: string } }>(
    "/characters/:id/portrait",
    { preHandler: authenticate },
    async (request, reply) => {
      const { playerId } = request.user
      let npcId: ObjectId
      try {
        npcId = new ObjectId(request.params.id)
      } catch {
        return reply.status(400).send({ error: "Invalid NPC id" })
      }

      const npc = await npcs.findOne({ _id: npcId })
      if (!npc) {
        return reply.status(404).send({ error: "NPC not found" })
      }
      if (npc.ownerId !== playerId) {
        return reply.status(403).send({ error: "Not your NPC" })
      }
      if (!npc.portraitDescription) {
        return reply.status(400).send({ error: "NPC has no portrait description" })
      }

      const prompt = buildPortraitPrompt(npc.portraitDescription)
      const npcIdStr = npcId.toString()

      let response: Response
      try {
        response = await fetch(`${SD_SERVICE_URL}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, npc_id: npcIdStr }),
        })
      } catch (error) {
        return reply.status(502).send({ error: "Portrait service unavailable" })
      }

      if (!response.ok) {
        return reply.status(502).send({ error: `Portrait service returned ${response.status}` })
      }

      const { filename } = (await response.json()) as { filename: string }
      const portraitUrl = `/portraits/${filename}`
      await npcs.updateOne({ _id: npcId }, { $set: { portraitUrl, updatedAt: new Date() } })

      return { portraitUrl }
    },
  )
}

/** Builds an image generation prompt from a portrait description. */
function buildPortraitPrompt(portraitDescription: string): string {
  return `${portraitDescription}, old west portrait, dramatic lighting, highly detailed, photorealistic, weathered`
}
