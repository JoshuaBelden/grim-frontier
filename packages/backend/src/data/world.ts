/** A named settlement node in the static world graph. */
export interface TownNode {
  key: string
  name: string
}

/** A bounded area within a region, containing one or more towns. */
export interface TerritoryNode {
  key: string
  name: string
  towns: TownNode[]
}

/** A geographic zone with a distinct resource profile and one or more territories. */
export interface RegionNode {
  key: string
  name: string
  resourceProfile: Record<string, number>
  territories: TerritoryNode[]
}

/** The complete static world topology — loaded from source, never stored in the database. */
export interface WorldTopology {
  regions: RegionNode[]
}

const world: WorldTopology = {
  regions: [
    {
      key: "high_plains",
      name: "High Plains",
      resourceProfile: { timber: 3, ore: 2, game: 5, water: 4 },
      territories: [
        {
          key: "dustcreek_valley",
          name: "Dustcreek Valley",
          towns: [
            {
              key: "dustcreek",
              name: "Dustcreek",
            },
          ],
        },
      ],
    },
  ],
}

export default world
