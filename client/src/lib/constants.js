export const INITIAL_ZOOM = 1
export const MIN_ZOOM = 0.25
export const MAX_ZOOM = 3

export const TILE_SIZE = 50
export const RETICULE_COLOR_PASSIVE = 0x000000
export const RETICULE_COLOR_ACTIVE = 0xcb0b06

export const EVENT_TYPES = {
    CURRENT_SCENE_READY: "current-scene-ready",
    TILE_SELECTED: "tile-selected",
    TIKE_DESELECTED: "tile-deselected",
    UNIT_SELECTED: "unit-selected",
    UNIT_DESELECTED: "unit-deselected",
    ACTION_REQUESTED: "action-requested",
    ACTION_RESOLVED: "action-resolved",
    UNIT_MOVED: "unit-moved",
}

export const ACTION_TYPES = {
    SHOW_TRAIL_REPORT: "trail-report",
    MOVE_UNIT: "move",
    SETUP_CAMP: "setup-camp",
}

export const UNIT_TYPES = {
    SETTLER: "settler",
}
