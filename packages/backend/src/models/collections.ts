import type {
  Acquaintance,
  Camp,
  Encounter,
  GameClock,
  JoinRequest,
  NPC,
  Player,
  Region,
  Store,
  Task,
  Territory,
  Town,
  World,
} from "@grim-frontier/shared"
import { ObjectId, type Collection } from "mongodb"
import { db } from "../db/mongo.js"

/**
 * Extends a shared domain type with a MongoDB ObjectId _id.
 * The _id is optional so documents can be constructed before insertion.
 * Cross-document reference fields (worldId, campId, etc.) remain as strings
 * matching the shared types; the API layer serializes ObjectIds via .toString().
 */
type Doc<T> = T & { _id?: ObjectId }

export const worlds = db.collection<Doc<World>>("worlds") as Collection<Doc<World>>
export const regions = db.collection<Doc<Region>>("regions") as Collection<Doc<Region>>
export const territories = db.collection<Doc<Territory>>("territories") as Collection<Doc<Territory>>
export const towns = db.collection<Doc<Town>>("towns") as Collection<Doc<Town>>
export const camps = db.collection<Doc<Camp>>("camps") as Collection<Doc<Camp>>
export const players = db.collection<Doc<Player>>("players") as Collection<Doc<Player>>
export const npcs = db.collection<Doc<NPC>>("npcs") as Collection<Doc<NPC>>
export const gameClocks = db.collection<Doc<GameClock>>("gameClocks") as Collection<Doc<GameClock>>
export const tasks = db.collection<Doc<Task>>("tasks") as Collection<Doc<Task>>
export const encounters = db.collection<Doc<Encounter>>("encounters") as Collection<Doc<Encounter>>
export const joinRequests = db.collection<Doc<JoinRequest>>("joinRequests") as Collection<Doc<JoinRequest>>
export const acquaintances = db.collection<Doc<Acquaintance>>("acquaintances") as Collection<Doc<Acquaintance>>
export const stores = db.collection<Doc<Store>>("stores") as Collection<Doc<Store>>
