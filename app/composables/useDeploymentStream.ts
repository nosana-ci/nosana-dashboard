import type {
  Deployment,
  DeploymentStreamEvent,
  DeploymentStreamSubscription,
} from "@nosana/api";

export type { DeploymentStreamEvent };

interface DeploymentStreamDeps {
  applyEvent: (event: DeploymentStreamEvent) => void;
  refresh: () => Promise<void>;
}

/**
 * Keeps the page in step with a deployment's stream.
 *
 * The kit owns the connection; what belongs here is how often the page reacts
 * to it. A frame carries only what changed, so the canonical data is refetched
 * alongside it — coalesced, because a burst of frames would otherwise mean a
 * burst of identical requests.
 */
export function useDeploymentStream(deps: DeploymentStreamDeps) {
  let subscription: DeploymentStreamSubscription | null = null;
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;
  let refreshing = false;
  let refreshQueued = false;

  const flushRefresh = async () => {
    refreshTimer = null;
    refreshing = true;
    try {
      do {
        refreshQueued = false;
        await deps.refresh().catch(() => {});
      } while (refreshQueued);
    } finally {
      refreshing = false;
    }
  };

  const queueRefresh = () => {
    refreshQueued = true;
    if (!refreshing && !refreshTimer) {
      refreshTimer = setTimeout(flushRefresh, 50);
    }
  };

  const stop = () => {
    subscription?.close();
    subscription = null;
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = null;
    refreshQueued = false;
  };

  const start = (deployment: Deployment) => {
    stop();

    const applyThenRefresh = (event: DeploymentStreamEvent) => {
      deps.applyEvent(event);
      queueRefresh();
    };

    subscription = deployment.stream({
      // Every open is a resynchronisation point, reconnects included.
      onOpen: queueRefresh,
      onDeployment: applyThenRefresh,
      onJob: applyThenRefresh,
      // Neither is held in page state; they are read back with the refresh.
      onEvent: queueRefresh,
      onTask: queueRefresh,
    });
  };

  return { start, stop };
}
