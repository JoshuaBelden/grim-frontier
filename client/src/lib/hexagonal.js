/** 
The hex library defines a set of functions for working with the coordinate
systems used in Grim Frontier. Refer to the readme for more information.
*/

/**
 * Uses a hex rounding algorithm to round the hex coordinates
 * @param {*} hex The hex coordinates to round
 * @returns The rounded hex coordinates without the `s` component
 */
const round = hex => {
    let q = Math.round(hex.q)
    let r = Math.round(hex.r)

    // The `s` component is derived but used for rounding
    let s = Math.round(-hex.q - hex.r)

    const q_diff = Math.abs(q - hex.q)
    const r_diff = Math.abs(r - hex.r)
    const s_diff = Math.abs(s - s)

    if (q_diff > r_diff && q_diff > s_diff) {
        q = -r - s
    } else if (r_diff > s_diff) {
        r = -q - s
    } else {
        s = -q - r
    }

    return { q, r }
}

/**
 * Returns the vertices of a hexagon in world coordinates.
 * @param {*} worldCenter Specifies the center of the hexagon.
 * @param {*} size Specifies the size of the hexagon.
 * @returns The 6 verticies of the hexagon.
 */
export const getVerticies = (worldCenter, size) => {
    const vertices = []
    for (let i = 0; i < 6; i++) {
        var angle_deg = 60 * i
        var angle_rad = (Math.PI / 180) * angle_deg
        vertices.push({
            x: Math.round(worldCenter.x + size * Math.cos(angle_rad)),
            y: Math.round(worldCenter.y + size * Math.sin(angle_rad)),
        })
    }
    return vertices
}

/**
 * Converts world coordinates to map coordinates.
 * @param {Object} world - The world coordinates represented as `{ x, y }`.
 * @param {number} size - The size of the hexagon.
 * @returns {Object} - The map coordinates represented as `{ q, r }`.
 */
export const convertWorldToMapCoords = (world, size) => {
    const q = ((2 / 3) * world.x) / size
    const r = ((-1 / 3) * world.x + (Math.sqrt(3) / 3) * world.y) / size
    const retVal = round({ q, r })
    return retVal
}

/**
 * Converts map coordinates to world coordinates.
 * @param {*} map - The map coordinates represented as `{ q, r }`.
 * @param {*} size - The size of the hexagon.
 * @returns {Object} - The world coordinates represented as `{ x, y }`.
 */
export const convertMapToWorldCoords = (map, size) => {
    const x = (3 / 2) * map.q * size
    const y = Math.sqrt(3) * (map.r + map.q / 2) * size

    return {
        x: Math.floor(x) || 0,
        y: Math.floor(y) || 0,
    }
}

export const findPath = (start, end, impassableTiles = new Set()) => {
    if (
        impassableTiles.has(`${start.q},${start.r}`) ||
        impassableTiles.has(`${end.q},${end.r}`)
    ) {
        return null // No path possible
    }

    const openSet = []
    openSet.push({ tile: start, f: 0 })

    const cameFrom = new Map()
    const gScore = new Map()
    gScore.set(`${start.q},${start.r}`, 0)

    const fScore = new Map()
    fScore.set(`${start.q},${start.r}`, heuristic(start, end))

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f) // Sort by lowest f-score
        const current = openSet.shift().tile

        if (current.q === end.q && current.r === end.r) {
            return reconstructPath(cameFrom, current)
        }

        for (const neighbor of getNeighbors(current, impassableTiles)) {
            const key = `${neighbor.q},${neighbor.r}`
            const tentativeGScore =
                (gScore.get(`${current.q},${current.r}`) || Infinity) + 1

            if (!gScore.has(key) || tentativeGScore < gScore.get(key)) {
                cameFrom.set(key, current)
                gScore.set(key, tentativeGScore)
                fScore.set(key, tentativeGScore + heuristic(neighbor, end))
                openSet.push({ tile: neighbor, f: fScore.get(key) })
            }
        }
    }
    return null // No path found
}

function heuristic(a, b) {
    // Hex Manhattan distance
    return (
        (Math.abs(a.q - b.q) +
            Math.abs(a.r - b.r) +
            Math.abs(a.q + a.r - b.q - b.r)) /
        2
    )
}

function getNeighbors(tile, impassableTiles) {
    const directions = [
        { q: +1, r: 0 },
        { q: -1, r: 0 },
        { q: 0, r: +1 },
        { q: 0, r: -1 },
        { q: +1, r: -1 },
        { q: -1, r: +1 },
    ]

    return directions
        .map(d => ({ q: tile.q + d.q, r: tile.r + d.r }))
        .filter(n => !impassableTiles.has(`${n.q},${n.r}`)) // Filter out impassable tiles
}

function reconstructPath(cameFrom, current) {
    const path = []
    let key = `${current.q},${current.r}`
    while (cameFrom.has(key)) {
        path.push(current)
        current = cameFrom.get(key)
        key = `${current.q},${current.r}`
    }
    path.push(current)
    return path.reverse()
}
