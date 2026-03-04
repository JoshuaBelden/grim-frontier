import type { Resources } from "./camp"

/** The type of chore an NPC can be assigned at a camp. */
export type ChoreType = "food_gathering" | "supply_scavenging" | "patrol" | "camp_maintenance" | "trade_run"

/** The current lifecycle state of an assigned task. */
export type TaskStatus = "pending" | "in_progress" | "completed" | "failed"

/** An NPC-assigned chore that runs over time and yields resources on completion. */
export interface Task {
  worldId: string
  campId: string
  npcId: string
  type: ChoreType
  status: TaskStatus
  startedAt: Date
  completesAt: Date
  rewardResources?: Partial<Resources>
  createdAt: Date
  updatedAt: Date
}
