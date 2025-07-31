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
  const { status, data: userData, token } = useAuth();
  const { data, pending, refresh } = useAPI("/api/jobs/" + jobId, {
    watch: false,
  });

  // Helper to detect if current user is a credit user
  const isCreditUser = computed(() => {
    return status.value === 'authenticated' && userData.value?.generatedAddress;
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
            // Use credit API for authenticated users with generated addresses
            if (isCreditUser.value) {
              const config = useRuntimeConfig();
              const response = await $fetch<{ message: string; creditRefund?: number; delisted?: boolean }>(`${config.public.apiBase}/api/jobs/stop-with-credits`, {
                method: 'POST',
                body: { jobAddress: jobId },
                headers: {
                  Authorization: `Bearer ${token.value}`,
                },
              });
              
              if (response.creditRefund && response.creditRefund > 0) {
                toast.success(`Job stopped successfully! ${response.creditRefund} credits refunded.`);
              } else {
                toast.success('Job stopped successfully!');
              }

              if (response.delisted) {
                setTimeout(() => {
                  navigateTo('/deploy');
                }, 3000);
              } else {
                setTimeout(() => refresh(), 1000);
              }
            } else {
              // Use SDK for wallet users
              if (numericState === 0) {
                await nosana.value.jobs.delist(jobId);
                toast.success('Job successfully delisted (canceled) from queue!');
                setTimeout(() => {
                  navigateTo('/deploy');
                }, 3000);
              } else if (numericState === 1) {
                await nosana.value.jobs.end(jobId);
                toast.success('Job successfully ended!');
                setTimeout(() => refresh(), 1000);
              } else {
                toast.error(`Job is not in QUEUED or RUNNING state (currently: ${numericState})`);
                return;
              }
            }
          } catch (e: any) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            const fullError = String(e);
            
            console.error('Stop/Delist job error:', e);
            
            // Handle API errors for credit users
            if (isCreditUser.value) {
              if (e.status === 404) {
                toast.error('Job not found or you do not have permission to stop this job.');
              } else if (e.status === 400) {
                toast.error(e.data?.message || 'Invalid request. The job may not be stoppable.');
              } else if (e.status === 401) {
                toast.error('Authentication failed. Please log in again.');
              } else {
                toast.error(`Failed to stop job: ${e.data?.message || errorMessage}`);
              }
              return;
            }
            
            // Handle SDK errors for wallet users
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
          }
        },
        extendJob: async (extensionHours: number) => {
          if (!job.value) {
            toast.error('Job data not available yet.');
            return;
          }

          if (job.value.state !== 1) {
            toast.error('Job must be running to extend it.');
            return;
          }

          if (extensionHours <= 0) {
            toast.error('Extension must be greater than 0 hours.');
            return;
          }

          try {
            const extensionSeconds = extensionHours * 3600;

            // Use credit API for authenticated users with generated addresses
            if (isCreditUser.value) {
              const config = useRuntimeConfig();
              const response = await $fetch<{ message: string; newTimeout?: number; creditsUsed?: number }>(`${config.public.apiBase}/api/jobs/extend-with-credits`, {
                method: 'POST',
                body: { 
                  jobAddress: jobId,
                  extensionSeconds 
                },
                headers: {
                  Authorization: `Bearer ${token.value}`,
                },
              });
              
              if (response.creditsUsed) {
                const dollarAmount = (response.creditsUsed / 1000).toFixed(2);
                toast.success(`Job extended by ${extensionHours} hour${extensionHours !== 1 ? 's' : ''}! $${dollarAmount} used.`);
              } else {
                toast.success(`Job extended by ${extensionHours} hour${extensionHours !== 1 ? 's' : ''}!`);
              }
              setTimeout(() => refresh(), 1000);
            } else {
              // Use SDK for wallet users
              await nosana.value.jobs.extend(jobId, extensionSeconds);
              toast.success(`Job extended by ${extensionHours} hour${extensionHours !== 1 ? 's' : ''}!`);
              setTimeout(() => refresh(), 1000);
            }
          } catch (e: any) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            
            console.error('Extend job error:', e);
            
            // Handle API errors for credit users
            if (isCreditUser.value) {
              if (e.status === 404) {
                toast.error('Job not found or you do not have permission to extend this job.');
              } else if (e.status === 400) {
                toast.error(e.data?.message || 'Invalid request. The job may not be extendable.');
              } else if (e.status === 401) {
                toast.error('Authentication failed. Please log in again.');
              } else if (e.status === 402) {
                toast.error('Insufficient credits to extend the job.');
              } else {
                toast.error(`Failed to extend job: ${e.data?.message || errorMessage}`);
              }
              return;
            }
            
            // Handle SDK errors for wallet users
            if (errorMessage.includes('TransactionExpiredTimeoutError') || 
                errorMessage.includes('Transaction was not confirmed in')) {
              toast.error('Solana is congested, try again or with a higher fee (Turbo/Ultra)');
            } else if (errorMessage.includes('Unknown action')) {
              toast.error('Not enough NOS balance for the transaction');
            } else {
              toast.error(`Error extending job: ${errorMessage}`);
            }
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
