# Grim Frontier

## Coordinate System

### Map Coordinates

Grim Frontier is played out on a hex based map. While the hexes aren't rendered on the map, each entity's position is represented by a hex coordinate. A hex coordinate has 3 components: `q`, `r`, and `s`. The `s` component is calculated as `-q - r`, so there's no need to pass that value around. 

The center of the map is at `{q: 0, r: 0}`. The north and south edge is horizontal. The tile directly north is at `{q: 0, r: -1}` and moving clockwise, the next tiles are: `{q: 1, r: -1}`, `{q: 1, r: 0}`, `{q: 0, r: 1}`, `{q: -1, r: 1}`, and `{q: -1, r: 0}`.

Every unit in the game has a position, which is represented by a hex coordinate.

### World Coordinates

The world coordinate system is a 2D cartesian coordinate system. The origin is at the top left corner of the screen. The x-axis increases to the right and the y-axis increases downwards. The world coordinate system is used for rendering entities to the Phaser Scene. The scene is centered on the screen with `{ x:0, y:0 }` being the center of the screen.

The phaser camera system allows the map to be zoomed and scrolled. To convert between world coordinates and map coordinates, the camera's position and zoom level must be taken into account.

### Screen Coordinates

Finally, the screen coordinate system is the pixel coordinate system of the screen. The screen coordinate system is used for mouse input and rendering text and UI elements via React. The screen coordinate system is the same as the world coordinate system when the camera is at the default position and zoom level.
