import { useEffect, useState } from "react"
import PropTypes from "prop-types"
import "./radial-menu.scss"
import { ACTION_TYPES } from "./lib/constants"

/**
 *
 * @param {*} param0
 * @returns
 */
const RadialMenu = ({ requestedPosition, onActionSelected }) => {
    const [currentPosition, setCurrentPosition] = useState(requestedPosition)
    const [showMenu, setShowMenu] = useState(false)
    const wrapperCN = `wrapper ${showMenu ? "show" : ""}`
    useEffect(() => {
        if (requestedPosition) {
            setCurrentPosition(requestedPosition)
        }
    }, [requestedPosition])

    const handleMenuClick = () => {
        const toggle = !showMenu
        setShowMenu(toggle)
        if (!toggle) {
            setCurrentPosition(null)
        }
    }

    if (!currentPosition) return null

    return (
        <div
            className="radial-menu component"
            style={{
                top: currentPosition.y - 10,
                left: currentPosition.x - 10,
            }}
            onClick={handleMenuClick}
        >
            <button className="menu-button">⬆︎</button>
            <div className={wrapperCN} id="wrapper">
                <ul>
                    <li>
                        <a href="#">
                            <span></span>
                        </a>
                    </li>
                    <li>
                        <a href="#">
                            <span></span>
                        </a>
                    </li>
                    <li>
                        <a
                            href="#"
                            onClick={() =>
                                onActionSelected(ACTION_TYPES.MOVE_UNIT)
                            }
                        >
                            <span>Move</span>
                        </a>
                    </li>
                    <li>
                        <a
                            href="#"
                            onClick={() =>
                                onActionSelected(ACTION_TYPES.SHOW_TRAIL_REPORT)
                            }
                        >
                            <span>Trail Report</span>
                        </a>
                    </li>
                    <li>
                        <a href="#">
                            <span>Setup Camp</span>
                        </a>
                    </li>
                    <li>
                        <a href="#">
                            <span></span>
                        </a>
                    </li>
                    <li>
                        <a href="#">
                            <span></span>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    )
}

RadialMenu.propTypes = {
    requestedPosition: PropTypes.object,
    onActionSelected: PropTypes.func,
}

export default RadialMenu
