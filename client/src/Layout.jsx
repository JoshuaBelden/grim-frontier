import { useRef, useState } from "react"
import { Hud } from "./Hud"
import { Map } from "./Map"
import { TrailReport } from "./TrailReport"
import RadialMenu from "./RadialMenu"
import { ACTION_TYPES } from "./lib/constants"

function Layout() {
    const phaserRef = useRef()

    const [selectedUnit, setSelectedUnit] = useState(null)
    const [radialMenuPosition, setRadialMenuPosition] = useState()
    const [showTrailReport, setShowTrailReport] = useState(false)

    const onUnitSelected = event => {
        setSelectedUnit(event.unit)
        setRadialMenuPosition(event.screenCoords)
    }

    const onUnitDeselected = () => {
        setSelectedUnit(null)
        setShowTrailReport(false)
        setRadialMenuPosition(null)
    }

    const onActionSelected = actionType => {
        switch (actionType) {
            case ACTION_TYPES.TRAIL_REPORT:
                setShowTrailReport(true)
                break
            default:
                break
        }
    }

    return (
        <>
            <div className="container">
                {radialMenuPosition && (
                    <RadialMenu
                        requestedPosition={radialMenuPosition}
                        onActionSelected={onActionSelected}
                    />
                )}
                <Hud />
                <Map
                    ref={phaserRef}
                    onUnitSelected={onUnitSelected}
                    onUnitDeselected={onUnitDeselected}
                />
                {showTrailReport && <TrailReport selectedUnit={selectedUnit} />}
            </div>
        </>
    )
}

export default Layout
