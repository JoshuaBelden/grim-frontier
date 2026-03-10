/** A named settlement node in the static world graph. */
export interface TownNode {
  key: string
  name: string
}

/** Classification of a location in the world topology. */
export type LandmarkType = "town" | "outpost" | "crossing"

/** A named location node in the static world graph with type and map position. */
export interface LandmarkNode {
  key: string
  name: string
  type: LandmarkType
  position: { x: number; y: number }
}

/** Classification of a route between two landmarks. */
export type RouteClassification = "road" | "trail"

/** A named connection between two landmarks in the static topology. */
export interface TopologyConnection {
  from: string
  to: string
  name: string
  distance: number
  classification: RouteClassification
}

/** A bounded area within a region, containing landmarks and connections. */
export interface TerritoryNode {
  key: string
  name: string
  towns: TownNode[]
  landmarks: LandmarkNode[]
  connections: TopologyConnection[]
}

/** A geographic zone with a distinct resource profile and one or more territories. */
export interface RegionNode {
  key: string
  name: string
  resourceProfile: Record<string, number>
  territories: TerritoryNode[]
}

/** The complete static world topology — loaded from source, never stored in the database. */
export interface WorldTopology {
  regions: RegionNode[]
}

/** Lifecycle state of a world instance. */
export type WorldStatus = "active" | "paused" | "archived"

/** The current in-world date and time within a simulation. */
export interface InWorldDate {
  year: number
  month: number
  day: number
  hour: number
}

/** A top-level world simulation instance. */
export interface World {
  name: string
  status: WorldStatus
  inWorldDate: InWorldDate
  createdAt: Date
  updatedAt: Date
}

/** A large geographic subdivision of a world. */
export interface Region {
  worldId: string
  name: string
  resourceProfile: Record<string, number>
  createdAt: Date
  updatedAt: Date
}

/** A mid-level geographic subdivision within a region. */
export interface Territory {
  regionId: string
  name: string
  nodeKey: string
  createdAt: Date
  updatedAt: Date
}

/** A named settlement node within a territory. */
export interface Town {
  territoryId: string
  name: string
  nodeKey: string
  type?: LandmarkType
  createdAt: Date
  updatedAt: Date
}
