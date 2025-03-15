import { Scene } from "phaser"
import {
    INITIAL_ZOOM,
    MIN_ZOOM,
    MAX_ZOOM,
    EVENT_TYPES,
    EventBus,
    RETICULE_COLOR_PASSIVE,
} from "../lib/constants"
import { getWorldCoordinates, getReticulePoints } from "../lib/hex"
import gameState from "../lib/gameState"

export default class DefaultScene extends Scene {
    world = gameState()
    selectedTile = null
    selectedUnit = null

    constructor() {
        super("World")
    }

    init() {}

    preload() {
        this.load.setPath("assets")
        this.load.image("map", "map.jpg")
        this.load.image("logo", "logo.png")
        this.load.image("wagon", "wagon.png")
    }

    setupCamera() {
        const centerX = this.scale.width / 2
        const centerY = this.scale.height / 2
        const camera = this.cameras.main
        camera.setBackgroundColor(0x222222)
        camera.setScroll(-centerX, -centerY)
        camera.setZoom(INITIAL_ZOOM)
    }

    setupZoom() {
        const camera = this.cameras.main
        this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
            const zoomAmount = deltaY > 0.5 ? 0.1 : -0.1
            camera.zoom += zoomAmount
            if (camera.zoom < MIN_ZOOM) camera.zoom = MIN_ZOOM
            if (camera.zoom > MAX_ZOOM) camera.zoom = MAX_ZOOM
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
        const reticule = this.add.graphics({
            lineStyle: { width: 2, color: RETICULE_COLOR_PASSIVE, alpha: 0.15 },
        })

        this.input.on("pointermove", pointer => {
            const { worldX, worldY } = pointer

            const reticulePoints = getReticulePoints(worldX, worldY)

            reticule.clear()
            reticule.strokePoints(reticulePoints, true)
        })
    }

    createUnit(unit) {
        const { q, r } = unit.mapCoords
        const { x, y } = getWorldCoordinates(q, r)

        const unitObj = this.add
            .image(x, y, unit.texture)
            .setOrigin(0.5, 0.5)
            .setInteractive()

        unitObj.on("pointerup", (pointer, x, y, event) => {
            this.selectedUnit = unit
            const screenCoords = { x: pointer.x, y: pointer.y }
            EventBus.emit(EVENT_TYPES.UNIT_SELECTED, {
                unit,
                screenCoords,
            })
            event.stopPropagation()
        })
    }

    setupWorld() {
        this.world.units.forEach(unit => {
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

        // Also accepts(pointer, currentlyOver)
        this.input.on("pointerdown", () => {
            this.selectedUnit = null
            EventBus.emit(EVENT_TYPES.UNIT_DESELECTED, null)
        })

        EventBus.emit(EVENT_TYPES.CURRENT_SCENE_READY, this)
    }

    changeScene() {
        // this.scene.start("GameOver")
    }
}
