import { UNIT_TYPES } from "./constants"

const gameState = () => {
    const units = [unit(UNIT_TYPES.SETTLER, { q: 0, r: 0 })]

    return {
        units,
    }
}

export const unit = (unitType, mapCoords) => {
    const texture = unitType === UNIT_TYPES.SETTLER ? "wagon" : ""
    return {
        unitType,
        mapCoords,
        texture
    }
}

export default gameState
