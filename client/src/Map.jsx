import { forwardRef, useEffect, useLayoutEffect, useRef } from "react"
import PropTypes from "prop-types"
import Phaser from "phaser"
import { EVENT_TYPES, EventBus } from "./lib/constants.js"
import DefaultScene from "./scenes/DefaultScene.jsx"

export const Map = forwardRef(function PhaserGame(
    { currentActiveScene, onTileSelected, onUnitSelected, onUnitDeselected },
    ref
) {
    const game = useRef()

    useLayoutEffect(() => {
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
            scene: [DefaultScene],
        }

        if (game.current === undefined) {
            try {
                game.current = new Phaser.Game(config)
                if (ref !== null) {
                    ref.current = { game: game.current, scene: null }
                }
            } catch (error) {
                console.error("Error while creating the game", error)
            }
        }

        return () => {
            if (game.current) {
                game.current.destroy(true)
                game.current = undefined
            }
        }
    }, [ref])

    useEffect(() => {
        EventBus.on(EVENT_TYPES.CURRENT_SCENE_READY, currentScene => {
            if (currentActiveScene instanceof Function) {
                currentActiveScene(currentScene)
            }
            ref.current.scene = currentScene
        })

        EventBus.on(EVENT_TYPES.TILE_SELECTED, tile => {
            if (onTileSelected instanceof Function) {
                onTileSelected(tile)
            }
        })

        EventBus.on(EVENT_TYPES.UNIT_SELECTED, unit => {
            if (onUnitSelected instanceof Function) {
                onUnitSelected(unit)
            }
        })

        EventBus.on(EVENT_TYPES.UNIT_DESELECTED, () => {
            if (onUnitSelected instanceof Function) {
                onUnitDeselected(null)
            }
        })


        return () => {
            EventBus.removeListener("current-scene-ready")
        }
    }, [currentActiveScene, onTileSelected, onUnitSelected, onUnitDeselected, ref])

    return (
        <div className="map">
            <div id="game-container"></div>
        </div>
    )
})

Map.propTypes = {
    currentActiveScene: PropTypes.func,
    onTileSelected: PropTypes.func,
    onUnitSelected: PropTypes.func,
    onUnitDeselected: PropTypes.func,
}
