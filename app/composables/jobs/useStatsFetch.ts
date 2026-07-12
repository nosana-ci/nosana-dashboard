import { ref } from "vue";
import type { TaskStat, StatsInterval } from "./types";

export function useStatsFetch(
  baseUrl: string,
  jobId: string,
  getAuth: () => Promise<string>,
  onData: (stats: TaskStat[]) => void,
) {
  const isLoading = ref(false);
  let abortController: AbortController | null = null;

  async function fetchHandler(interval: StatsInterval, seconds: number): Promise<void> {
    abort(true);
    isLoading.value = true;

    const now = Date.now();
    const start = now - seconds * 1000;

    try {
      const auth = await getAuth();
      const url = `${baseUrl}/job/${jobId}/stats?interval=${interval}&start=${start}&end=${now}`;
      const res = await fetch(url, {
        headers: { authorization: auth },
        signal: abortController!.signal,
      });

      if (!res.ok) return;

      const stats: TaskStat[] = await res.json();
      onData(stats);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    } finally {
      abortController = null;
      isLoading.value = false;
    }
  }

  function abort(refresh?: boolean): void {
    if (abortController) abortController.abort();
    abortController = refresh ? new AbortController() : null;
  }

  return { isLoading, fetch: fetchHandler, abort };
}
