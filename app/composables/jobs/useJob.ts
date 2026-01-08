import {
  getJobExposedServices,
  type Job,
  type JobDefinition,
} from "@nosana/kit";
import { useToast } from "vue-toastification";
import { useWallet } from "@nosana/solana-vue";
import { EventSourcePolyfill } from "event-source-polyfill";
import type { JobInfo, JobViewModel, LiveEndpoints, ResultsSection} from "~/composables/jobs/types";
import { normalizeEndpoints } from "~/composables/jobs/normalizeEndpoints";

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

export type UseJob = JobViewModel;
export type Endpoints = LiveEndpoints;

export function useJob(jobId: string) {
  const job = ref<UseJob | null>(null);
  const loading = ref(true);
  const endpoints = ref<Endpoints>(new Map() as Endpoints);
  const jobInfo = ref<JobInfo | null>(null);
  const route = useRoute();
  const isDeploymentContext = computed<boolean>(() => {
    const p = route.path || route.fullPath || '';
    return typeof p === 'string' && p.startsWith('/deployments/');
  });

  const toast = useToast();
  const { nosana, publicKey } = useKit();
  const { getIpfs } = useIpfs();
  const { status, data: userData, token } = useAuth();
  const { connected } = useWallet();
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
        ...(jobResult as JobViewModel),
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
              const response = await $fetch<{ message: string; creditRefund?: number; delisted?: boolean }>(`${config.public.backend_url}/api/jobs/stop-with-credits`, {
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
                  await nosana.value.jobs.delist({ job: jobId });
                  toast.success('Job successfully delisted (canceled) from queue!');
                  setTimeout(() => {
                    navigateTo('/deploy');
                  }, 3000);
                } else if (numericState === 1) {
                  await nosana.value.jobs.end({ job: jobId });
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
              const response = await $fetch<{ message: string; newTimeout?: number; creditsUsed?: number }>(`${config.public.backend_url}/api/jobs/extend-with-credits`, {
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
              await nosana.value.jobs.extend({ job: jobId, timeout: extensionSeconds });
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

      try {
        if (
          state === 2 &&
          jobResult.ipfsResult &&
          jobResult.ipfsResult !== "QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51"
        ) {
          const resultResponse = await getIpfs(jobResult.ipfsResult) as ResultsSection;
          jobObject.hasResultsRegex = Array.isArray(resultResponse.opStates)
            ? resultResponse.opStates.some((op) => (op as { results?: unknown }).results !== undefined)
            : false;
          jobObject.results = resultResponse;
        }
      } catch (error) {
        toast.error(`Error fetching IPFS result: ${String(error)}`);
      }

      try {
        if (!jobObject.results && job.value?.results) {
          jobObject.results = job.value.results;
        }
        if (!jobObject.hasResultsRegex && job.value?.hasResultsRegex) {
          jobObject.hasResultsRegex = job.value.hasResultsRegex;
        }
        
      } catch (error) {
        console.error(`[useJob] Error in data processing:`, error);
      }

      try {
        const maybeJd = (jobResult as unknown as { jobDefinition?: JobDefinition })?.jobDefinition;
        if (maybeJd) {
          jobObject.jobDefinition = maybeJd;
        }
      } catch (error) {
        console.error(`[useJob] Error extracting job definition:`, error);
      }

      job.value = jobObject;
    },
    {
      immediate: true,
      deep: true,
    }
  );

  watch(pending, (isPending) => {
    if (!isPending) {
      if (!data.value && !job.value) {
        loading.value = false;
      }
    } else {
      loading.value = true;
    }
  });

  watch([job, pending], ([currentJob, isPending]) => {
    if (!isPending && currentJob) {
      const nodeAddress = (currentJob.node as any)?.toString?.() || (currentJob.node as any);
      if (!nodeAddress || nodeAddress === '11111111111111111111111111111111') {
        loading.value = false;
      } else {
        loading.value = false;
      }
    }
  }, { immediate: true });

  let eventSource: EventSourcePolyfill | null = null;
  let currentNodeAddress: string | null = null;
  let fetchingNodeJobDefinition = false;
  let fetchedNodeJobDefinition = false;

  async function fetchBackendJobDefinitionOnce() {
    try {
      const maybeJd = (data.value as unknown as { jobDefinition?: JobDefinition })?.jobDefinition;
      if (maybeJd) {
        if (job.value) job.value.jobDefinition = maybeJd;
        if (jobInfo.value) jobInfo.value = { ...jobInfo.value, jobDefinition: maybeJd } as JobInfo;
      }
    } catch {}
  }

  // Check if an address matches the current user (credit user or wallet)
  const isCurrentUser = (address: string): boolean => {
    if (status.value === 'authenticated' && userData.value?.generatedAddress) {
      return userData.value.generatedAddress === address;
    }
    if (connected.value && publicKey.value) {
      return publicKey.value.toString() === address;
    }
    return false;
  };

  async function fetchNodeJobDefinitionOnce() {
    try {
      if (!job.value) return;
      // Avoid node job-definition calls from the deployments page
      if (isDeploymentContext.value) {
        fetchedNodeJobDefinition = true;
        return;
      }
      if (fetchingNodeJobDefinition || fetchedNodeJobDefinition) return;
      // Only fetch from node if user is job poster
      if (!isCurrentUser(job.value.project.toString())) {
        fetchedNodeJobDefinition = true;
        return;
      }
      fetchingNodeJobDefinition = true;
      const nodeDomain = useRuntimeConfig().public.nodeDomain;
      const nodeAddr = (job.value.node as unknown as { toString?: () => string })?.toString?.() || (job.value.node as unknown as string);
      if (!nodeAddr || nodeAddr === '11111111111111111111111111111111') {
        fetchedNodeJobDefinition = true;
        return;
      }
      const url = `https://${nodeAddr}.${nodeDomain}/job/${jobId}/job-definition`;
      const authHeader = await ensureAuth();
      const response = await $fetch<JobDefinition | string>(url, { method: 'GET', headers: { authorization: authHeader } });
      const parsed: JobDefinition = typeof response === 'string' ? JSON.parse(response) : response;
      if (parsed) {
        if (job.value) job.value.jobDefinition = parsed;
        if (jobInfo.value) jobInfo.value = { ...jobInfo.value, jobDefinition: parsed } as JobInfo;
        fetchedNodeJobDefinition = true;
      }
    } catch {
      fetchedNodeJobDefinition = true;
    } finally {
      fetchingNodeJobDefinition = false;
    }
  }

  watch(job, (currentJob: UseJob | null) => {
    if (currentJob === null) return;

    const isCompleted = Boolean(currentJob.isCompleted === true || getStateNumber(currentJob.state ?? -1) === 2);

    if (!isCompleted) fetchNodeJobDefinitionOnce();
    else fetchBackendJobDefinitionOnce();

    const sdkServices = currentJob.jobDefinition
      ? getJobExposedServices(currentJob.jobDefinition, jobId)
      : [];
    const metaByPort = new Map<number, { opId: string; opIndex: number; hasHealthCheck: boolean }>();
    for (const { port, opId, opIndex, hasHealthCheck } of sdkServices) {
      metaByPort.set(Number(port), { opId, opIndex, hasHealthCheck });
    }

    const config = useRuntimeConfig();
    const nodeAddress = (currentJob.node as any)?.toString?.() || (currentJob.node as any);
    
    if (isCompleted) {
      if (eventSource) { try { eventSource.close(); } catch {} eventSource = null; }
      loading.value = false;
      return;
    }

    // Avoid opening node SSE (/job/:id/info) from the deployments page
    if (isDeploymentContext.value) {
      loading.value = false;
      return;
    }

    // Only connect to node SSE if user is job poster
    if (!isCurrentUser(currentJob.project.toString())) {
      loading.value = false;
      return;
    }

    if (eventSource && currentNodeAddress === nodeAddress && (eventSource as any).readyState !== 2) {
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
        
        if (!nodeAddress || nodeAddress === '11111111111111111111111111111111') {
          loading.value = false;
          return;
        }
        
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
            
            const previousJobDefinition = jobInfo.value?.jobDefinition;
            jobInfo.value = { ...info, jobDefinition: previousJobDefinition ?? info.jobDefinition } as JobInfo;

            const normalized = normalizeEndpoints(info, jobId, metaByPort);
            if (normalized.size > 0) {
              const newEndpoints = new Map(endpoints.value);
              for (const [url, endpoint] of normalized.entries()) {
                newEndpoints.set(url, endpoint);
              }
              endpoints.value = newEndpoints;
            }
            
            try {
              const sseResults = (info as unknown as { results?: ResultsSection }).results;
              if (sseResults && job.value) {
                job.value.results = sseResults;
                job.value.hasResultsRegex = Array.isArray(sseResults.opStates)
                  ? sseResults.opStates.some((op) => (op as { results?: unknown }).results !== undefined)
                  : false;
              }
            } catch {}
            
            loading.value = false;
          } catch (parseError) {
            console.error('Failed to parse SSE message:', parseError);
          }
        };

        try { (eventSource as unknown as EventSource).addEventListener?.('message', handleInfo as EventListener); } catch {}
        try { (eventSource as unknown as EventSource).addEventListener?.('flow:updated', handleInfo as EventListener); } catch {}
        
        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);

          loading.value = false;

        };
        
        eventSource.onopen = () => {
          loading.value = false;
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
    pausePolling: pauseJobPolling,
    resumePolling: resumeJobPolling,
  };
}
