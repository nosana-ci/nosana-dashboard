import {
  computed,
  ref,
  shallowRef,
  triggerRef,
  type ComputedRef,
  type Ref,
  type ShallowRef,
} from "vue";
import type {
  NodeJobApi,
  NodeJobInfo,
  NodeStreamSubscription,
  NosanaApiClient,
} from "@nosana/api";
import { getNodeJob } from "~/utils/kitJobAccess";
import { MAX_WINDOW_MS, type TaskStat } from "./types";

/**
 * One set of live node connections per running job, shared by everything that
 * shows the job: the usage strip on the deployment page, the charts and the
 * containers in the job panel. The first holder opens the streams, the last
 * one to let go closes them, so a job that stops running (its row leaves the
 * page) drops its connections at once.
 */

const STREAM_INTERVAL_S = 5;
const RECENT_POLL_MS = 8000;
const RECENT_WINDOW_S = 30;

export interface StatsFeed {
  /** Readings per operation, oldest first, within the last 24 hours. */
  series: ShallowRef<Record<string, TaskStat[]>>;
  latestByOp: ComputedRef<Record<string, TaskStat>>;
  /** Wall-clock time of the last reading; 0 before any arrived. */
  lastTs: Ref<number>;
  /** Merge readings from any source (stream, poll, a range fetch). */
  ingest(stats: TaskStat | TaskStat[]): void;
}

export interface InfoFeed {
  latest: ShallowRef<NodeJobInfo | null>;
  subscribe(onFrame: (frame: NodeJobInfo) => void): () => void;
}

export interface JobFeeds {
  stats: StatsFeed;
  info: InfoFeed;
  release(): void;
}

interface Channel {
  api: NosanaApiClient;
  jobId: string;
  deploymentId?: string;
  holds: number;
  generation: number;
  stats: StatsFeed;
  info: InfoFeed;
  infoListeners: Set<(frame: NodeJobInfo) => void>;
  statsStream: NodeStreamSubscription | null;
  infoStream: NodeStreamSubscription | null;
  poll: ReturnType<typeof setInterval> | null;
}

const channels = new Map<string, Channel>();

/** Insert by timestamp, once per timestamp, so stream and history can mix. */
function mergeStat(list: TaskStat[], stat: TaskStat): boolean {
  let low = 0;
  let high = list.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (list[mid]!.timestamp < stat.timestamp) low = mid + 1;
    else high = mid;
  }
  if (list[low]?.timestamp === stat.timestamp) return false;
  list.splice(low, 0, stat);
  return true;
}

function createStatsFeed(): StatsFeed {
  const series = shallowRef<Record<string, TaskStat[]>>({});
  const lastTs = ref(0);

  const ingest = (stats: TaskStat | TaskStat[]) => {
    const items = Array.isArray(stats) ? stats : [stats];
    const record = series.value;
    const oldest = Date.now() - MAX_WINDOW_MS;
    let changed = false;
    for (const stat of items) {
      if (!stat?.opId || !stat.timestamp || stat.timestamp < oldest) continue;
      const list = (record[stat.opId] ??= []);
      if (mergeStat(list, stat)) changed = true;
    }
    if (!changed) return;
    for (const list of Object.values(record)) {
      while (list.length && list[0]!.timestamp < oldest) list.shift();
    }
    triggerRef(series);
    lastTs.value = Date.now();
  };

  const latestByOp = computed(() => {
    const latest: Record<string, TaskStat> = {};
    for (const [opId, list] of Object.entries(series.value)) {
      const last = list[list.length - 1];
      if (last) latest[opId] = last;
    }
    return latest;
  });

  return { series, latestByOp, lastTs, ingest };
}

async function start(channel: Channel): Promise<void> {
  const generation = ++channel.generation;
  const live = () => channel.generation === generation && channel.holds > 0;

  let job: NodeJobApi;
  try {
    job = await getNodeJob(channel.api, channel.jobId, channel.deploymentId);
  } catch {
    return;
  }
  if (!live()) return;

  channel.statsStream = job.streamStats(
    {
      onData: (stats) => {
        if (live()) channel.stats.ingest(stats);
      },
      onError: () => {},
    },
    { interval: STREAM_INTERVAL_S },
  );

  channel.infoStream = job.streamInfo({
    onData: (frame) => {
      if (!live()) return;
      channel.info.latest.value = frame;
      for (const listener of channel.infoListeners) listener(frame);
    },
    onError: () => {},
  });

  // Some nodes stream sparsely; a short poll keeps the latest reading fresh.
  const pull = async () => {
    try {
      const end = Date.now();
      const stats = await job.stats({
        interval: STREAM_INTERVAL_S,
        start: end - RECENT_WINDOW_S * 1000,
        end,
      });
      if (live()) channel.stats.ingest(stats);
    } catch {
      // The stream still delivers; the next poll retries.
    }
  };
  void pull();
  channel.poll = setInterval(pull, RECENT_POLL_MS);
}

function stop(channel: Channel): void {
  channel.generation++;
  channel.statsStream?.close();
  channel.infoStream?.close();
  channel.statsStream = null;
  channel.infoStream = null;
  if (channel.poll) clearInterval(channel.poll);
  channel.poll = null;
}

function createChannel(
  api: NosanaApiClient,
  jobId: string,
  deploymentId?: string,
): Channel {
  const infoListeners = new Set<(frame: NodeJobInfo) => void>();
  return {
    api,
    jobId,
    deploymentId,
    holds: 0,
    generation: 0,
    stats: createStatsFeed(),
    info: {
      latest: shallowRef<NodeJobInfo | null>(null),
      subscribe: (onFrame) => {
        infoListeners.add(onFrame);
        return () => {
          infoListeners.delete(onFrame);
        };
      },
    },
    infoListeners,
    statsStream: null,
    infoStream: null,
    poll: null,
  };
}

/**
 * Hold the job's live feeds. Call `release()` when done; the streams close
 * once nobody holds them and the feed data is dropped with them.
 */
export function acquireJobFeeds(
  api: NosanaApiClient,
  jobId: string,
  deploymentId?: string,
): JobFeeds {
  const key = `${deploymentId ?? ""}:${jobId}`;
  const existing = channels.get(key);
  const channel = existing ?? createChannel(api, jobId, deploymentId);
  if (!existing) {
    channels.set(key, channel);
  } else if (channel.api !== api) {
    // A new session signs differently; reconnect with it.
    channel.api = api;
    stop(channel);
    if (channel.holds > 0 && import.meta.client) void start(channel);
  }

  channel.holds++;
  if (channel.holds === 1 && import.meta.client) void start(channel);

  let released = false;
  return {
    stats: channel.stats,
    info: channel.info,
    release() {
      if (released) return;
      released = true;
      channel.holds--;
      if (channel.holds <= 0) {
        stop(channel);
        channels.delete(key);
      }
    },
  };
}
