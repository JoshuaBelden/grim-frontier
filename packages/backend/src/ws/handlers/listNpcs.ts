import type { NpcListItem } from "@grim-frontier/shared"
import { ObjectId } from "mongodb"
import { camps, npcs, regions, territories, towns } from "../../models/collections.js"
import type { HandlerContext } from "./index.js"

/** Assigns unassigned pool NPCs to random towns in the world as drifting inhabitants. */
async function assignPoolNpcsToWorld(worldId: string): Promise<void> {
  const unassigned = await npcs.find({ worldId: { $exists: false }, ownerId: { $exists: false } }).toArray()
  if (unassigned.length === 0) return

  const region = await regions.findOne({ worldId })
  if (!region) return

  const territory = await territories.findOne({ regionId: region._id!.toString() })
  if (!territory) return

  const worldTowns = await towns.find({ territoryId: territory._id!.toString() }).toArray()
  if (worldTowns.length === 0) return

  const now = new Date()
  const operations = unassigned.map((npc, index) => {
    const town = worldTowns[index % worldTowns.length]
    return {
      updateOne: {
        filter: { _id: npc._id },
        update: {
          $set: {
            worldId,
            status: "drifting" as const,
            locationId: town._id!.toString(),
            locationType: "town" as const,
            updatedAt: now,
          },
        },
      },
    }
  })

  await npcs.bulkWrite(operations)
}

/** Returns a summary list of all NPCs in the connected world. */
export async function handleListNpcs(context: HandlerContext): Promise<void> {
  await assignPoolNpcsToWorld(context.worldId)

  const allNpcs = await npcs.find({ worldId: context.worldId }).toArray()

  const locationIds = [...new Set(allNpcs.map(npc => npc.locationId).filter(Boolean))] as string[]
  const objectIds = locationIds.map(id => new ObjectId(id))

  const [campDocs, townDocs] = await Promise.all([
    camps.find({ _id: { $in: objectIds } }).toArray(),
    towns.find({ _id: { $in: objectIds } }).toArray(),
  ])

  const locationNameMap = new Map<string, string>()
  for (const camp of campDocs) {
    locationNameMap.set(camp._id!.toString(), camp.name)
  }
  for (const town of townDocs) {
    locationNameMap.set(town._id!.toString(), town.name)
  }

  const items: NpcListItem[] = allNpcs.map(npc => ({
    id: npc._id!.toString(),
    name: npc.name,
    career: npc.career,
    status: npc.status,
    locationName: npc.locationId ? locationNameMap.get(npc.locationId) ?? null : null,
    locationType: npc.locationType ?? null,
  }))

  context.send({ type: "npcList", npcs: items })
}
