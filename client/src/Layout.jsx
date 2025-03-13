import { useRef, useState } from "react"
import { Hud } from "./Hud"
import { Map } from "./Map"
import { QuickInfo } from "./QuickInfo"

function Layout() {
    const phaserRef = useRef()

    // const [selectedTile, setSelectedTile] = useState(null)
    const [selectedUnit, setSelectedUnit] = useState(null)

    // const onTileSelected = tile => {
    //     setSelectedTile(tile)
    // }

    const onUnitSelected = unit => {
        setSelectedUnit(unit)
    }

    return (
        <div className="container">
            <Hud />
            <Map
                ref={phaserRef}
                // onTileSelected={onTileSelected}
                onUnitSelected={onUnitSelected}
            />
            {selectedUnit && <QuickInfo selectedUnit={selectedUnit} />}
        </div>
    )
}

export default Layout
