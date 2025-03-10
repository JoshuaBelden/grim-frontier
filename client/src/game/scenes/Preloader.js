import { Scene } from "phaser"

export class Preloader extends Scene {
    constructor() {
        super("Preloader")
    }

    init() {}

    preload() {
        this.load.setPath("assets")
        this.load.image("map", "map.jpg")
        this.load.image("logo", "logo.png")
        this.load.image("wagon", "wagon.png")
    }

    create() {
        this.scene.start("Game")
    }
}
