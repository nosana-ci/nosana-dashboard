import type { NodeJobApi, NodeStreamSubscription } from "@nosana/api";
import { useLatestRequest } from "../useLatestRequest.ts";
import type { TaskStat } from "./types";

export function useStatsStream(
  getJob: () => Promise<NodeJobApi>,
  onData: (stats: TaskStat | TaskStat[]) => void,
) {
  let stream: NodeStreamSubscription | null = null;
  let destroyed = false;
  const attempts = useLatestRequest();

  async function start(): Promise<void> {
    stop();
    if (destroyed) return;
    const attempt = attempts.begin();
    try {
      const job = await getJob();
      if (!attempts.isCurrent(attempt)) return;
      stream = job.streamStats(
        {
          onData: (stats) => {
            if (attempts.isCurrent(attempt)) onData(stats);
          },
          onError: () => {
            if (attempts.isCurrent(attempt)) stop();
          },
        },
        { interval: 5 },
      );
    } catch {
      // Historical polling remains available when streaming cannot connect.
    }
  }

  function stop(): void {
    attempts.cancel();
    stream?.close();
    stream = null;
  }

  function destroy(): void {
    destroyed = true;
    stop();
  }

  return { start, stop, destroy };
}
