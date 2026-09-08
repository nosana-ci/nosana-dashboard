import {
  ref,
  shallowRef,
  computed,
  onUnmounted,
  triggerRef,
} from "vue";
import { useRuntimeConfig } from "#imports";
import type { TaskStat } from "./types";
import { STATS_INTERVALS } from "./types";
import { intervalForRange } from "./helpers/intervalForRange";
import { insertStat } from "./helpers/insertStat";
import { useStatsFetch } from "./useStatsFetch";
import { useStatsStream } from "./useStatsStream";

export function useSystemUsage(
  jobId: string,
  node: string,
  opIds: string[],
) {
  const config = useRuntimeConfig();
  const { getAuthHeader } = useDeploymentAuth();

  const timeframe = ref(STATS_INTERVALS[0] * 60);
  const rawData = shallowRef<Record<string, TaskStat[]>>({});
  const nodeUrl = `https://${node}.${config.public.nodeDomain}`;

  function ingest(stats: TaskStat | TaskStat[]): void {
    const items = Array.isArray(stats) ? stats : [stats];
    for (const s of items) insertStat(rawData.value, s);
    triggerRef(rawData);
  }

  const { isLoading, fetch: fetchRange, abort: abortFetch } = useStatsFetch(
    nodeUrl, jobId, getAuthHeader, (stats) => ingest(stats),
  );

  const { start: startStream, destroy: destroyStream } = useStatsStream(
    nodeUrl, jobId, getAuthHeader, (stat) => ingest(stat),
  );

  const windowedByOp = computed(() => {
    const latest = opIds.reduce((max, id) => {
      const pts = rawData.value[id];
      const last = pts?.[pts.length - 1]?.timestamp ?? 0;
      return last > max ? last : max;
    }, 0);
    const start = latest - timeframe.value * 1000;

    const result: Record<string, TaskStat[]> = {};
    for (const id of opIds) {
      const all = rawData.value[id] ?? [];
      result[id] = all.filter((s) => s.timestamp >= start);
    }
    return result;
  });

  function setTimeframe(seconds: number): void {
    timeframe.value = seconds;
    fetchRange(intervalForRange(seconds * 1000), seconds);
  }

  async function init(): Promise<void> {
    const seconds = timeframe.value;
    await fetchRange(intervalForRange(seconds * 1000), seconds);
    await startStream();
  }

  init().catch(() => { });

  onUnmounted(() => {
    abortFetch();
    destroyStream();
    rawData.value = {};
  });

  return {
    windowedByOp,
    isLoading,
    timeframe,
    setTimeframe,
  };
}
