import { useRef, useState } from "react"
import { WorldMap } from "./game/WorldMap"

function Container() {
    const phaserRef = useRef()

    const [selectedTile, setSelectedTile] = useState(null)
    const [selectedUnit, setSelectedUnit] = useState(null)

    const onTileSelected = tile => {
        setSelectedTile(tile)
    }

    const onUnitSelected = unit => {
        setSelectedUnit(unit)
    }

    return (
        <div className="container">
            <div className="hud">
                <div className="hud__left"></div>
                <div className="hud__center">
                    <h2>James Jameson</h2>
                </div>
                <div className="hud__right">
                    <div className="location-info">
                        <div className="time">
                            <div className="cash">$7.77</div>
                            <div className="weather"> 7:59am | 15&deg;C</div>
                        </div>
                        <hr></hr>
                        <div>
                            <div className="county">Georgia, OR</div>
                            <div className="town">Bend</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="map">
                <WorldMap
                    ref={phaserRef}
                    // currentActiveScene={currentScene}
                    onTileSelected={onTileSelected}
                    onUnitSelected={onUnitSelected}
                />
            </div>

            {selectedUnit && <div className="info">
                <h1>Info</h1>
                <h2>Selected Unit</h2>
                {selectedUnit?.type}
            </div>}
        </div>
    )
}

export default Container
