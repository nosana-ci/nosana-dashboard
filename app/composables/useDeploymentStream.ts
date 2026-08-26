import type {
  Deployment,
  DeploymentStreamEvent,
  DeploymentStreamSubscription,
} from "@nosana/api";

export type { DeploymentStreamEvent };

/**
 * Refetches the canonical record behind one kind of frame. A frame carries only
 * what changed, so the record it belongs to is read back alongside it — but
 * only that record: a job changing state says nothing about the event log.
 */
export interface DeploymentRefreshers {
  deployment: () => Promise<void>;
  jobs: () => Promise<void>;
  events: () => Promise<void>;
  tasks: () => Promise<void>;
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
        await task().catch(() => {});
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
    deployment: coalesce(() => deps.refresh.deployment()),
    jobs: coalesce(() => deps.refresh.jobs()),
    events: coalesce(() => deps.refresh.events()),
    tasks: coalesce(() => deps.refresh.tasks()),
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
      // says nothing about what was missed while it was down.
      onOpen: () => Object.values(refresh).forEach((r) => r.request()),
      onDeployment: (event) => {
        deps.applyEvent(event);
        // The frame carries status and replicas; endpoints and active_jobs
        // only come back with the record.
        refresh.deployment.request();
      },
      onJob: (event) => {
        deps.applyEvent(event);
        refresh.jobs.request();
      },
      onEvent: () => refresh.events.request(),
      onTask: () => refresh.tasks.request(),
    });
  };

  return { start, stop };
}
