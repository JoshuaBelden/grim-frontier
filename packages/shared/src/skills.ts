/** All learnable and improvable skill identifiers. */
export type SkillName =
  | "shooting"
  | "brawling"
  | "quick_draw" // Combat
  | "ride"
  | "animal_handling" // Horsemanship
  | "track"
  | "navigate"
  | "survive"
  | "scout"
  | "stealth" // Wilderness
  | "persuade"
  | "intimidate"
  | "deceive"
  | "command"
  | "negotiate" // Social
  | "build"
  | "forge"
  | "leatherwork"
  | "tinker"
  | "doctor" // Craft
  | "appraise"
  | "trade"
  | "gamble" // Trade & Economy
  | "investigate"
  | "streetwise"
  | "gather" // Information

/** A character's skill levels, keyed by skill name (1–10). */
export type Skills = Partial<Record<SkillName, number>>
