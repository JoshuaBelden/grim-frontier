import PropTypes from 'prop-types';

export const QuickInfo = ({ selectedUnit }) => {
    return (
        <div className="info">
            <h1>Info</h1>
            <h2>Selected Unit</h2>
            {selectedUnit?.unitType}
        </div>
    )
}

QuickInfo.propTypes = {
    selectedUnit: PropTypes.object
}