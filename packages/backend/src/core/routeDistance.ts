import topology from "./topology.js"

/** Finds the shortest topology distance between two landmark keys, or null if no path exists. */
export function findDistance(fromKey: string, toKey: string): { distance: number; routeName: string } | null {
  for (const region of topology.regions) {
    for (const territory of region.territories) {
      // Direct connection
      for (const connection of territory.connections) {
        if (
          (connection.from === fromKey && connection.to === toKey) ||
          (connection.to === fromKey && connection.from === toKey)
        ) {
          return { distance: connection.distance, routeName: connection.name }
        }
      }

      // Two-hop path through an intermediate landmark
      const fromConnections = territory.connections.filter(
        connection => connection.from === fromKey || connection.to === fromKey,
      )
      for (const first of fromConnections) {
        const midKey = first.from === fromKey ? first.to : first.from
        for (const second of territory.connections) {
          if (
            (second.from === midKey && second.to === toKey) ||
            (second.to === midKey && second.from === toKey)
          ) {
            return { distance: first.distance + second.distance, routeName: `${first.name} → ${second.name}` }
          }
        }
      }
    }
  }
  return null
}
