/** Where a character came from geographically. */
export type OriginType = "frontier" | "small_town" | "city" | "foreign"

/** A character's family situation growing up. */
export type FamilySituation = "settled" | "notable" | "broken" | "orphan" | "outcast"

/** A character's formative background — origin, family, and a defining early event. */
export interface Background {
  origin: OriginType
  family: FamilySituation
  formativeEvent: string
}

/** The category of a character's lasting wound or burden. */
export type ScarType = "physical" | "loss" | "debt" | "reputation_mark" | "obsession"

/** A lasting wound or burden that shapes a character's behavior. */
export interface Scar {
  type: ScarType
  description: string
  triggerCondition?: string
}

/** What a character is chasing — secrets and goals at different time horizons. */
export interface Pursuits {
  secret?: string
  shortTerm?: string
  longTerm?: string
}

/** The full off-screen history of a character. */
export interface CharacterOrigin {
  background: Background
  scars: Scar[]
  pursuits: Pursuits
}
