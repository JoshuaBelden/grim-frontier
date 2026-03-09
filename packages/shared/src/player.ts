/** A registered user who may own NPCs across multiple worlds. */
export interface Player {
  username: string
  passwordHash: string
  campId?: string
  npcIds: string[]
  createdAt: Date
  updatedAt: Date
}

/** Player without sensitive fields — safe to send to clients. */
export type PlayerProfile = Omit<Player, "passwordHash">
