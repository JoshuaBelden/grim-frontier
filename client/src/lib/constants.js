import Phaser from "phaser"

export const INITIAL_ZOOM = 0.75
export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 3
export const RETICULE_RADIUS = 100

export const EventBus = new Phaser.Events.EventEmitter()
export const EVENT_TYPES = {
    TILE_SELECTED: "tile-selected",
    UNIT_SELECTED: "unit-selected",
    CURRENT_SCENE_READY: "current-scene-ready",
}

export const UNIT_TYPES = {
    SETTLER: "settler",
}
