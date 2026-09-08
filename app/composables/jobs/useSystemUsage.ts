import { ref, computed, onUnmounted } from "vue";
import { useKit } from "~/composables/useKit";
import { useNodeJobResolver } from "./useNodeJobResolver";
import type { TaskStat } from "./types";
import { STATS_INTERVALS } from "./types";
import { intervalForRange } from "./helpers/intervalForRange";
import { useStatsFetch } from "./useStatsFetch";
import { acquireJobFeeds } from "./useJobFeeds";

export function useSystemUsage(
  jobId: string,
  opIds: string[],
  deploymentId?: string,
) {
  const { nosana } = useKit();
  const getJob = useNodeJobResolver(jobId, deploymentId);

  // The live readings come from the job's shared feed, which the deployment
  // page may already be holding, so the charts have recent data at once.
  const feeds = acquireJobFeeds(nosana.value.api, jobId, deploymentId);
  const rawData = feeds.stats.series;

  const timeframe = ref(STATS_INTERVALS[0] * 60);

  // History for the chosen window is fetched into the same feed.
  const { isLoading, fetch: fetchRange, abort: abortFetch } = useStatsFetch(
    getJob,
    feeds.stats.ingest,
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

  fetchRange(intervalForRange(timeframe.value * 1000), timeframe.value).catch(
    () => {},
  );

  onUnmounted(() => {
    abortFetch();
    feeds.release();
  });

  return {
    windowedByOp,
    isLoading,
    timeframe,
    setTimeframe,
  };
}
