import { forwardRef, useEffect, useLayoutEffect, useRef } from "react"
import PropTypes from "prop-types"
import { EVENT_TYPES, EventBus } from "../lib/events"
import StartGame from "./setup"

export const WorldMap = forwardRef(function PhaserGame(
    { currentActiveScene, onTileSelected, onUnitSelected },
    ref
) {
    const game = useRef()

    useLayoutEffect(() => {
        // Create the game inside a useLayoutEffect hook to avoid the game being created outside the DOM
        if (game.current === undefined) {
            game.current = StartGame("game-container")
            if (ref !== null) {
                ref.current = { game: game.current, scene: null }
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

        return () => {
            EventBus.removeListener("current-scene-ready")
        }
    }, [currentActiveScene, onTileSelected, onUnitSelected, ref])

    return <div id="game-container"></div>
})

WorldMap.propTypes = {
    currentActiveScene: PropTypes.func,
    onTileSelected: PropTypes.func,
    onUnitSelected: PropTypes.func,
}
