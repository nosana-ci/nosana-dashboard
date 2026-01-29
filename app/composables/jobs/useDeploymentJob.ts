import { EventSourcePolyfill } from "event-source-polyfill";
import { useToast } from "vue-toastification";
import { useWallet } from "@nosana/solana-vue";
import type { Job, JobDefinition } from "@nosana/kit";
import { getJobExposedServices } from "@nosana/kit";
import type { JobInfo, JobViewModel, LiveEndpoints, ResultsSection} from "~/composables/jobs/types";
import { normalizeEndpoints } from "~/composables/jobs/normalizeEndpoints";
import { useDeploymentAuth } from "~/composables/useDeploymentAuth";

const DEFAULT_NODE_ADDRESS = "11111111111111111111111111111111";

function getStateNumber(stateVal: string | number | undefined): number {
  if (stateVal === "QUEUED" || stateVal === 0) return 0;
  if (stateVal === "RUNNING" || stateVal === 1) return 1;
  if (stateVal === "COMPLETED" || stateVal === 2) return 2;
  if (stateVal === "STOPPED" || stateVal === 3) return 3;
  return -1;
}

interface DeploymentJobApiResultOpState {
  providerId?: string;
  operationId: string;
  group?: string;
  status?: string;
  startTime?: number;
  endTime?: number;
  exitCode?: number;
  logs?: Array<{ type?: string; log?: string } | string>;
  results?: unknown;
  diagnostics?: {
    reason?: {
      hostShutDown?: boolean;
      jobStopped?: boolean;
      expired?: boolean;
    };
    error?: string;
    message?: string;
    [key: string]: unknown;
  };
}

interface DeploymentJobApiResult {
  status?: string;
  startTime?: number;
  endTime?: number;
  errors?: unknown[];
  opStates: DeploymentJobApiResultOpState[];
  secrets?: Record<string, unknown>;
}

interface DeploymentJobApiResponse {
  confidential?: boolean;
  revision?: number;
  market?: string;
  node?: string;
  state: string | number;
  jobStatus?: string;
  jobDefinition?: JobDefinition;
  jobResult?: DeploymentJobApiResult;
  timeStart?: number;
  timeEnd?: number;
  listedAt?: number;
  project?: string;
}

