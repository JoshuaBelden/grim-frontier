import { Scene } from "phaser"
import * as C from "../lib/constants"
import * as hex from "../lib/hexagonal"
import eventBus from "../lib/eventBus"
import gameState from "../lib/gameState"

export default class DefaultScene extends Scene {
    world = gameState()
    reticule = null
    reticuleSelector = null
    units = []
    selectedTile = null
    selectedUnit = null
    pendingAction = null

    constructor() {
        super("World")
        eventBus.on(C.EVENT_TYPES.ACTION_SELECTED, this.onActionSelected, this)
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
        camera.setScroll(-centerX, -centerY)
        camera.setZoom(C.INITIAL_ZOOM)
    }

    setupZoom() {
        const camera = this.cameras.main
        this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
            const zoomAmount = deltaY > 0.5 ? 0.1 : -0.1
            camera.zoom += zoomAmount
            if (camera.zoom < C.MIN_ZOOM) camera.zoom = C.MIN_ZOOM
            if (camera.zoom > C.MAX_ZOOM) camera.zoom = C.MAX_ZOOM
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

    setupReticule() {
        this.reticule = this.add.graphics({
            lineStyle: { width: 2, color: C.RETICULE_COLOR_PASSIVE, alpha: 0 },
        })

        this.reticuleSelector = this.add.graphics({
            lineStyle: { width: 2, color: 0xffffff, alpha: 1 },
        })

        this.input.on("pointermove", this.onReticuleMoved, this)
    }

    createUnit(unitData) {
        const { q, r } = unitData.mapCoords
        const { x, y } = hex.convertMapToWorldCoords(q, r)

        const unit = this.add
            .image(x, y, unitData.texture)
            .setOrigin(0.5, 0.5)
            .setInteractive()

        unit.on("pointerup", (pointer, x, y, event) => {
            this.selectedUnit = unitData
            eventBus.emit(C.EVENT_TYPES.UNIT_SELECTED, {
                unit: unitData,
                screenCoords: { x: pointer.x, y: pointer.y },
            })
            event.stopPropagation()
        })

        return unit
    }

    setupWorld() {
        this.world.units.forEach(unit => {
            this.units.push(this.createUnit(unit))
        })
    }

    create() {
        this.add.image(0, 0, "map").setOrigin(0.5)

        this.setupCamera()
        this.setupZoom()
        this.setupScroll()
        this.setupReticule()
        this.setupWorld()

        this.input.on("pointerdown", this.onWorldClicked, this)

        eventBus.emit(C.EVENT_TYPES.CURRENT_SCENE_READY, this)
    }

    onReticuleMoved(pointer) {
        if (!this.reticule) return

        const { worldX, worldY } = pointer

        const mapCoords = hex.convertWorldToMapCoords(
            { x: worldX, y: worldY },
            C.TILE_SIZE
        )
        const worldCoords = hex.convertMapToWorldCoords(mapCoords, C.TILE_SIZE)
        const vertices = hex.getVerticies(worldCoords, C.TILE_SIZE)

        const reticuleColor = this.pendingAction
            ? C.RETICULE_COLOR_ACTIVE
            : C.RETICULE_COLOR_PASSIVE

        this.reticule.clear()
        this.reticule.lineStyle(2, reticuleColor, 0.5)
        this.reticule.strokePoints(vertices, true)

        // If we have a pending action that's a move, we want to draw a curvy line from
        // . the selected unit to the reticule. We'll need to use the hex library to get
        // . a list of points between the reticule and the unit. Then we can draw a line
        // . between those points.
        if (
            this.pendingAction === C.ACTION_TYPES.MOVE_UNIT &&
            this.selectedUnit
        ) {
            const points = hex.findPath(this.selectedUnit.mapCoords, mapCoords)
            const linePoints = points.map(point => {
                return hex.convertMapToWorldCoords(point, C.TILE_SIZE)
            })
            this.reticuleSelector.clear()
            this.reticuleSelector.lineStyle(2, 0xffffff, 1)
            this.reticuleSelector.strokePoints(linePoints, false)
        }
    }

    onWorldClicked() {
        if (
            this.pendingAction === C.ACTION_TYPES.MOVE_UNIT &&
            this.selectedUnit
        ) {
            this.selectedUnit.destCoords = hex.convertWorldToMapCoords(
                {
                    x: this.input.activePointer.worldX,
                    y: this.input.activePointer.worldY,
                },
                C.TILE_SIZE
            )
        }

        this.selectedUnit = null
        eventBus.emit(C.EVENT_TYPES.UNIT_DESELECTED, null)
    }

    onActionSelected(actionType) {
        this.pendingAction = actionType
    }

    // update(time, delta) {}
}
