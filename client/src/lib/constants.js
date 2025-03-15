import Phaser from "phaser"

export const INITIAL_ZOOM = 0.75
export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 3

export const RETICULE_RADIUS = 100
export const RETICULE_COLOR_PASSIVE = 0x000000
export const RETICULE_COLOR_ACTIVE = 0xcb0b06

export const EventBus = new Phaser.Events.EventEmitter()
export const EVENT_TYPES = {
    TILE_SELECTED: "tile-selected",
    UNIT_SELECTED: "unit-selected",
    UNIT_DESELECTED: "unit-deselected",
    ACTION_SELECTED: "action-selected",
    CURRENT_SCENE_READY: "current-scene-ready",
}

export const ACTION_TYPES = {
    TRAIL_REPORT: "trail-report",
    SETUP_CAMP: "setup-camp",
}

export const UNIT_TYPES = {
    SETTLER: "settler",
}
