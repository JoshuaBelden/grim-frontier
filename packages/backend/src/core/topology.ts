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
            { key: "dustercreek", name: "Dustercreek" },
          ],
          landmarks: [
            { key: "dustercreek", name: "Dustercreek", type: "town", position: { x: 300, y: 50 } },
            { key: "wayward", name: "Wayward", type: "outpost", position: { x: 50, y: 250 } },
            { key: "coyote_crossing", name: "Coyote Crossing", type: "crossing", position: { x: 200, y: 175 } },
          ],
          connections: [
            { from: "wayward", to: "coyote_crossing", name: "Wayward Road", distance: 5, classification: "road" },
            { from: "dustercreek", to: "coyote_crossing", name: "Dustercreek Road", distance: 10, classification: "road" },
          ],
        },
      ],
    },
  ],
}

export default world
