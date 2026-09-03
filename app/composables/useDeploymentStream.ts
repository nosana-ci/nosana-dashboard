import type {
  Deployment,
  DeploymentStreamEvent,
  DeploymentStreamSubscription,
} from "@nosana/api";

export type { DeploymentStreamEvent };

/**
 * Read-back the stream can't cover on its own.
 *
 * Every frame carries its whole record, so all live state — deployment,
 * endpoints, events, tasks, and the job list (job frames include revision and
 * created_at) — is applied in place, and `active_jobs` is derived from the live
 * job states. The only things a frame never describes are the History tab
 * (server-paginated) and an open job subpage (its own polling is disabled under
 * the parent), so those are read back once on (re)connect.
 */
export interface DeploymentRefreshers {
  jobs: () => Promise<void>;
}

interface DeploymentStreamDeps {
  applyEvent: (event: DeploymentStreamEvent) => void;
  refresh: DeploymentRefreshers;
}

/**
 * Runs `task`, never concurrently, and at most once per window. A request made
 * while one is running is honoured after it rather than dropped, so the last
 * frame is always reflected.
 */
function coalesce(task: () => Promise<void>) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let queued = false;

  const flush = async () => {
    timer = null;
    running = true;
    try {
      do {
        queued = false;
        await task().catch(() => { });
      } while (queued);
    } finally {
      running = false;
    }
  };

  return {
    request: () => {
      queued = true;
      if (!running && !timer) timer = setTimeout(flush, 50);
    },
    cancel: () => {
      if (timer) clearTimeout(timer);
      timer = null;
      queued = false;
    },
  };
}

/**
 * Keeps the page in step with a deployment's stream.
 *
 * The kit owns the connection; what belongs here is how the page reacts to it —
 * which record each frame invalidates, and how often to act on a burst of them.
 */
export function useDeploymentStream(deps: DeploymentStreamDeps) {
  let subscription: DeploymentStreamSubscription | null = null;

  const refresh = {
    jobs: coalesce(() => deps.refresh.jobs()),
  };

  const stop = () => {
    subscription?.close();
    subscription = null;
    Object.values(refresh).forEach((r) => r.cancel());
  };

  const start = (deployment: Deployment) => {
    stop();

    subscription = deployment.stream({
      // An open is a resynchronisation point, reconnects included: the stream
      // says nothing about what was missed while it was down. It replays the
      // deployment, its active-jobs snapshot, the per-job frames, tasks and
      // endpoints — all applied directly — so only the History tab and the open
      // job subpage still need a read-back here.
      onOpen: () => refresh.jobs.request(),
      // Every frame carries what its record needs (or, for a job, enough to
      // update the live list in place), so apply them all directly — no
      // per-frame read-back.
      onDeployment: (event) => deps.applyEvent(event),
      onJob: (event) => deps.applyEvent(event),
      // Authoritative active-jobs snapshot, sent once on open before the per-job
      // frames, so a stale "Running" row can be pruned.
      onJobs: (event) => deps.applyEvent(event),
      onEndpoint: (event) => deps.applyEvent(event),
      onEvent: (event) => deps.applyEvent(event),
      onTask: (event) => deps.applyEvent(event),
    });
  };

  return { start, stop };
}
