import PropTypes from "prop-types"

export const TrailReport = ({ selectedUnit }) => {
    return (
        <div className="info">
            <h1>Trail Report</h1>
            <h2>Selected Unit</h2>
            {selectedUnit?.unitType}
        </div>
    )
}

TrailReport.propTypes = {
    selectedUnit: PropTypes.object,
}
