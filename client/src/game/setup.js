import { Boot } from "./scenes/Boot"
import { Game } from "./scenes/Game"
import Phaser from "phaser"
import { Preloader } from "./scenes/Preloader"

const config = {
    type: Phaser.AUTO,
    width: "100%",
    height: "100%",
    parent: "game-container",
    backgroundColor: "#028af8",
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
        Boot,
        Preloader,
        Game
    ],
}

const Setup = parent => {
    return new Phaser.Game({ ...config, parent })
}

export default Setup