export function useDeploymentJob(deploymentId: string, jobId: string) {
  const job = ref<JobViewModel | null>(null);
  const endpoints = ref<LiveEndpoints>(new Map());
  const jobInfo = ref<JobInfo | null>(null);
  const loading = ref<boolean>(true);

  const toast = useToast();
  const { nosana } = useKit();
  const { status, data: userData, token } = useAuth();
  const { connected, account } = useWallet();

  const isCreditUser = computed(() => status.value === "authenticated" && Boolean(userData.value?.generatedAddress));

  const activeAddress = computed(() => {
    if (status.value === "authenticated" && userData.value?.generatedAddress) return userData.value.generatedAddress as string;
    if (connected.value && account.value?.address) return account.value.address;
    return null;
  });

  // Use deployment auth composable for clean, reusable auth handling
  const { getAuthHeader } = useDeploymentAuth();

  let eventSource: EventSourcePolyfill | null = null;
  let currentNodeAddress: string | null = null;
  let hasFetchedFinalInfo = false;

  async function fetchDeploymentJob(): Promise<DeploymentJobApiResponse | null> {
    try {
      const dep = (await nosana.value.api.deployments.get(deploymentId)) as any;
      const response = await dep.getJob(jobId);
      return response as unknown as DeploymentJobApiResponse;
    } catch (e) {
      console.error("Failed to fetch deployment job:", e);
      return null;
    }
  }

  function toResultsSection(result?: DeploymentJobApiResult): ResultsSection | null {
    if (!result) return null;
    return {
      status: result.status,
      startTime: result.startTime,
      endTime: result.endTime,
      opStates: (result.opStates || []).map((op) => ({
        operationId: op.operationId,
        status: op.status ?? "",
        startTime: op.startTime,
        endTime: op.endTime,
        exitCode: op.exitCode,
        results: op.results,
        logs: op.logs ?? [],
        diagnostics: op.diagnostics,
      })),
    };
  }

  function buildViewModel(base: DeploymentJobApiResponse): JobViewModel {
    const stateNum = getStateNumber(base.state);
    const vm: JobViewModel = {
      ...(base as unknown as Job),
      address: jobId,
      state: stateNum,
      project: ((base.project as unknown) || (activeAddress.value as unknown) || "") as JobViewModel["project"],
      market: (base.market as unknown) as JobViewModel["market"],
      node: (base.node as unknown) as JobViewModel["node"],
      timeStart: base.timeStart ?? 0,
      timeEnd: base.timeEnd ?? 0,
      isRunning: stateNum === 1,
      isActive: stateNum === 0 || stateNum === 1,
      isCompleted: stateNum === 2,
      hasResultsRegex: Boolean(base.jobResult?.opStates?.some((op) => Boolean(op.results))),
      jobDefinition: base.jobDefinition,
      results: toResultsSection(base.jobResult),
      refresh: async () => {
        const latest = await fetchDeploymentJob();
        if (latest) assignFromApi(latest);
      },
      stopJob: async () => {
        if (!job.value) {
          toast.error("Job data not available yet.");
          return;
        }
        const numericState = getStateNumber(job.value.state);
        if (numericState === 2 || numericState === 3) {
          toast.info(`Job is already ${numericState === 2 ? "COMPLETED" : "STOPPED"}`);
          return;
        }

        try {
          if (isCreditUser.value) {
            const config = useRuntimeConfig();
            const resp = await $fetch<{ message: string; creditRefund?: number; delisted?: boolean }>(`${config.public.backend_url}/api/jobs/stop-with-credits`, {
              method: "POST",
              body: { jobAddress: jobId },
              headers: { Authorization: `Bearer ${token.value}` },
            });
            if (resp.creditRefund && resp.creditRefund > 0) toast.success(`Job stopped successfully! ${resp.creditRefund} credits refunded.`);
            else toast.success("Job stopped successfully!");
            if (resp.delisted) setTimeout(() => navigateTo("/deploy"), 3000);
            else setTimeout(() => job.value?.refresh(), 1000);
          } else {
            if (numericState === 0) {
              const jobAddress = job.value.address as Parameters<typeof nosana.value.jobs.delist>[0]["job"];
              await nosana.value.jobs.delist({ job: jobAddress });
              toast.success("Job successfully delisted (canceled) from queue!");
              setTimeout(() => navigateTo("/deploy"), 3000);
            } else if (numericState === 1) {
              const jobAddress = job.value.address as Parameters<typeof nosana.value.jobs.end>[0]["job"];
              await nosana.value.jobs.end({ job: jobAddress });
              toast.success("Job successfully ended!");
              setTimeout(() => job.value?.refresh(), 1000);
            } else {
              toast.error(`Job is not in QUEUED or RUNNING state (currently: ${numericState})`);
            }
          }
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : String(e);
          if (isCreditUser.value) {
            const err = e as { status?: number; data?: { message?: string } };
            if (err.status === 404) toast.error("Job not found or you do not have permission to stop this job.");
            else if (err.status === 400) toast.error(err.data?.message || "Invalid request. The job may not be stoppable.");
            else if (err.status === 401) toast.error("Authentication failed. Please log in again.");
            else toast.error(`Failed to stop job: ${err.data?.message || message}`);
            return;
          }
          if (message.includes("TransactionExpiredTimeoutError") || message.includes("Transaction was not confirmed in") || message.includes("TimeoutError"))
            toast.error("Solana is congested, try again or with a higher fee (Turbo/Ultra)");
          else if (message.includes("Unknown action")) toast.error("Not enough NOS balance for the transaction");
          else if (message.includes("job cannot be delisted except when in queue")) toast.error("Job cannot be delisted, it might have already started.");
          else toast.error(`Error stopping/delisting job: ${message}`);
        }
      },
      extendJob: async (extensionHours: number) => {
        if (!job.value) {
          toast.error("Job data not available yet.");
          return;
        }
        if (getStateNumber(job.value.state) !== 1) {
          toast.error("Job must be running to extend it.");
          return;
        }
        if (extensionHours <= 0) {
          toast.error("Extension must be greater than 0 hours.");
          return;
        }
        try {
          const extensionSeconds = extensionHours * 3600;
          if (isCreditUser.value) {
            const config = useRuntimeConfig();
            const resp = await $fetch<{ message: string; newTimeout?: number; creditsUsed?: number }>(`${config.public.backend_url}/api/jobs/extend-with-credits`, {
              method: "POST",
              body: { jobAddress: jobId, extensionSeconds },
              headers: { Authorization: `Bearer ${token.value}` },
            });
            if (resp.creditsUsed) {
              const dollarAmount = (resp.creditsUsed / 1000).toFixed(2);
              toast.success(`Job extended by ${extensionHours} hour${extensionHours !== 1 ? "s" : ""}! $${dollarAmount} used.`);
            } else toast.success(`Job extended by ${extensionHours} hour${extensionHours !== 1 ? "s" : ""}!`);
            setTimeout(() => job.value?.refresh(), 1000);
          } else {
            const jobAddress = job.value.address as Parameters<typeof nosana.value.jobs.extend>[0]["job"];
            await nosana.value.jobs.extend({ job: jobAddress, timeout: extensionSeconds });
            toast.success(`Job extended by ${extensionHours} hour${extensionHours !== 1 ? "s" : ""}!`);
            setTimeout(() => job.value?.refresh(), 1000);
          }
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : String(e);
          if (isCreditUser.value) {
            const err = e as { status?: number; data?: { message?: string } };
            if (err.status === 404) toast.error("Job not found or you do not have permission to extend this job.");
            else if (err.status === 400) toast.error(err.data?.message || "Invalid request. The job may not be extendable.");
            else if (err.status === 401) toast.error("Authentication failed. Please log in again.");
            else if (err.status === 402) toast.error("Insufficient credits to extend the job.");
            else toast.error(`Failed to extend job: ${err.data?.message || message}`);
            return;
          }
          if (message.includes("TransactionExpiredTimeoutError") || message.includes("Transaction was not confirmed in")) toast.error("Solana is congested, try again or with a higher fee (Turbo/Ultra)");
          else if (message.includes("Unknown action")) toast.error("Not enough NOS balance for the transaction");
          else toast.error(`Error extending job: ${message}`);
        }
      },
    };
    return vm;
  }

  function assignFromApi(api: DeploymentJobApiResponse) {
    const stateNum = getStateNumber(api.state);
    const base = job.value ? { ...job.value } : undefined;
    const vm = base ? { ...base } as JobViewModel : buildViewModel(api);
    vm.state = stateNum;
    if (api.project) vm.project = (api.project as unknown) as JobViewModel["project"];
    if (!vm.project && activeAddress.value) vm.project = (activeAddress.value as unknown) as JobViewModel["project"];
    vm.isRunning = stateNum === 1;
    vm.isActive = stateNum === 0 || stateNum === 1;
    vm.isCompleted = stateNum === 2;
    vm.jobDefinition = api.jobDefinition ?? vm.jobDefinition;
    vm.results = toResultsSection(api.jobResult) ?? vm.results ?? null;
    vm.hasResultsRegex = Boolean(vm.results?.opStates?.some((op) => (op as { results?: unknown }).results !== undefined));
    job.value = vm;

    if (vm.jobDefinition) {
      try {
        if (jobInfo.value) {
          jobInfo.value = { ...jobInfo.value, jobDefinition: vm.jobDefinition };
        }
      } catch {}
    }


    if (stateNum === 2 || stateNum === 3) {
      fetchFinalInfoOnce();
      if (eventSource) {
        try { eventSource.close(); } catch {}
        eventSource = null;
      }
    }
  }

  async function fetchFinalInfoOnce() {
    if (hasFetchedFinalInfo) return;
    try {
      if (!job.value) return;
      const config = useRuntimeConfig();
      const nodeAddress = (job.value.node as unknown as { toString?: () => string })?.toString?.() || (job.value.node as unknown as string);
      if (!nodeAddress || nodeAddress === DEFAULT_NODE_ADDRESS) { hasFetchedFinalInfo = true; return; }
      const authHeader = await getAuthHeader(deploymentId);
      const sseUrl = `https://${nodeAddress}.${config.public.nodeDomain}/job/${jobId}/info`;

      const sdkServices = job.value?.jobDefinition ? getJobExposedServices(job.value.jobDefinition, jobId) : [];
      const metaByPort = new Map<number, { opId: string; opIndex: number; hasHealthCheck: boolean }>();
      for (const { port, opId, opIndex, hasHealthCheck } of sdkServices) {
        metaByPort.set(Number(port), { opId, opIndex, hasHealthCheck });
      }

      const finalEs = new EventSourcePolyfill(sseUrl, { headers: { Authorization: authHeader } });
      const closeFinal = () => { try { (finalEs as unknown as EventSource).close?.(); } catch {} hasFetchedFinalInfo = true; };

      const handleOnce = (event: MessageEvent) => {
        try {
          const info = JSON.parse(event.data) as JobInfo;
          jobInfo.value = {
            ...info,
            jobDefinition: job.value?.jobDefinition ?? info.jobDefinition,
          } as JobInfo;

          const normalized = normalizeEndpoints(info, jobId, metaByPort);
          if (normalized.size > 0) {
            const newEndpoints = new Map(endpoints.value);
            for (const [url, endpoint] of normalized.entries()) {
              newEndpoints.set(url, endpoint);
            }
            endpoints.value = newEndpoints;
          }

          const sseResults = (info as unknown as { results?: ResultsSection }).results;
          if (sseResults && job.value) {
            job.value.results = sseResults;
            job.value.hasResultsRegex = Array.isArray(sseResults.opStates)
              ? sseResults.opStates.some((op) => (op as { results?: unknown }).results !== undefined)
              : false;
          }
        } catch {}
        closeFinal();
      };

      try { (finalEs as unknown as EventSource).addEventListener?.("message", handleOnce as EventListener); } catch {}
      try { (finalEs as unknown as EventSource).addEventListener?.("flow:updated", handleOnce as EventListener); } catch {}
      finalEs.onerror = () => { closeFinal(); };
      setTimeout(() => { closeFinal(); }, 2500);
    } catch {
      hasFetchedFinalInfo = true;
    }
  }

  function connectSseIfNeeded() {
    if (!job.value) return;
    const config = useRuntimeConfig();
    const nodeAddress = (job.value.node as unknown as { toString?: () => string })?.toString?.() || (job.value.node as unknown as string);
    if (!nodeAddress || nodeAddress === DEFAULT_NODE_ADDRESS) {
      loading.value = false;
      return;
    }
    if (eventSource && currentNodeAddress === nodeAddress) return;
    if (eventSource) {
      try { eventSource.close(); } catch {}
      eventSource = null;
    }
    currentNodeAddress = nodeAddress;
    (async () => {
      try {
        const authHeader = await getAuthHeader(deploymentId);
        const sseUrl = `https://${nodeAddress}.${config.public.nodeDomain}/job/${jobId}/info`;
        eventSource = new EventSourcePolyfill(sseUrl, { headers: { Authorization: authHeader } });

        const sdkServices = job.value?.jobDefinition ? getJobExposedServices(job.value.jobDefinition, jobId) : [];
        const metaByPort = new Map<number, { opId: string; opIndex: number; hasHealthCheck: boolean }>();
        for (const { port, opId, opIndex, hasHealthCheck } of sdkServices) {
          metaByPort.set(Number(port), { opId, opIndex, hasHealthCheck });
        }

        const handleInfo = (event: MessageEvent) => {
          try {
            const info = JSON.parse(event.data) as JobInfo;
            jobInfo.value = {
              ...info,
              jobDefinition: job.value?.jobDefinition ?? info.jobDefinition,
            } as JobInfo;

            if (!job.value?.jobDefinition && info.jobDefinition) {
              try {
                job.value = { ...(job.value as JobViewModel), jobDefinition: info.jobDefinition };
              } catch {}
            }

            const normalized = normalizeEndpoints(info, jobId, metaByPort);
            if (normalized.size > 0) {
              const newEndpoints = new Map(endpoints.value);
              for (const [url, endpoint] of normalized.entries()) {
                newEndpoints.set(url, endpoint);
              }
              endpoints.value = newEndpoints;
            }

            const sseResults = (info as unknown as { results?: ResultsSection }).results;
            if (sseResults && job.value) {
              const isConfidentialJob = Boolean((job.value.jobDefinition as unknown as { logistics?: unknown })?.logistics);
              const isPoster = Boolean(activeAddress.value && job.value.project && activeAddress.value === (job.value.project as unknown as { toString?: () => string })?.toString?.());
              if (!isConfidentialJob || isPoster) {
                job.value.results = sseResults;
                job.value.hasResultsRegex = Array.isArray(sseResults.opStates)
                  ? sseResults.opStates.some((op) => (op as { results?: unknown }).results !== undefined)
                  : false;
              }
            }
            loading.value = false;
          } catch (err) {
            console.error("Failed to parse SSE message:", err);
          }
        };

        try { (eventSource as unknown as EventSource).addEventListener?.("message", handleInfo as EventListener); } catch {}
        try { (eventSource as unknown as EventSource).addEventListener?.("flow:updated", handleInfo as EventListener); } catch {}

        eventSource.onerror = () => {
          loading.value = false;
        };
        eventSource.onopen = () => { loading.value = false; };
      } catch (error) {
        console.error("Failed to create EventSource:", error);
        loading.value = false;
      }
    })();
  }

  async function init() {
    loading.value = true;
    const initial = await fetchDeploymentJob();
    if (initial) {
      assignFromApi(initial);
      if (getStateNumber(initial.state) === 1) {
        connectSseIfNeeded();
      } else {
        loading.value = false;
      }
    } else {
      loading.value = false;
    }
  }

  onMounted(() => { init(); });
  onBeforeUnmount(() => { if (eventSource) { try { eventSource.close(); } catch {} eventSource = null; } });

  return {
    job,
    endpoints,
    loading,
    jobInfo,
  } as const;
}


