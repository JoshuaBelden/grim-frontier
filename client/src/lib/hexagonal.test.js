import { describe, it, expect } from "vitest"
import { convertMapToWorldCoords, convertWorldToMapCoords, getVerticies } from "./hexagonal"

describe("Coordinate System", () => {
    describe("getVerticies", () => {
        it("should return the verticies of a hexagon", () => {
            const center = { x: 0, y: 0 }
            const size = 50
            expect(getVerticies(center, size)).toEqual([
                { x: 50, y: 0 },
                { x: 25, y: 43 },
                { x: -25, y: 43 },
                { x: -50, y: 0 },
                { x: -25, y: -43 },
                { x: 25, y: -43 },
            ])
        })
    })

    describe("convertWorldToMapCoords", () => {
        it("should return the center of the screen", () => {
            const size = 50;
            const world = { x: 0, y: 0 }
            expect(convertWorldToMapCoords(world, size)).toEqual({
                q: 0,
                r: 0,
            })
        })

        it("should return the center of the map when the mouse moves within the tile radius", () => {
            // We're working with a hexagonal, not a circle. If the x or y are the same as the 
            // tile radius, they could be outside the tile. The following tests the mouse just
            // inside the tile vertices.
            const size = 50;
            let world = { x: 50, y: 0 }
            expect(convertWorldToMapCoords(world, size)).toEqual({
                q: 0,
                r: -0,
            })

            world = { x: -50, y: 0 }
            expect(convertWorldToMapCoords(world, size)).toEqual({
                q: -0,
                r: 0,
            })
            
            world = { x: -22, y: -30 }
            expect(convertWorldToMapCoords(world, size)).toEqual({
                q: 0,
                r: -0,
            })

            world = { x: 22, y: -30 }
            expect(convertWorldToMapCoords(world, size)).toEqual({
                q: 0,
                r: -0,
            })

            world = { x: 30, y: -22 }
            expect(convertWorldToMapCoords(world, size)).toEqual({
                q: 0,
                r: -0,
            })

            world = { x: 30, y: 22 }
            expect(convertWorldToMapCoords(world, size)).toEqual({
                q: 0,
                r: 0,
            })
        })
    })

    describe("convertMapToWorldCoords", () => {
        it("should return the center of the screen", () => {
            const size = 50;
            const map = { q: 0, r: 0 } 
            expect(convertMapToWorldCoords(map, size)).toEqual({
                x: 0,
                y: 0,
            })
        })

        it ("should return the center of the tile over", () => {
            const size = 50;
            const map = { q: 1, r: 0 }
            expect(convertMapToWorldCoords(map, size)).toEqual({
                x: 75,
                y: 43,
            })
        })
    })
})
