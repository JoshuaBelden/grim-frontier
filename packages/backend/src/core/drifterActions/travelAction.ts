import type { InWorldDate } from "@grim-frontier/shared"
import { npcs, towns } from "../../models/collections.js"
import type { DrifterAction, DrifterActionContext } from "./types.js"

/** Converts an InWorldDate to an absolute hour count for duration comparisons. */
export function toAbsoluteHour(date: InWorldDate): number {
  return ((date.year * 12 + (date.month - 1)) * 31 + (date.day - 1)) * 24 + date.hour
}

const WALKING_SPEED_MPH = 3
const TRAVEL_FATIGUE_COST = 2

/** NPC travels to a connected landmark. Favored by ambitious, courageous, frontier-origin NPCs. */
export const travelAction: DrifterAction = {
  name: "travel",

  async score(context: DrifterActionContext): Promise<number> {
    const { npc, connectedLandmarks } = context
    if (connectedLandmarks.length === 0) return 0

    const base = 15

    const frontierBonus = npc.origin.background.origin === "frontier" ? 10 : 0
    const willScore = ((npc.nature.outlook.willfulness + 5) / 10) * 15
    const ambitionScore = ((5 - npc.nature.disposition.contentment) / 10) * 15
    const courageScore = ((npc.nature.disposition.courage + 5) / 10) * 10
    const energyScore = ((10 - npc.fatigue) / 10) * 15

    return Math.max(0, base + frontierBonus + willScore + ambitionScore + courageScore + energyScore)
  },

  async execute(context: DrifterActionContext): Promise<void> {
    const { npc, npcId, connectedLandmarks, worldId } = context
    if (connectedLandmarks.length === 0) return

    const destination = connectedLandmarks[Math.floor(Math.random() * connectedLandmarks.length)]
    const travelHours = Math.ceil(destination.connection.distance / WALKING_SPEED_MPH)

    const destinationTown = await towns.findOne({ nodeKey: destination.landmark.key })
    if (!destinationTown) return

    // We need the current world date to compute arrival time. The NPC's updatedAt reflects
    // the current tick, but we need the InWorldDate. We'll import the clock indirectly via
    // the worldClock module. For now, we store departedHour as 0 and arrivalHour as the
    // travel duration — the drifterAI updater will set the absolute times before saving.
    const travelState = {
      fromLandmarkKey: context.currentLandmark!.key,
      toLandmarkKey: destination.landmark.key,
      toLocationId: destinationTown._id!.toString(),
      toLocationType: "town" as const,
      routeName: destination.connection.name,
      departedHour: 0,
      arrivalHour: travelHours,
      distanceMiles: destination.connection.distance,
    }

    await npcs.updateOne(
      { _id: npc._id },
      {
        $set: {
          status: "travelling" as const,
          travelState,
          fatigue: Math.min(10, npc.fatigue + TRAVEL_FATIGUE_COST),
          updatedAt: new Date(),
        },
        $unset: { locationId: "", locationType: "" },
      },
    )

    console.log(`[drifter] ${npc.name} travelling to ${destination.landmark.name} via ${destination.connection.name} (${travelHours}h)`)
  },
}
