import type { StatsInterval } from "../types";
import { STATS_INTERVALS } from "../types";

const THRESHOLDS: [number, StatsInterval][] = [
  [5 * 60_000, STATS_INTERVALS[0]],     // ≤5m  → 5s
  [15 * 60_000, STATS_INTERVALS[1]],    // ≤15m → 10s
  [30 * 60_000, STATS_INTERVALS[2]],    // ≤30m → 30s
  [60 * 60_000, STATS_INTERVALS[3]],    // ≤1h  → 60s
  [6 * 3_600_000, STATS_INTERVALS[4]],  // ≤6h  → 300s
  [24 * 3_600_000, STATS_INTERVALS[5]], // ≤24h → 1800s
];

export function intervalForRange(rangeMs: number): StatsInterval {
  for (const [threshold, interval] of THRESHOLDS) {
    if (rangeMs <= threshold) return interval;
  }
  return STATS_INTERVALS[0];
}
