import type { WorldTopology } from "@grim-frontier/shared"

const world: WorldTopology = {
  regions: [
    {
      key: "high_plains",
      name: "High Plains",
      resourceProfile: { timber: 3, ore: 2, game: 5, water: 4 },
      territories: [
        {
          key: "dustercreek_valley",
          name: "Dustercreek Valley",
          towns: [
            {
              key: "dustercreek",
              name: "Dustercreek",
            },
          ],
        },
      ],
    },
  ],
}

export default world
