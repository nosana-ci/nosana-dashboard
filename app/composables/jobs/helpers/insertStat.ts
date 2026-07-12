import type { TaskStat } from "../types";

export function insertStat(
  record: Record<string, TaskStat[]>,
  stat: TaskStat,
): void {
  const arr = (record[stat.opId] ??= []);
  if (arr.length > 0 && arr[arr.length - 1]!.timestamp === stat.timestamp) return;
  arr.push(stat);
}
