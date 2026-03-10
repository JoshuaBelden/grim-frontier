import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { redis } from "../db/redis.js"

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { playerId: string; jti: string }
    user: { playerId: string; jti: string }
  }
}

/** Validates a JWT token and checks the Redis session. Returns the decoded payload or null if invalid. */
export async function validateSession(
  app: FastifyInstance,
  token: string,
): Promise<{ playerId: string; jti: string } | null> {
  try {
    const decoded = app.jwt.verify<{ playerId: string; jti: string }>(token)
    const stored = await redis.get(`session:${decoded.jti}`)
    if (!stored) return null
    return decoded
  } catch {
    return null
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
