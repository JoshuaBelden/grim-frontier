// ============================================================
// Characteristics — innate physical/biological attributes (1–10)
// ============================================================

export interface Characteristics {
  strength: number
  hand: number
  presence: number
  wit: number
  temper: number
  grit: number
  nerve: number
  luck: number
}

// ============================================================
// Nature — bipolar axes (-5 to +5)
// Negative = first named pole, positive = second named pole
// ============================================================

export interface Disposition {
  generosity: number // -5 = Greedy,    +5 = Generous
  mercy: number // -5 = Cruel,     +5 = Merciful
  courage: number // -5 = Cautious,  +5 = Courageous
  contentment: number // -5 = Ambitious, +5 = Content
  honesty: number // -5 = Deceptive, +5 = Honest
}

export interface Outlook {
  idealism: number // -5 = Cynical,    +5 = Idealistic
  willfulness: number // -5 = Fatalistic, +5 = Willful
  trust: number // -5 = Suspicious, +5 = Trusting
  humility: number // -5 = Prideful,   +5 = Humble
}

export interface Nature {
  disposition: Disposition
  outlook: Outlook
}

// ============================================================
// Traits — persistent tendencies that modify skill expression
// ============================================================

export type CombatTrait = "dead_eye" | "hair_trigger" | "brawler" | "hard_to_kill" | "ruthless"

export type SocialTrait = "silver_tongue" | "hard_stare" | "poker_face" | "man_of_his_word" | "read_people"

export type CraftTrait = "steady_hands" | "horse_whisperer" | "tinkerer" | "merchants_eye"

export type SurvivalTrait = "hard_living" | "tracker" | "last_man_standing" | "field_medic"

export type MindTrait = "cool_head" | "gut_feeling" | "paranoid" | "grudge_holder"

export type BackgroundTrait = "outlaws_eye" | "frontier_born" | "campaigner" | "gamblers_blood"

export type Trait = CombatTrait | SocialTrait | CraftTrait | SurvivalTrait | MindTrait | BackgroundTrait

// ============================================================
// Careers — define mechanical purpose, unlock exclusive trait
// ============================================================

export type Career =
  | "scout"
  | "trapper"
  | "prospector"
  | "lawman"
  | "bounty_hunter"
  | "detective"
  | "gunfighter"
  | "rustler"
  | "smuggler"
  | "soldier"
  | "deserter"
  | "cowboy"
  | "wrangler"
  | "rancher"
  | "homesteader"
  | "blacksmith"
  | "gunsmith"
  | "leatherworker"
  | "carpenter"
  | "butcher"
  | "barber"
  | "dentist"
  | "doctor"
  | "merchant"
  | "trader"
  | "saloon_keeper"
  | "gambler"
  | "banker"
  | "lawyer"
  | "preacher"
  | "teacher"
  | "journalist"

// ============================================================
// Skills — learned and improvable (value 1–10)
// ============================================================

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

export type Skills = Partial<Record<SkillName, number>>

// ============================================================
// Origin — the full off-screen history
// ============================================================

export type OriginType = "frontier" | "small_town" | "city" | "foreign"

export type FamilySituation = "settled" | "notable" | "broken" | "orphan" | "outcast"

export interface Background {
  origin: OriginType
  family: FamilySituation
  formativeEvent: string
}

export type ScarType = "physical" | "loss" | "debt" | "reputation_mark" | "obsession"

export interface Scar {
  type: ScarType
  description: string
  triggerCondition?: string
}

export interface Pursuits {
  secret?: string
  shortTerm?: string
  longTerm?: string
}

export interface CharacterOrigin {
  background: Background
  scars: Scar[]
  pursuits: Pursuits
}

// ============================================================
// Relationships & Loyalty — independent axes
// ============================================================

export type RelationshipValue = -3 | -2 | -1 | 0 | 1 | 2 | 3

export type Loyalty = "transactional" | "invested" | "bound"

export interface Relationship {
  targetId: string
  targetType: "player" | "npc"
  value: RelationshipValue
  loyalty: Loyalty
}

// ============================================================
// World Topology
// ============================================================

export type WorldStatus = "active" | "paused" | "archived"

export interface InWorldDate {
  year: number
  month: number
  day: number
  hour: number
}

export interface World {
  name: string
  status: WorldStatus
  inWorldDate: InWorldDate
  createdAt: Date
  updatedAt: Date
}

export interface Region {
  worldId: string
  name: string
  resourceProfile: Record<string, number>
  createdAt: Date
  updatedAt: Date
}

export interface Territory {
  regionId: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface Town {
  territoryId: string
  name: string
  nodeKey: string // reference key in world.json static topology
  createdAt: Date
  updatedAt: Date
}

// ============================================================
// Camp
// ============================================================

export type CampPosture = "open" | "closed" | "aggressive" | "defensive"

export interface Resources {
  food: number
  supplies: number
}

export interface Camp {
  ownerId: string // Player id
  worldId: string
  territoryId: string
  name: string
  resources: Resources
  stability: number // 0–100
  posture: CampPosture
  reputation: number // 0–100
  wealth: number
  notoriety: number
  createdAt: Date
  updatedAt: Date
}

// ============================================================
// Player
// ============================================================

export interface Player {
  username: string
  passwordHash: string
  worldId?: string
  campId?: string
  characteristics: Characteristics
  nature: Nature
  traits: Trait[]
  career: Career
  skills: Skills
  origin: CharacterOrigin
  relationships: Relationship[]
  createdAt: Date
  updatedAt: Date
}

/** Player without sensitive fields — safe to send to clients */
export type PlayerProfile = Omit<Player, "passwordHash">

// ============================================================
// NPC
// ============================================================

export type NPCStatus = "drifting" | "encountered" | "at_camp" | "gone"

export interface NPC {
  worldId: string
  name: string
  characteristics: Characteristics
  nature: Nature
  traits: Trait[]
  career: Career
  skills: Skills
  origin: CharacterOrigin
  status: NPCStatus
  locationId?: string // Town or Camp id
  locationType?: "town" | "camp"
  campId?: string
  relationships: Relationship[]
  createdAt: Date
  updatedAt: Date
}

// ============================================================
// Game Clock
// ============================================================

export interface GameClock {
  worldId: string
  tick: number
  inWorldDate: InWorldDate
  lastTickAt: Date
  createdAt: Date
  updatedAt: Date
}

// ============================================================
// Task — NPC assigned chore
// ============================================================

export type ChoreType = "food_gathering" | "supply_scavenging" | "patrol" | "camp_maintenance" | "trade_run"

export type TaskStatus = "pending" | "in_progress" | "completed" | "failed"

export interface Task {
  worldId: string
  campId: string
  npcId: string
  type: ChoreType
  status: TaskStatus
  startedAt: Date
  completesAt: Date
  rewardResources?: Partial<Resources>
  createdAt: Date
  updatedAt: Date
}

// ============================================================
// Encounter — NPC surfacing in a town
// ============================================================

export type EncounterStatus = "active" | "tracked" | "resolved"

export interface Encounter {
  worldId: string
  townId: string
  npcId: string
  status: EncounterStatus
  trackedByPlayerId?: string
  createdAt: Date
  updatedAt: Date
}
