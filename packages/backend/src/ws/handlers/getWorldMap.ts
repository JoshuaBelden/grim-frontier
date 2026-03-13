import type { GetWorldMapCommand } from "@grim-frontier/shared"
import { camps, npcs, regions, territories, towns } from "../../models/collections.js"
import worldTopology from "../../core/topology.js"
import type { HandlerContext } from "./index.js"

/** Resolves the territory map for the player's world, including landmarks, connections, and camp. */
export async function handleGetWorldMap(context: HandlerContext, payload: unknown): Promise<void> {
  const command = payload as GetWorldMapCommand

  const region = await regions.findOne({ worldId: command.worldId })
  if (!region) {
    context.send({ type: "error", command: "getWorldMap", message: "World map not found" })
    return
  }

  const territory = await territories.findOne({ regionId: region._id!.toString() })
  if (!territory) {
    context.send({ type: "error", command: "getWorldMap", message: "Territory not found" })
    return
  }

  const allLandmarks = await towns.find({ territoryId: territory._id!.toString() }).toArray()
  const camp = await camps.findOne({ worldId: command.worldId, ownerId: context.playerId })
  const playerNpc = await npcs.findOne({ ownerId: context.playerId })

  // Resolve NPC's current location to a landmark nodeKey
  let npcLocationKey: string | null = null
  if (playerNpc?.status === "in_town" && playerNpc.locationId) {
    const locationTown = allLandmarks.find(landmark => landmark._id!.toString() === playerNpc.locationId)
    npcLocationKey = locationTown?.nodeKey ?? null
  }

  const territoryNode = worldTopology.regions
    .flatMap(region => region.territories)
    .find(node => node.key === territory.nodeKey)

  const landmarkPositions = new Map(
    (territoryNode?.landmarks ?? []).map(landmark => [landmark.key, landmark.position]),
  )

  context.send({
    type: "worldMap",
    territory: {
      id: territory._id!.toString(),
      name: territory.name,
      regionName: region.name,
      landmarks: allLandmarks.map(landmark => ({
        id: landmark._id!.toString(),
        name: landmark.name,
        type: landmark.type ?? "town",
        nodeKey: landmark.nodeKey,
        position: landmarkPositions.get(landmark.nodeKey) ?? { x: 0, y: 0 },
      })),
      connections: territoryNode?.connections ?? [],
      camp: camp
        ? {
            id: camp._id!.toString(),
            name: camp.name,
            nearestLandmarkKey: camp.nearestLandmarkKey,
            distanceToLandmark: camp.distanceToLandmark,
          }
        : null,
      npcTravel: playerNpc?.status === "travelling" ? (playerNpc.travelState ?? null) : null,
      npcLocationKey,
    },
  })
}
