export const TERRAIN_TYPES = {
    MOUNTAIN: "MOUNTAIN",
    PRAIRIE: "PRAIRIE",
    WATER: "WATER",
}

export const getFillColor = (terrain) => {
    switch (terrain) {
        case TERRAIN_TYPES.MOUNTAIN:
            return 0x3f4f44
        case TERRAIN_TYPES.PRAIRIE:
            return 0xaab99a
        case TERRAIN_TYPES.WATER:
            return 0x98d8ef
        default:
            return 0x00
    }
}

export const getStrokeColor = (terrain) => {
    switch (terrain) {
        case TERRAIN_TYPES.MOUNTAIN:
            return 0x2c3930
        case TERRAIN_TYPES.PRAIRIE:
            return 0x727d73
        case TERRAIN_TYPES.WATER:
            return 0x3b6790
        default:
            return 0x22
    }
}

export const getTerrainType = (neighboringTerrain) => {
    const random = Math.random() * 100
    if (
        random < 20 ||
        (neighboringTerrain === TERRAIN_TYPES.MOUNTAIN && random < 40)
    ) {
        return TERRAIN_TYPES.MOUNTAIN
    } else if (
        random < 30 ||
        (neighboringTerrain === TERRAIN_TYPES.WATER && random < 40)
    ) {
        return TERRAIN_TYPES.WATER
    } else {
        return TERRAIN_TYPES.PRAIRIE
    }
}
