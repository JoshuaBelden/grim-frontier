import type { FastifyRequest, FastifyReply } from "fastify"
import { redis } from "../db/redis.js"

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { playerId: string; jti: string }
    user: { playerId: string; jti: string }
  }
}

/** Fastify preHandler that verifies the JWT and validates the Redis session. */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch {
    return reply.status(401).send({ error: "Unauthorized" })
  }

  const { jti } = request.user
  const stored = await redis.get(`session:${jti}`)
  if (!stored) {
    return reply.status(401).send({ error: "Session expired" })
  }
}
