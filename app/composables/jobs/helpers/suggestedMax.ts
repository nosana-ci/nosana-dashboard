import type { Series } from "../types";

export function suggestedMax(series: Series[], tiers: number[]): number {
  let peak = 0;
  for (const s of series) {
    for (const p of s.points) {
      if (p.y > peak) peak = p.y;
    }
  }
  return tiers.find((t) => peak <= t) ?? peak;
}
