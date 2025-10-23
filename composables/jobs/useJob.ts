import {
  getJobExposedServices,
  getJobExposeIdHash,
  type Job,
  type JobDefinition,
} from "@nosana/sdk";
import { useToast } from "vue-toastification";
import { useWallet } from "solana-wallets-vue";
import { EventSourcePolyfill } from "event-source-polyfill";
import type { JobInfo } from "~/composables/jobs/types";

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
  extendJob: (extensionHours: number) => Promise<void>;
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
  }
>;

export function useJob(jobId: string) {
  const job = ref<UseJob | null>(null);
  const loading = ref(true);
  const endpoints = ref<Endpoints>(new Map() as Endpoints);
  const jobInfo = ref<JobInfo | null>(null);

  const toast = useToast();
  const { nosana } = useSDK();
  const { getIpfs } = useIpfs();
  const { status, data: userData, token } = useAuth();
  const { connected, publicKey } = useWallet();
  const { ensureAuth } = useAuthHeader();
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
              try {
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
              } catch (sdkError: any) {
                console.error('SDK method failed:', sdkError);
                throw sdkError;
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

      // Determine if current user is the job poster
      const activeAddress = computed(() => {
        if (status.value === 'authenticated' && (userData.value as any)?.generatedAddress) {
          return (userData.value as any).generatedAddress as string;
        }
        if (connected.value && publicKey.value) {
          return publicKey.value.toString();
        }
        return null;
      });

      const isPoster = Boolean(
        activeAddress.value &&
        jobResult.project &&
        activeAddress.value === jobResult.project.toString()
      );

      const isConfidentialJob = Boolean((jobResult as any)?.jobDefinition?.logistics);

      if (isConfidentialJob && isPoster && state !== 1) {
        // Confidential flow: fetch results from node
        try {
          const nodeDomain = useRuntimeConfig().public.nodeDomain;
          const nodeAddress = (jobResult.node as any)?.toString?.() || (jobResult.node as any);
          const url = `https://${nodeAddress}.${nodeDomain}/job/${jobId}/results`;
          const authHeader = await ensureAuth();
          const flowState: any = await $fetch(url, {
            method: 'GET',
            headers: {
              authorization: authHeader,
            },
          });
          const parsed = typeof flowState === 'string' ? JSON.parse(flowState) : flowState;
          if (parsed && parsed.opStates) {
            jobObject.results = parsed;
            jobObject.hasResultsRegex = parsed.opStates.some((op: any) => op.results);
          }
        } catch (error) {
        }
      } else {
        // Non-confidential flow: fetch IPFS results if available
        try {
          if (
            jobResult.ipfsResult &&
            jobResult.ipfsResult !==
              "QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51"
          ) {
            const resultResponse = await getIpfs(jobResult.ipfsResult);
            jobObject.hasResultsRegex = resultResponse.opStates?.some(
              (op: any) => op.results
            ) || false;
            jobObject.results = resultResponse;
          }
        } catch (error) {
          toast.error(`Error fetching IPFS result: ${JSON.stringify(error)}`);
        }
      }

      // Preserve any live results previously received via SSE when REST polling doesn't include them yet
      try {
        if (!jobObject.results && job.value?.results) {
          jobObject.results = job.value.results;
        }
        if (!jobObject.hasResultsRegex && job.value?.hasResultsRegex) {
          jobObject.hasResultsRegex = job.value.hasResultsRegex;
        }
        
      } catch {}

      job.value = jobObject;
    },
    {
      immediate: true,
      deep: true,
    }
  );

  let eventSource: EventSourcePolyfill | null = null;
  let currentNodeAddress: string | null = null;
  let completedSseAttempted = false;
  let fetchingJobDefinition = false;
  let fetchedConfidentialJobDefinition = false;
  let retriedConfidentialJobDefinition = false;

  async function fetchConfidentialJobDefinitionOnce() {
    try {
      if (!job.value) return;
      const isConfidentialJob = Boolean((job.value as any)?.jobDefinition?.logistics);
      if (!isConfidentialJob) return;

      const activeAddress = (() => {
        if (status.value === 'authenticated' && (userData.value as any)?.generatedAddress) {
          return (userData.value as any).generatedAddress as string;
        }
        if (connected.value && publicKey.value) {
          return publicKey.value.toString();
        }
        return null;
      })();
      const isPoster = Boolean(
        activeAddress && job.value.project && activeAddress === job.value.project.toString()
      );
      if (!isPoster) return;

      if (fetchingJobDefinition || fetchedConfidentialJobDefinition) return;

      fetchingJobDefinition = true;
      const nodeDomain = useRuntimeConfig().public.nodeDomain;
      const nodeAddr = (job.value.node as any)?.toString?.() || (job.value as any)?.node;
      const url = `https://${nodeAddr}.${nodeDomain}/job/${jobId}/job-definition`;
      const authHeader = await ensureAuth();
      const response = await $fetch<any>(url, {
        method: 'GET',
        headers: { authorization: authHeader },
      });
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;
      if (parsed) {
        jobInfo.value = { ...(jobInfo.value as any), jobDefinition: parsed } as any;
        fetchedConfidentialJobDefinition = true;
      } else {
        fetchedConfidentialJobDefinition = true;
      }
    } catch (err: any) {
      const message: string | undefined = typeof err?.data === 'string' ? err.data : undefined;
      if (!retriedConfidentialJobDefinition && message && message.toLowerCase().includes('job definition has not yet been set')) {
        retriedConfidentialJobDefinition = true;
        setTimeout(() => {
          fetchingJobDefinition = false;
          fetchConfidentialJobDefinitionOnce();
        }, 5000);
        return;
      }
      // Mark as fetched to prevent repeated calls causing flicker
      fetchedConfidentialJobDefinition = true;
    } finally {
      fetchingJobDefinition = false;
    }
  }

  watch(job, (currentJob: UseJob | null) => {
    if (currentJob === null) return;

    const isCompleted = Boolean(
      (currentJob as any)?.isCompleted === true ||
      getStateNumber((currentJob as any)?.state ?? -1) === 2
    );

    // If job is completed and we've already attempted a one-shot SSE, ensure any existing SSE is closed and never reconnect
    if (isCompleted && completedSseAttempted) {
      if (eventSource) {
        try { eventSource.close(); } catch {}
        eventSource = null;
      }
      loading.value = false;
      return;
    }

    // Proactively fetch confidential job-definition once for poster
    fetchConfidentialJobDefinitionOnce();

    const sdkServices = currentJob.jobDefinition
      ? getJobExposedServices(currentJob.jobDefinition, jobId)
      : [];
    const metaByPort = new Map<number, { opId: string; opIndex: number; hasHealthCheck: boolean }>();
    for (const { port, opId, opIndex, hasHealthCheck } of sdkServices) {
      metaByPort.set(Number(port), { opId, opIndex, hasHealthCheck });
    }

    const config = useRuntimeConfig();
    const nodeAddress = (currentJob.node as any)?.toString?.() || (currentJob.node as any);
    
    // For completed jobs: perform exactly one SSE attempt, then never reconnect
    const oneShot = isCompleted;
    if (oneShot) {
      // Close any existing SSE to prevent auto-reconnects from a running-state connection
      if (eventSource) {
        try { eventSource.close(); } catch {}
        eventSource = null;
      }
      completedSseAttempted = true;
    }

    // Only reuse the existing SSE connection if NOT in one-shot mode
    if (!oneShot && eventSource && currentNodeAddress === nodeAddress && (eventSource as any).readyState !== 2) {
      return;
    }
    
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    
    currentNodeAddress = nodeAddress;

    (async () => {
      try {
        const nodeAddress = (currentJob.node as any)?.toString?.() || (currentJob.node as any);
        const authHeader = await ensureAuth();
        const sseUrl = `https://${nodeAddress}.${config.public.nodeDomain}/job/${jobId}/info`;
        
        eventSource = new EventSourcePolyfill(sseUrl, {
          headers: {
            'Authorization': authHeader
          }
        });
        
        const handleInfo = (event: MessageEvent) => {
          try {
            const info = JSON.parse(event.data) as JobInfo;
            
            // Preserve existing jobDefinition to avoid flicker if SSE message lacks it
            try {
              const previousJobDefinition = (jobInfo.value as any)?.jobDefinition;
              jobInfo.value = { ...(info as any), jobDefinition: previousJobDefinition ?? (info as any)?.jobDefinition } as any;
            } catch {
              jobInfo.value = info;
            }

            // Do not repeatedly fetch job-definition on every SSE update
            
            // Update live endpoints from SSE
            if (info && info.endpoints && info.endpoints.urls) {
              const newEndpoints = new Map(endpoints.value);
              
              for (const k of Object.keys(info.endpoints.urls)) {
                const item = info.endpoints.urls[k];
                if (!item || !item.url) continue;
                const portNum = Number(item.port);
                const meta = metaByPort.get(portNum);
                const endpointUrl = item.url as string;
                newEndpoints.set(endpointUrl, {
                  status: item.status,
                  url: endpointUrl,
                  opId: item.opId || meta?.opId || '',
                  opIndex: meta?.opIndex ?? 0,
                  port: portNum,
                  hasHealthCheck: Boolean(meta?.hasHealthCheck)
                });
              }
              
              endpoints.value = newEndpoints;
            }
            
            // Update live results from SSE when available
            try {
              const sseResults: any = (info as any).results;
              if (sseResults && job.value) {
                const isConfidentialJob = Boolean((job.value as any)?.jobDefinition?.logistics);
                const activeAddress = (() => {
                  if (status.value === 'authenticated' && (userData.value as any)?.generatedAddress) {
                    return (userData.value as any).generatedAddress as string;
                  }
                  if (connected.value && publicKey.value) {
                    return publicKey.value.toString();
                  }
                  return null;
                })();
                const isPoster = Boolean(
                  activeAddress && job.value.project && activeAddress === job.value.project.toString()
                );

                if (!isConfidentialJob || isPoster) {
                  // Accept results in non-confidential jobs for everyone, or confidential only for poster
                  job.value.results = sseResults;
                  job.value.hasResultsRegex = Array.isArray(sseResults.opStates)
                    ? sseResults.opStates.some((op: any) => op?.results)
                    : false;
                  
                }
              }
            } catch {}
            
            loading.value = false;

            // For completed jobs, close immediately after first message and do not reconnect
            if (oneShot) {
              try { (eventSource as any)?.removeEventListener?.('message', handleInfo as any); } catch {}
              try { (eventSource as any)?.removeEventListener?.('flow:updated', handleInfo as any); } catch {}
              try { eventSource?.close(); } catch {}
              eventSource = null;
            }
          } catch (parseError) {
            console.error('Failed to parse SSE message:', parseError);
          }
        };

        try {
          (eventSource as any).addEventListener?.('message', handleInfo as any);
        } catch {}
        try {
          (eventSource as any).addEventListener?.('flow:updated', handleInfo as any);
        } catch {}
        
        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);

          loading.value = false;

          // For completed jobs, never retry after an error; rely on existing results as fallback
          if (oneShot) {
            try { (eventSource as any)?.removeEventListener?.('message', handleInfo as any); } catch {}
            try { (eventSource as any)?.removeEventListener?.('flow:updated', handleInfo as any); } catch {}
            try { eventSource?.close(); } catch {}
            eventSource = null;
          }
        };
        
        eventSource.onopen = () => {
          console.log('SSE connection opened for job info');
        };
      } catch (error) {
        console.error('Failed to create EventSource:', error);
        loading.value = false;
      }
    })();
  });

  // Cleanup on unmount
  onBeforeUnmount(() => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  });

  return {
    job,
    endpoints,
    loading,
    jobInfo,
  };
}
