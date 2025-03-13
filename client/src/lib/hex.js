import { RETICULE_RADIUS } from './constants'

const getMapCoords = (worldX, worldY) => {
    const q = ((2 / 3) * worldX) / RETICULE_RADIUS
    const r =
        ((-1 / 3) * worldX + (Math.sqrt(3) / 3) * worldY) / RETICULE_RADIUS
    return {
        q: Math.round(q),
        r: Math.round(r),
    }
}

export const getWorldCoordinates = (q, r) => {
    const x = 100 * (3 / 2) * q
    const y = 100 * Math.sqrt(3) * (r + q / 2)

    return {
        x: Math.floor(x),
        y: Math.floor(y),
    }
}

const getTilePoints = (q, r) => {
    const tilePoints = []
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i
        const pointX = q + RETICULE_RADIUS * Math.cos(angle)
        const pointY = r + RETICULE_RADIUS * Math.sin(angle)

        tilePoints.push({
            x: Math.floor(pointX),
            y: Math.floor(pointY),
        })
    }
    return tilePoints
}

export const getReticulePoints = (cursorX, cursorY) => {
    const hexCoords = getMapCoords(cursorX, cursorY)
    const worldHexCoords = getWorldCoordinates(hexCoords.q, hexCoords.r)
    const tilePoints = getTilePoints(
        worldHexCoords.x,
        worldHexCoords.y
    )
    return tilePoints
}
