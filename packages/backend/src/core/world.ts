import type { WorldTopology } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { regions, territories, towns, worlds } from "../models/collections.js"

export const INITIAL_IN_WORLD_DATE = { year: 1893, month: 9, day: 16, hour: 6 }

export interface SeedWorldResult {
  worldId: string
  regionId: string
  territoryId: string
  townId: string
}

export async function seedWorld(name: string, topology: WorldTopology): Promise<SeedWorldResult> {
  const now = new Date()
  const worldId = new ObjectId()

  await worlds.insertOne({
    _id: worldId,
    name,
    status: "active",
    inWorldDate: INITIAL_IN_WORLD_DATE,
    createdAt: now,
    updatedAt: now,
  })

  const regionData = topology.regions[0]
  const regionId = new ObjectId()

  await regions.insertOne({
    _id: regionId,
    worldId: worldId.toString(),
    name: regionData.name,
    resourceProfile: regionData.resourceProfile,
    createdAt: now,
    updatedAt: now,
  })

  const territoryData = regionData.territories[0]
  const territoryId = new ObjectId()

  await territories.insertOne({
    _id: territoryId,
    regionId: regionId.toString(),
    name: territoryData.name,
    createdAt: now,
    updatedAt: now,
  })

  const townData = territoryData.towns[0]
  const townId = new ObjectId()

  await towns.insertOne({
    _id: townId,
    territoryId: territoryId.toString(),
    name: townData.name,
    nodeKey: townData.key,
    createdAt: now,
    updatedAt: now,
  })

  return {
    worldId: worldId.toString(),
    regionId: regionId.toString(),
    territoryId: territoryId.toString(),
    townId: townId.toString(),
  }
}
