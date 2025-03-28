import { getJobExposeIdHash, type Job, type JobDefinition } from "@nosana/sdk";
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
    10000,
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
          if (state === 2) throw new Error("Job already completed");

          try {
            if (state === 0) {
              await nosana.value.jobs.delist(jobId);
            } else {
              await nosana.value.jobs.end(jobId);
            }
          } catch (error) {
            throw new Error(`Error stopping job: ${JSON.stringify(error)}`);
          }

          setTimeout(() => refresh(), 2000);
        },
      };

      if (getStateNumber(jobResult.state) < 2) {
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

      const services = getJobExposeIdHash(job.jobDefinition, jobId);
      for (const service of services) {
        const url = `https://${service}.${useRuntimeConfig().public.nodeDomain}`;

        if (endpoints.value.has(url) || service === "private") continue;

        endpoints.value.set(url, {
          status: "UNKNOWN",
          url,
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
