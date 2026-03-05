import type { WorldTopology } from "@grim-frontier/shared"

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
