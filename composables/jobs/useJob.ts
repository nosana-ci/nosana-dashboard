import {
  getJobExposedServices,
  getJobExposeIdHash,
  type Job,
  type JobDefinition,
} from "@nosana/sdk";
import { useToast } from "vue-toastification";

/**
 * Helper to convert job state to a number, normalizing "RUNNING", "QUEUED", etc.
 */
function getStateNumber(stateVal: string | number): number {
  if (stateVal === "QUEUED" || stateVal === 0) return 0;
  if (stateVal === "RUNNING" || stateVal === 1) return 1;
  if (stateVal === "COMPLETED" || stateVal === 2) return 2;
  if (stateVal === "STOPPED" || stateVal === 3) return 3;
  return -1;
}

export type UseJob = Job & {
  address: string;
  usdRewardPerHour?: number;
  jobDefinition?: JobDefinition & {
    state?: {
      "nosana/job-type"?: string;
      "input/repo"?: string;
      "input/commit-sha"?: string;
    };
  };
  jobStatus?: "success" | "failed";
  results?: any;
  isActive: boolean;
  isRunning: boolean;
  isCompleted: boolean;
  hasResultsRegex: boolean;
  jobResult: any;

  stopJob: () => Promise<void>;
  refresh: () => Promise<void>;
};

export type Endpoints = Map<
  string,
  {
    url: string;
    port: number;
    opIndex: number;
    opId: string;
    hasHealthCheck: boolean;
    status: "ONLINE" | "OFFLINE" | "UNKNOWN";
    setStatus: (status: "ONLINE" | "OFFLINE") => void;
  }
>;

export function useJob(jobId: string) {
  const job = ref<UseJob | null>(null);
  const loading = ref(true);
  const endpoints = ref<Endpoints>(new Map() as Endpoints);

  const toast = useToast();
  const { nosana } = useSDK();
  const { getIpfs } = useIpfs();
  const { data, pending, refresh } = useAPI("/api/jobs/" + jobId, {
    watch: false,
  });

  const { pause: pauseJobPolling, resume: resumeJobPolling } = useIntervalFn(
    () => {
      refresh();
    },
    1000,
    { immediate: false }
  );

  watch(
    data,
    async (jobResult: Job | undefined) => {
      if (!jobResult) return;

      const state = getStateNumber(jobResult.state || -1);

      const jobObject: UseJob = {
        jobResult: undefined,
        ...jobResult,
        address: jobId,
        isRunning: state === 1,
        isActive: state === 0 || state === 1,
        isCompleted: state === 2,
        hasResultsRegex: false,
        refresh,
        stopJob: async () => {
          if (!job.value) {
            toast.error('Job data not available yet.');
            return;
          }

          const numericState = getStateNumber(job.value.state ?? -1);

          if (numericState === 2 || numericState === 3) {
            toast.info(`Job is already ${numericState === 2 ? 'COMPLETED' : 'STOPPED'}`);
            return;
          }

          try {
            if (numericState === 0) {
              await nosana.value.jobs.delist(jobId);
              toast.success('Job successfully delisted (canceled) from queue!');
            } else if (numericState === 1) {
              await nosana.value.jobs.end(jobId);
              toast.success('Job successfully ended!');
            } else {
              toast.error(`Job is not in QUEUED or RUNNING state (currently: ${numericState})`);
              return;
            }
            setTimeout(() => refresh(), 5000);
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            const fullError = String(e);
            if (errorMessage.includes('TransactionExpiredTimeoutError') || 
                fullError.includes('Transaction was not confirmed in') ||
                fullError.includes('TimeoutError')) {
              toast.error('Solana is congested, try again or with a higher fee (Turbo/Ultra)');
            } else if (errorMessage.includes('Unknown action') || 
                      fullError.includes('Unknown action')) {
              toast.error('Not enough NOS balance for the transaction');
            } else if (errorMessage.includes('job cannot be delisted except when in queue')) {
              toast.error('Job cannot be delisted, it might have already started.');
            } else {
              toast.error(`Error stopping/delisting job: ${errorMessage}`);
            }
            console.error('Stop/Delist job error:', e);
          }
        },
      };

      if (state < 2) {
        resumeJobPolling();
      } else {
        pauseJobPolling();
      }

      try {
        if (
          jobResult.ipfsResult &&
          jobResult.ipfsResult !==
            "QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51"
        ) {
          const resultResponse = await getIpfs(jobResult.ipfsResult);
          jobObject.hasResultsRegex = resultResponse.opStates.some(
            (op: any) => op.results
          );
          jobObject.results = resultResponse;
        }
      } catch (error) {
        toast.error(`Error fetching IPFS result: ${JSON.stringify(error)}`);
      }

      job.value = jobObject;
    },
    {
      immediate: true,
      deep: true,
    }
  );

  watch(job, (job) => {
    if (job === null) return;
    if (job.jobDefinition) {
      const setEndpointStatus = (
        service: string,
        status: "ONLINE" | "OFFLINE"
      ) => {
        const serviceObj = endpoints.value.get(service);
        if (!serviceObj) return;
        endpoints.value.set(service, {
          ...serviceObj,
          status,
        });
        endpoints.value = new Map(endpoints.value);
      };

      const services = getJobExposedServices(job.jobDefinition, jobId);
      for (const { hash, port, opId, opIndex, hasHealthCheck } of services) {
        const url = `https://${hash}.${useRuntimeConfig().public.nodeDomain}`;

        if (endpoints.value.has(url) || hash === "private") continue;

        endpoints.value.set(url, {
          status: "UNKNOWN",
          url,
          opId,
          opIndex,
          port,
          hasHealthCheck,
          setStatus: (status: "ONLINE" | "OFFLINE") => {
            setEndpointStatus(url, status);
          },
        });
      }
    }
    loading.value = false;
  });

  return {
    job,
    endpoints,
    loading,
  };
}
