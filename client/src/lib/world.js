import { Grid } from "./grid"
import { getTerrainType, TERRAIN_TYPES } from "./terrain"
import { Unit, UNIT_TYPES } from "./unit"
import { WORLD_SIZE } from "./constants"

export default class World {
    static create() {
        return new World()
    }

    constructor() {
        this.grid = new Grid(WORLD_SIZE)
        this.initTerrain(this.grid)
        this.initDiscoveredTiles(this.grid)

        this.units = [new Unit(UNIT_TYPES.SETTLER, { q: 0, r: 0 })]
    }

    initTerrain(grid) {
        const rootTile = grid.getTile(0, 0)
        rootTile.terrain = TERRAIN_TYPES.PRAIRIE
        rootTile.discovered = true
        this.initNeighborTerrain(grid, rootTile)
    }

    initNeighborTerrain(grid, tile) {
        tile.getNeighbors().forEach(coords => {
            const neighbor = grid.getTile(coords.q, coords.r)
            if (!neighbor) return
            if (!neighbor.terrain) {
                neighbor.terrain = getTerrainType(tile.terrain)
                this.initNeighborTerrain(grid, neighbor)
            }
        })
    }

    initDiscoveredTiles(grid) {
        const rootTile = grid.getTile(0, 0)
        rootTile.discovered = true
        rootTile.getNeighbors().forEach(coords => {
            const neighbor = grid.getTile(coords.q, coords.r)
            neighbor.discovered = true
        })
    }
}
