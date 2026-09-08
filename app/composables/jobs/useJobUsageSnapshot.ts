import { ref, computed, onUnmounted } from "vue";
import { useKit } from "~/composables/useKit";
import { acquireJobFeeds } from "./useJobFeeds";

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
 * Reads the job's shared stats feed (stream plus a short poll) and keeps
 * only the latest reading per op, with a `connected` flag that is true only
 * while fresh data is arriving — so the caller can hide the usage bars until
 * the node is actually reporting. Holding the feed here also means the job
 * panel finds it already open.
 */
export function useJobUsageSnapshot(jobId: string, deploymentId: string) {
  const { nosana } = useKit();
  const now = useSharedClock();
  const feeds = acquireJobFeeds(nosana.value.api, jobId, deploymentId);
  onUnmounted(feeds.release);

  // Connected = a reading arrived within the last ~20s.
  const connected = computed(
    () =>
      feeds.stats.lastTs.value > 0 &&
      now.value - feeds.stats.lastTs.value < 20000,
  );

  // Aggregate the latest reading across the job's ops.
  const usage = computed(() => {
    const ops = Object.values(feeds.stats.latestByOp.value);
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
