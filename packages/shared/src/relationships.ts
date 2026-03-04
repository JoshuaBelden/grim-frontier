/** How much a character values or distrusts another, ranging -3 to +3. */
export type RelationshipValue = -3 | -2 | -1 | 0 | 1 | 2 | 3

/** The depth of commitment behind a relationship, independent of its value. */
export type Loyalty = "transactional" | "invested" | "bound"

/** A directional relationship from one character toward another. */
export interface Relationship {
  targetId: string
  targetType: "player" | "npc"
  value: RelationshipValue
  loyalty: Loyalty
}
