import type { DeploymentJobItem, DeploymentEventItem } from "@nosana/api";
import type { Deployment } from "@nosana/kit";
import type { DeploymentJob as ApiDeploymentJob } from "@nosana/api";
import type { ResultsSection } from "~/composables/jobs/types";
import { useTimestamp } from "@vueuse/core";
import { useKit } from "~/composables/useKit";

type DeploymentJob = DeploymentJobItem;

export interface DeploymentJobsDeps {
  deployment: Ref<Deployment | null>;
  deploymentJobs: Ref<DeploymentJobItem[]>;
  deploymentEventsData: Ref<DeploymentEventItem[]>;
  jobStates: Ref<Record<string, number>>;
  allJobsData: Ref<Record<string, any>>;
  jobStateStringToNumber: (state: string | number | undefined) => number;
}

export function useDeploymentJobs(deps: DeploymentJobsDeps) {
  const { nosana } = useKit();

  // Pagination
  const jobsPerPage = 10;
  const activeJobsPage = ref(1);
  const historicalJobsPage = ref(1);
  const logsJobsPage = ref(1);

  // Log selection
  const activeLogsJobId = ref<string | null>(null);
  const userSelectedJob = ref(false);
  const jobActivityTab = ref("active");

  // Completed job results
  const completedJobResults = ref<Record<string, ResultsSection | null>>({});
  const loadingJobResults = ref<Record<string, boolean>>({});

  // Running job duration
  const nowTs = useTimestamp({ interval: 1000 });

  const firstRunningJobId = computed<string | null>(() => {
    const entries = Object.entries(deps.jobStates.value || {});
    const running = entries.find(([_id, st]) => st === 1);
    return running ? running[0] : null;
  });

  const runningJobDurationSeconds = computed<number | null>(() => {
    const jobId = firstRunningJobId.value;
    if (!jobId) return null;

    const jobData = deps.allJobsData.value[jobId];
    if (!jobData) return null;

    const timeStart = jobData.timeStart || jobData.time_start;
    if (!timeStart || timeStart === 0) return null;

    const state = jobData.state;
    const isRunning =
      state === 1 ||
      (typeof state === "string" && String(state).toUpperCase() === "RUNNING");
    if (!isRunning) return null;

    return Math.max(0, Math.floor(nowTs.value / 1000) - timeStart);
  });

  const getJobDuration = (jobId: string): number | null => {
    const jobState = deps.jobStates.value[jobId];
    const jobData = deps.allJobsData.value[jobId];

    const timeStart = jobData?.timeStart || jobData?.time_start;
    if (!timeStart) return null;

    const timeEnd =
      jobData?.timeEnd ||
      jobData?.time_end ||
      jobData?.timeFinished ||
      jobData?.time_finished;

    if (timeEnd && jobState !== undefined && jobState >= 2) {
      return Math.max(0, timeEnd - timeStart);
    }

    if (jobState === 1) {
      return Math.max(0, Math.floor(nowTs.value / 1000) - timeStart);
    }

    return null;
  };

  // Helper to get numeric state from a job
  const getJobStateNumber = (job: DeploymentJob): number => {
    return deps.jobStateStringToNumber(job.state);
  };

  // Job list computed properties
  const activeJobs = computed((): DeploymentJob[] => {
    const jobs = deps.deploymentJobs.value || [];
    return jobs.filter((job) => {
      const state = getJobStateNumber(job);
      return state === 0 || state === 1;
    });
  });

  const allHistoricalJobs = computed((): DeploymentJob[] => {
    const jobs = deps.deploymentJobs.value || [];
    return jobs.filter((job) => {
      const state = getJobStateNumber(job);
      return state === 2 || state === 3;
    });
  });

  const historicalJobs = computed((): DeploymentJob[] => {
    const all = allHistoricalJobs.value;
    const start = (historicalJobsPage.value - 1) * jobsPerPage;
    const end = start + jobsPerPage;
    return all.slice(start, end);
  });

  const historicalJobsTotalPages = computed(() => {
    return Math.ceil(allHistoricalJobs.value.length / jobsPerPage);
  });

  const totalJobs = computed(
    () => activeJobs.value.length + allHistoricalJobs.value.length,
  );

  const allJobsForLogs = computed(() => {
    const all = [...activeJobs.value, ...allHistoricalJobs.value];
    return [...all].sort((a, b) => {
      const aTime = (a as any).created_at
        ? new Date((a as any).created_at).getTime()
        : 0;
      const bTime = (b as any).created_at
        ? new Date((b as any).created_at).getTime()
        : 0;
      return bTime - aTime;
    });
  });

  const allJobs = computed(() => {
    const all = allJobsForLogs.value;
    const start = (logsJobsPage.value - 1) * jobsPerPage;
    const end = start + jobsPerPage;
    return all.slice(start, end);
  });

  const logsJobsTotalPages = computed(() => {
    return Math.ceil(allJobsForLogs.value.length / jobsPerPage);
  });

  // Job helper functions
  const isActiveJob = (jobId: string): boolean => {
    return activeJobs.value.some((job) => job.job === jobId);
  };

  const isCompletedJob = (jobId: string): boolean => {
    return historicalJobs.value.some((job) => job.job === jobId);
  };

  const getJobData = (jobId: string) => {
    return allJobs.value.find((job) => job.job === jobId);
  };

  // Fetch results for a completed job
  const fetchJobResults = async (jobId: string) => {
    if (
      !isCompletedJob(jobId) ||
      !deps.deployment.value?.id ||
      completedJobResults.value[jobId] !== undefined
    )
      return;

    loadingJobResults.value[jobId] = true;
    try {
      const dep = await nosana.value.api.deployments.get(
        deps.deployment.value.id,
      );
      const jobResponse = (await dep.getJob(jobId)) as ApiDeploymentJob;
      const jobResult = jobResponse?.jobResult;

      if (!jobResult) {
        completedJobResults.value[jobId] = null;
        return;
      }

      completedJobResults.value[jobId] = jobResult as ResultsSection;
    } catch (error) {
      console.error(`Failed to fetch results for job ${jobId}:`, error);
      const errorDetails = error as {
        status?: number;
        statusText?: string;
        message?: string;
        data?: any;
        response?: any;
      };
      if (errorDetails.status === 500) {
        console.error(
          `Backend returned 500 for job ${jobId}. This is a backend schema validation error - the jobResult doesn't match the expected schema. Error:`,
          errorDetails.message || errorDetails.data,
        );
      }
      completedJobResults.value[jobId] = null;
    } finally {
      loadingJobResults.value[jobId] = false;
    }
  };

  // Select job for logs display
  const selectJobForLogs = async (
    job: DeploymentJob,
    isUserSelection = false,
  ) => {
    activeLogsJobId.value = job.job;
    if (isUserSelection) {
      userSelectedJob.value = true;
    }

    if (isCompletedJob(job.job)) {
      await fetchJobResults(job.job);
    }
  };

  // Deployment endpoints
  const deploymentEndpoints = computed(() => {
    if (!deps.deployment.value?.endpoints) return [];

    return (
      deps.deployment.value.endpoints as {
        opId: string;
        port: number | string;
        url: string;
      }[]
    ).map((endpoint) => ({
      opId: endpoint.opId,
      port: endpoint.port,
      url: endpoint.url,
    }));
  });

  // All deployment events
  const deploymentEvents = computed(() => {
    return deps.deploymentEventsData.value || [];
  });

  // Check if last event contains ERROR
  const hasErrorInLastEvent = computed(() => {
    const events = deploymentEvents.value;
    if (events.length === 0) return false;
    const lastEvent = events[0];
    return (
      lastEvent?.type.endsWith("ERROR") &&
      lastEvent?.category.includes("Deployment")
    );
  });

  return {
    // Pagination
    jobsPerPage,
    activeJobsPage,
    historicalJobsPage,
    logsJobsPage,

    // Log selection
    activeLogsJobId,
    userSelectedJob,
    jobActivityTab,

    // Job results
    completedJobResults,
    loadingJobResults,

    // Duration
    firstRunningJobId,
    runningJobDurationSeconds,
    getJobDuration,

    // Job state
    getJobStateNumber,

    // Job lists
    activeJobs,
    allHistoricalJobs,
    historicalJobs,
    historicalJobsTotalPages,
    totalJobs,
    allJobsForLogs,
    allJobs,
    logsJobsTotalPages,

    // Job helpers
    isActiveJob,
    isCompletedJob,
    getJobData,
    fetchJobResults,
    selectJobForLogs,

    // Derived data
    deploymentEndpoints,
    deploymentEvents,
    hasErrorInLastEvent,
  };
}
