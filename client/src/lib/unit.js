export const UNIT_TYPES = {
    SETTLER: "settler",
}

export class Unit {
    constructor(type, coords) {
        this.type = type
        this.coords = coords
    }
}
