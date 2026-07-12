import type { Deployment } from "@nosana/kit";

export interface DeploymentPollingDeps {
  deployment: Ref<Deployment | null>;
  activeTab: Ref<string>;
  hasActiveJobs: ComputedRef<boolean>;
  loadDeployment: (silent?: boolean) => Promise<void>;
  loadJobs: (silent?: boolean) => Promise<void>;
  loadEvents: (silent?: boolean) => Promise<void>;
  loadTasks: (silent?: boolean) => Promise<void>;
}

export function useDeploymentPolling(deps: DeploymentPollingDeps) {
  const pollingTimeout = ref<NodeJS.Timeout | null>(null);
  const pollingConfig = {
    normal: 10000,
    fast: 2000,
  };

  // Debug refs (kept for potential future use)
  const statusPollingInterval = ref<NodeJS.Timeout | null>(null);
  const jobPollingInterval = ref<NodeJS.Timeout | null>(null);

  const adaptivePollingState = ref<{
    isFastPolling: boolean;
    expectedStatus?: string;
    fastPollStartTime?: number;
  }>({
    isFastPolling: false,
  });

  const pollingDebug = ref({
    statusPollingActive: false,
    jobPollingActive: false,
    lastStatusPoll: null as Date | null,
    lastJobPoll: null as Date | null,
  });

  const stopAllPolling = () => {
    if (pollingTimeout.value) {
      clearTimeout(pollingTimeout.value);
      pollingTimeout.value = null;
    }
    pollingDebug.value.statusPollingActive = false;
    pollingDebug.value.jobPollingActive = false;
  };

  const startUnifiedPolling = (intervalMs = pollingConfig.normal) => {
    stopAllPolling();

    pollingDebug.value.statusPollingActive = true;
    pollingDebug.value.jobPollingActive = true;

    const poll = async () => {
      if (!deps.deployment.value) {
        pollingTimeout.value = setTimeout(poll, intervalMs);
        return;
      }

      pollingDebug.value.lastStatusPoll = new Date();
      pollingDebug.value.lastJobPoll = new Date();

      await deps.loadDeployment(true);
      await deps.loadJobs(true);
      if (deps.activeTab.value === "events") {
        await deps.loadEvents(true);
        await deps.loadTasks(true);
      }

      const currentStatus = (deps.deployment.value?.status || "").toUpperCase();

      // For fast polling: keep it active for at least 30 seconds
      if (
        adaptivePollingState.value.isFastPolling &&
        adaptivePollingState.value.fastPollStartTime
      ) {
        const elapsed =
          Date.now() - adaptivePollingState.value.fastPollStartTime;

        const minDuration = adaptivePollingState.value.expectedStatus
          ? 10000
          : 30000;

        if (elapsed >= minDuration) {
          const expectedReached =
            adaptivePollingState.value.expectedStatus &&
            currentStatus ===
              adaptivePollingState.value.expectedStatus.toUpperCase();

          if (expectedReached || !adaptivePollingState.value.expectedStatus) {
            adaptivePollingState.value.isFastPolling = false;
            adaptivePollingState.value.expectedStatus = undefined;
            adaptivePollingState.value.fastPollStartTime = undefined;
            startUnifiedPolling(pollingConfig.normal);
            return;
          }
        }
      }

      const finalStates = ["STOPPED", "ARCHIVED", "ERROR"];
      if (finalStates.includes(currentStatus) && !deps.hasActiveJobs.value) {
        stopAllPolling();
        return;
      }

      pollingTimeout.value = setTimeout(poll, intervalMs);
    };

    pollingTimeout.value = setTimeout(poll, intervalMs);
  };

  // Legacy helpers for compatibility
  const startTasksPolling = () => startUnifiedPolling();
  const stopTasksPolling = () => {};
  const startDeploymentPolling = (intervalMs?: number) =>
    startUnifiedPolling(intervalMs);
  const stopDeploymentPolling = () => {};
  const startJobPolling = (intervalMs?: number) =>
    startUnifiedPolling(intervalMs);
  const stopJobPolling = () => {};

  // Start fast polling after an action that expects a state change
  const startFastPolling = (expectedStatus?: string) => {
    adaptivePollingState.value = {
      isFastPolling: true,
      expectedStatus,
      fastPollStartTime: Date.now(),
    };

    startUnifiedPolling(pollingConfig.fast);
  };

  return {
    pollingTimeout,
    pollingConfig,
    pollingDebug,
    adaptivePollingState,
    statusPollingInterval,
    jobPollingInterval,
    stopAllPolling,
    startUnifiedPolling,
    startFastPolling,
    startTasksPolling,
    stopTasksPolling,
    startDeploymentPolling,
    stopDeploymentPolling,
    startJobPolling,
    stopJobPolling,
  };
}
