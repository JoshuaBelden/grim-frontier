/** Persistent tendencies that modify skill expression in combat. */
export type CombatTrait = "dead_eye" | "hair_trigger" | "brawler" | "hard_to_kill" | "ruthless"

/** Persistent tendencies that modify skill expression in social situations. */
export type SocialTrait = "silver_tongue" | "hard_stare" | "poker_face" | "man_of_his_word" | "read_people"

/** Persistent tendencies that modify skill expression in crafting. */
export type CraftTrait = "steady_hands" | "horse_whisperer" | "tinkerer" | "merchants_eye"

/** Persistent tendencies that modify skill expression in wilderness survival. */
export type SurvivalTrait = "hard_living" | "tracker" | "last_man_standing" | "field_medic"

/** Persistent tendencies that modify skill expression in mental situations. */
export type MindTrait = "cool_head" | "gut_feeling" | "paranoid" | "grudge_holder"

/** Persistent tendencies derived from a character's past. */
export type BackgroundTrait = "outlaws_eye" | "frontier_born" | "campaigner" | "gamblers_blood"

/** Union of all trait categories. */
export type Trait = CombatTrait | SocialTrait | CraftTrait | SurvivalTrait | MindTrait | BackgroundTrait
