import { ref } from "vue";
import type { NodeJobApi } from "@nosana/api";
import { useLatestRequest } from "../useLatestRequest.ts";
import type { TaskStat, StatsInterval } from "./types";

export function useStatsFetch(
  getJob: () => Promise<NodeJobApi>,
  onData: (stats: TaskStat[]) => void,
) {
  const isLoading = ref(false);
  const requests = useLatestRequest();

  async function fetchHandler(
    interval: StatsInterval,
    seconds: number,
  ): Promise<void> {
    const request = requests.begin();
    isLoading.value = true;

    const now = Date.now();
    const start = now - seconds * 1000;

    try {
      const job = await getJob();
      if (!requests.isCurrent(request)) return;
      const stats = await job.stats({ interval, start, end: now });
      if (requests.isCurrent(request)) onData(stats);
    } catch {
      // A failed range leaves the previously loaded data in place.
    } finally {
      if (requests.isCurrent(request)) isLoading.value = false;
    }
  }

  function abort(): void {
    requests.cancel();
    isLoading.value = false;
  }

  return { isLoading, fetch: fetchHandler, abort };
}
