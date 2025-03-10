import { TILE_WIDTH, TILE_HEIGHT, BORDER_WIDTH } from "./constants.js";

class Tile {
    discovered = false;

    constructor(q, r) {
        this.q = q;
        this.r = r;
        this.s = -q - r;
    }

    getWorldCoordinates() {
        const x = TILE_WIDTH * (3 / 2) * this.q;
        const y = TILE_HEIGHT * Math.sqrt(3) * (this.r + this.q / 2);

        return {
            x: Math.floor(x),
            y: Math.floor(y),
        };
    }

    getTilePoints() {
        const tilePoints = [];
        const radius = TILE_WIDTH - BORDER_WIDTH;
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const pointX = this.q + radius * Math.cos(angle) + TILE_WIDTH;
            const pointY = this.r + radius * Math.sin(angle) + TILE_HEIGHT;

            tilePoints.push({
                x: Math.floor(pointX),
                y: Math.floor(pointY),
            });
        }
        return tilePoints;
    }

    getMovementCost() {
        return 1;
    }

    isImpassable() {
        return false;
    }

    getNeighbors() {
        const directions = [
            [1, 0], // Tile to the east and continue counter-clockwise
            [1, -1],
            [0, -1],
            [-1, 0],
            [-1, 1],
            [0, 1],
        ];
        return directions.map(([dq, dr]) => new Tile(this.q + dq, this.r + dr));
    }

    distanceTo(hex) {
        return Math.max(
            Math.abs(this.q - hex.q),
            Math.abs(this.r - hex.r),
            Math.abs(this.s - hex.s)
        );
    }
}

class Grid {
    constructor(radius) {
        this.tiles = new Map();
        for (let q = -radius; q <= radius; q++) {
            for (
                let r = Math.max(-radius, -q - radius);
                r <= Math.min(radius, -q + radius);
                r++
            ) {
                this.addTile(new Tile(q, r));
            }
        }
    }

    key(q, r) {
        return `${q},${r}`;
    }

    addTile(hex) {
        this.tiles.set(this.key(hex.q, hex.r), hex);
    }

    getTile(q, r) {
        return this.tiles.get(this.key(q, r)) || null;
    }

    getValidNeighbors(tile) {
        return tile
            .getNeighbors()
            .map(({ q, r }) => this.getTile(q, r))
            .filter(Boolean);
    }

    findPath(start, goal) {
        const openSet = [start];
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        gScore.set(this.key(start.q, start.r), 0);
        fScore.set(this.key(start.q, start.r), start.distanceTo(goal));

        while (openSet.length > 0) {
            openSet.sort(
                (a, b) =>
                    fScore.get(this.key(a.q, a.r)) -
                    fScore.get(this.key(b.q, b.r))
            );
            const current = openSet.shift();

            if (current === goal) {
                return this.reconstructPath(cameFrom, current);
            }

            for (const neighbor of this.getValidNeighbors(current)) {
                const tentativeGScore =
                    gScore.get(this.key(current.q, current.r)) +
                    neighbor.getMovementCost();

                if (
                    !gScore.has(this.key(neighbor.q, neighbor.r)) ||
                    tentativeGScore <
                        gScore.get(this.key(neighbor.q, neighbor.r))
                ) {
                    cameFrom.set(this.key(neighbor.q, neighbor.r), current);
                    gScore.set(
                        this.key(neighbor.q, neighbor.r),
                        tentativeGScore
                    );
                    fScore.set(
                        this.key(neighbor.q, neighbor.r),
                        tentativeGScore + neighbor.distanceTo(goal)
                    );

                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                    }
                }
            }
        }
        return null; // No path found
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        while (cameFrom.has(this.key(current.q, current.r))) {
            current = cameFrom.get(this.key(current.q, current.r));
            path.unshift(current);
        }
        return path;
    }
}

export { Tile, Grid };

