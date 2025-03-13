export const Hud = () => {
    return (
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
    )
}
