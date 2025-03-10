import Phaser from "phaser";

export const EVENT_TYPES = {
    TILE_SELECTED: "tile-selected",
    UNIT_SELECTED: "unit-selected",
    CURRENT_SCENE_READY: "current-scene-ready",
};

export const EventBus = new Phaser.Events.EventEmitter();
