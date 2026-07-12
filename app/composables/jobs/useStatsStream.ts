import { EventSourcePolyfill, type MessageEvent as PolyfillMessageEvent } from "event-source-polyfill";
import type { TaskStat } from "./types";

export function useStatsStream(
  baseUrl: string,
  jobId: string,
  getAuth: () => Promise<string>,
  onData: (stat: TaskStat) => void,
) {
  let sse: EventSourcePolyfill | null = null;
  let destroyed = false;

  async function start(): Promise<void> {
    stop();
    if (destroyed) return;

    try {
      const auth = await getAuth();

      const url = `${baseUrl}/job/${jobId}/stats/stream?interval=5`;
      const es = new EventSourcePolyfill(url, {
        headers: { Authorization: auth },
      });

      es.onopen = () => {
        if (destroyed) es.close();
      };

      es.onmessage = (event: PolyfillMessageEvent) => {
        if (destroyed) {
          es.close();
          return;
        }

        try {
          const stat: TaskStat = JSON.parse(event.data);
          if (stat?.timestamp && stat?.opId) {
            onData(stat);
          }
        } catch {
          /* ignore non-JSON heartbeats */
        }
      };

      es.onerror = () => {
        stop();
      };

      sse = es;
    } catch {
      /* stream failed — historical data still works */
    }
  }

  function stop(): void {
    if (sse === null) return;
    sse.close();
    sse = null;
  }

  function destroy(): void {
    destroyed = true;
    stop();
  }

  return { start, stop, destroy };
}
