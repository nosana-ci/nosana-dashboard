import { ref, shallowRef, computed, onUnmounted } from "vue";
import { useRuntimeConfig } from "#imports";
import type { TaskStat } from "./types";
import { useStatsFetch } from "./useStatsFetch";
import { useStatsStream } from "./useStatsStream";

// One shared 5s clock for every usage strip (used only to re-evaluate the
// `connected` freshness flag), ref-counted so it ticks only while at least one
// strip is mounted — rather than a separate timer per running job row.
const sharedNow = ref(Date.now());
let clockSubscribers = 0;
let clockTimer: ReturnType<typeof setInterval> | null = null;

function useSharedClock() {
  if (import.meta.client) {
    clockSubscribers += 1;
    if (!clockTimer) {
      clockTimer = setInterval(() => {
        sharedNow.value = Date.now();
      }, 5000);
    }
    onUnmounted(() => {
      clockSubscribers -= 1;
      if (clockSubscribers <= 0 && clockTimer) {
        clearInterval(clockTimer);
        clockTimer = null;
      }
    });
  }
  return sharedNow;
}

/**
 * Lightweight per-job live usage snapshot for the deployment job list.
 *
 * Polls the node's recent stats (`/job/{id}/stats`, the same reliable source the
 * job page uses) and also opens the 5s SSE stream for finer updates. Keeps only
 * the latest reading per op and exposes a `connected` flag that is true only
 * while fresh data is arriving — so the caller can hide the usage bars until the
 * node is actually reporting.
 */
export function useJobUsageSnapshot(jobId: string, node: string) {
  const config = useRuntimeConfig();
  const { getAuthHeader } = useDeploymentAuth();
  const nodeUrl = `https://${node}.${config.public.nodeDomain}`;

  const latestByOp = shallowRef<Record<string, TaskStat>>({});
  const lastTs = ref(0);
  const now = useSharedClock();

  // Merge in a reading only if it's newer than what we hold for that op.
  function ingest(stats: TaskStat | TaskStat[]): void {
    const items = Array.isArray(stats) ? stats : [stats];
    const next = { ...latestByOp.value };
    let changed = false;
    for (const s of items) {
      if (!s?.opId || !s?.timestamp) continue;
      const prev = next[s.opId];
      if (!prev || s.timestamp >= prev.timestamp) {
        next[s.opId] = s;
        changed = true;
      }
    }
    if (changed) {
      latestByOp.value = next;
      lastTs.value = Date.now();
    }
  }

  const { fetch: fetchRecent, abort } = useStatsFetch(
    nodeUrl,
    jobId,
    getAuthHeader,
    (stats) => ingest(stats),
  );

  const { start: startStream, destroy: destroyStream } = useStatsStream(
    nodeUrl,
    jobId,
    getAuthHeader,
    (stat) => ingest(stat),
  );

  let poll: ReturnType<typeof setInterval> | null = null;

  if (import.meta.client) {
    // Reliable path: pull the last ~30s of stats now and every 8s.
    const pull = () => fetchRecent(5, 30).catch(() => {});
    pull();
    poll = setInterval(pull, 8000);
    // Real-time bonus (may be quiet on some nodes; the poll covers it).
    startStream().catch(() => {});
  }

  onUnmounted(() => {
    if (poll) clearInterval(poll);
    abort();
    destroyStream();
  });

  // Connected = a reading arrived within the last ~20s.
  const connected = computed(
    () => lastTs.value > 0 && now.value - lastTs.value < 20000,
  );

  // Aggregate the latest reading across the job's ops.
  const usage = computed(() => {
    const ops = Object.values(latestByOp.value);
    if (ops.length === 0) return null;

    let cpu = 0;
    let memUsage = 0;
    let memLimit = 0;
    let rx = 0;
    let tx = 0;

    for (const s of ops) {
      cpu += s.cpu?.cpu_percent ?? 0;
      memUsage += s.memory?.memory_usage ?? 0;
      memLimit = Math.max(memLimit, s.memory?.memory_limit ?? 0);
      rx += s.network?.received ?? 0;
      tx += s.network?.sent ?? 0;
    }

    return {
      cpu,
      memUsage,
      memLimit,
      memPercent: memLimit > 0 ? (memUsage / memLimit) * 100 : 0,
      rx,
      tx,
    };
  });

  return { connected, usage };
}
