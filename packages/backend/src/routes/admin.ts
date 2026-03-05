import type { FastifyInstance } from "fastify"
import worldTopology from "../core/topology.js"
import { seedWorld } from "../core/world.js"

/** Request body for world creation. */
interface CreateWorldBody {
  name: string
}

/** Admin routes for world management. No auth required in MVP — admin ops via curl. */
export async function adminRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateWorldBody }>("/admin/worlds", async (request, reply) => {
    const { name } = request.body

    if (!name) {
      return reply.status(400).send({ error: "name is required" })
    }

    const result = await seedWorld(name, worldTopology)

    return reply.status(201).send(result)
  })
}
