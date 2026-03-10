import type { WorldTopology } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { regions, territories, towns, worlds } from "../models/collections.js"

export const INITIAL_IN_WORLD_DATE = { year: 1893, month: 9, day: 16, hour: 6 }

/** Result of seeding a world from static topology. */
export interface SeedWorldResult {
  worldId: string
  regionId: string
  territoryId: string
  landmarkIds: Record<string, string>
}

/** Creates database documents from static topology for a new world. */
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
    nodeKey: territoryData.key,
    createdAt: now,
    updatedAt: now,
  })

  const landmarkIds: Record<string, string> = {}

  for (const landmark of territoryData.landmarks) {
    const landmarkId = new ObjectId()
    await towns.insertOne({
      _id: landmarkId,
      territoryId: territoryId.toString(),
      name: landmark.name,
      nodeKey: landmark.key,
      type: landmark.type,
      createdAt: now,
      updatedAt: now,
    })
    landmarkIds[landmark.key] = landmarkId.toString()
  }

  return {
    worldId: worldId.toString(),
    regionId: regionId.toString(),
    territoryId: territoryId.toString(),
    landmarkIds,
  }
}
