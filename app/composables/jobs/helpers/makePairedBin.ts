import type { TaskStat, Point, Series } from "../types";

export function pairedBin(
  opIds: string[],
  dataByOp: Record<string, TaskStat[]>,
  fieldA: (s: TaskStat) => number,
  fieldB: (s: TaskStat) => number,
): Series[] {
  return opIds.flatMap((id) => {
    const pts = dataByOp[id] ?? [];
    const pointsA: Point[] = [];
    const pointsB: Point[] = [];
    for (const s of pts) {
      const x = s.timestamp;
      pointsA.push({ x, y: fieldA(s) });
      pointsB.push({ x, y: fieldB(s) });
    }
    return [
      { label: id, group: id, points: pointsA },
      { label: id, group: id, points: pointsB, dashed: true },
    ];
  });
}
