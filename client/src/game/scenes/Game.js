import Phaser, { Scene } from "phaser"
import { EVENT_TYPES, EventBus } from "../../lib/events"
import World from "../../lib/world"
import { getFillColor, getStrokeColor } from "../../lib/terrain"
import { BORDER_WIDTH } from '../../lib/constants'

export class Game extends Scene {
    INITIAL_ZOOM = 0.75
    MIN_ZOOM = 0.25
    MAX_ZOOM = 3

    selectedTile = null
    selectedUnit = null

    constructor() {
        super("Game")
    }

    init() {}

    preload() {}

    setupCamera() {
        const centerX = this.scale.width / 2
        const centerY = this.scale.height / 2
        const camera = this.cameras.main
        camera.setBackgroundColor(0x222222)
        camera.setScroll(-centerX, -centerY)
        camera.setZoom(this.INITIAL_ZOOM)
    }

    setupZoom() {
        const camera = this.cameras.main
        this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
            const zoomAmount = deltaY > .5 ? 0.1 : -0.1
            camera.zoom += zoomAmount
            if (camera.zoom < this.MIN_ZOOM) camera.zoom = this.MIN_ZOOM
            if (camera.zoom > this.MAX_ZOOM) camera.zoom = this.MAX_ZOOM
        })
    }

    setupScroll() {
        const camera = this.cameras.main
        this.input.on("pointermove", pointer => {
            if (!pointer.isDown) return

            camera.scrollX -= (pointer.x - pointer.prevPosition.x) / camera.zoom
            camera.scrollY -= (pointer.y - pointer.prevPosition.y) / camera.zoom
        })
    }

    setupHighlight() {
        this.input.on("gameobjectover", (pointer, gameObject) => {
            gameObject.fillAlpha = 0.75
        })

        this.input.on("gameobjectout", (pointer, gameObject) => {
            gameObject.fillAlpha = 1
        })
    }

    createTile(tile) {
        const { x, y } = tile.getWorldCoordinates()
        const tilePoints = tile.getTilePoints()
        const tileObj = this.add
            .polygon(x, y, tilePoints)
            .setInteractive(
                new Phaser.Geom.Polygon(tilePoints),
                Phaser.Geom.Polygon.Contains
            )

        if (tile.discovered) {
            tileObj
                .setAlpha(0.25)
                .setStrokeStyle(5, getStrokeColor(tile.terrain), 0.5)
                .setFillStyle(getFillColor(tile.terrain))
        } else {
            tileObj
                .setAlpha(1)
                .setStrokeStyle(BORDER_WIDTH, 0x000000, .5)
                //.setFillStyle(0x000000)
        }

        tileObj.on("pointerdown", (pointer, x, y, event) => {
            this.selectedTile = tile
            EventBus.emit(EVENT_TYPES.TILE_SELECTED, tile)
            event.stopPropagation()
        })

        return tileObj
    }

    createUnit(unit) {
        const { x, y } = unit.coords
        const unitObj = this.add
            .image(x, y, "wagon")
            .setOrigin(0.5, 0.5)
            .setInteractive()
        unitObj.on("pointerdown", (pointer, x, y, event) => {
            this.selectedUnit = unit
            EventBus.emit(EVENT_TYPES.UNIT_SELECTED, unit)
            event.stopPropagation()
        })
    }

    setupWorld() {
        const world = World.create()
        // world.grid.tiles.forEach(tile => {
        //     this.createTile(tile)
        // })
        world.units.forEach(unit => {
            this.createUnit(unit)
        })
    }

    create() {
        this.add.image(0, 0, "map").setOrigin(0.5)

        this.setupCamera()
        this.setupZoom()
        this.setupScroll()
        this.setupHighlight()
        this.setupWorld()

        this.input.on("pointerdown", (pointer, currentlyOver) => {
            // if (currentlyOver.length === 0) {
            this.selectedUnit = null
            EventBus.emit(EVENT_TYPES.TILE_SELECTED, null)
            EventBus.emit(EVENT_TYPES.UNIT_SELECTED, null)
            // }
        })

        EventBus.emit(EVENT_TYPES.CURRENT_SCENE_READY, this)
    }

    changeScene() {
        this.scene.start("GameOver")
    }
}
