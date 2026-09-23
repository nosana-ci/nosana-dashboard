import { getDeploymentJobData, getNodeJob } from "~/utils/kitJobAccess";
import { useToast } from "vue-toastification";
import { useWallet } from "@nosana/solana-vue";
import type { Job, JobDefinition } from "@nosana/kit";
import type { DeploymentJob as ApiDeploymentJob, NodeJobInfo, NodeStreamSubscription, NosanaApiClient } from "@nosana/api";
import type { JobInfo, JobViewModel, LiveEndpoints, ResultsSection } from "~/composables/jobs/types";
import { applyResults, mergeEndpoints, servicesByPort, type PortMeta } from "~/composables/jobs/jobInfoFrame";
import { useNodeJobResolver } from "~/composables/jobs/useNodeJobResolver";
import { acquireJobFeeds, type JobFeeds } from "~/composables/jobs/useJobFeeds";

const DEFAULT_NODE_ADDRESS = "11111111111111111111111111111111";

function getStateNumber(stateVal: string | number | undefined): number {
  if (stateVal === "QUEUED" || stateVal === 0) return 0;
  if (stateVal === "RUNNING" || stateVal === 1) return 1;
  if (stateVal === "COMPLETED" || stateVal === 2) return 2;
  if (stateVal === "STOPPED" || stateVal === 3) return 3;
  return -1;
}

// Use SDK type directly
type DeploymentJobApiResponse = ApiDeploymentJob;

// What a job view last knew, kept after it closes so the next open renders at
// once and refreshes behind the scenes. The job panel opens and closes often.
interface CachedJob {
  api: DeploymentJobApiResponse;
  jobInfo: JobInfo | null;
  endpoints: LiveEndpoints;
}
const jobCache = new Map<string, CachedJob>();
const prefetching = new Set<string>();
const cacheKey = (deploymentId: string, jobId: string) => `${deploymentId}:${jobId}`;

/**
 * Warm the cache for a job before it is opened: its API record, and the
 * node job resolution the info stream and shells will need.
 */
export async function prefetchDeploymentJob(
  api: NosanaApiClient,
  deploymentId: string,
  jobId: string,
): Promise<void> {
  const key = cacheKey(deploymentId, jobId);
  if (jobCache.has(key) || prefetching.has(key)) return;
  prefetching.add(key);
  try {
    const data = await getDeploymentJobData(api, deploymentId, jobId);
    if (!jobCache.has(key)) {
      jobCache.set(key, { api: data, jobInfo: null, endpoints: new Map() });
    }
    if (getStateNumber(data.state) === 1 && data.node && data.node !== DEFAULT_NODE_ADDRESS) {
      void getNodeJob(api, jobId, deploymentId).catch(() => {});
    }
  } catch {
    // Opening the job will load it in the usual way.
  } finally {
    prefetching.delete(key);
  }
}

/**
 * @param liveState The job's state as the page's live job list holds it, when
 *   the caller has one. The view fetches once on mount and is then fed by the
 *   node's info stream, which only exists while the job runs — so a replica
 *   that starts (or stops) while it is open would otherwise keep showing what
 *   it looked like on open. Watching the streamed state refreshes it instead.
 */
export function useDeploymentJob(
  deploymentId: string,
  jobId: string,
  liveState?: () => string | number | undefined,
) {
  const job = ref<JobViewModel | null>(null);
  const endpoints = ref<LiveEndpoints>(new Map());
  const jobInfo = ref<JobInfo | null>(null);
  const loading = ref<boolean>(true);

  const toast = useToast();
  const { nosana } = useKit();
  const { isAuthenticated: superTokensAuth, userData } = useSuperTokens();
  const { connected, account } = useWallet();

  const isCreditUser = computed(() => superTokensAuth.value);

  const activeAddress = computed(() => {
    if (superTokensAuth.value && userData.value?.generatedAddress) return userData.value.generatedAddress as string;
    if (connected.value && account.value?.address) return account.value.address;
    return null;
  });

  const resolveNodeJob = useNodeJobResolver(jobId, deploymentId);

  // The job's shared feeds (see useJobFeeds); held while the job runs here.
  let feeds: JobFeeds | null = null;
  let unsubscribeInfo: (() => void) | null = null;
  let currentNodeAddress: string | null = null;
  let hasFetchedFinalInfo = false;

  async function fetchDeploymentJob(): Promise<DeploymentJobApiResponse | null> {
    try {
      return await getDeploymentJobData(nosana.value.api, deploymentId, jobId);
    } catch (e) {
      console.error("Failed to fetch deployment job:", e);
      return null;
    }
  }

  function toResultsSection(result?: ApiDeploymentJob['jobResult']): ResultsSection | null {
    if (!result) return null;
    // Use SDK types directly - no mapping needed
    return result as ResultsSection;
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
            const resp = await $fetch<{ tx: string; job: string; delisted: boolean }>(`${config.public.apiBase}/jobs/${jobId}/stop`, {
              method: "POST",
              credentials: "include",
            });
            toast.success("Job stopped successfully!");
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
            await $fetch<{ tx: string; job: string; credits: { creditsUsed: number } }>(`${config.public.apiBase}/jobs/${jobId}/extend`, {
              method: "POST",
              body: { seconds: extensionSeconds },
              credentials: "include",
            });
            toast.success(`Job extended by ${extensionHours} hour${extensionHours !== 1 ? "s" : ""}!`);
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
      } catch { }
    }


    if (stateNum === 2 || stateNum === 3) {
      fetchFinalInfoOnce();
      disconnectInfo();
    }
  }

  function nodeAddressOf(): string | null {
    const raw = job.value?.node as unknown as { toString?: () => string } | string | undefined;
    const address = typeof raw === "string" ? raw : raw?.toString?.();
    return address && address !== DEFAULT_NODE_ADDRESS ? address : null;
  }

  // One frame of the node's job info stream: endpoints, per-op state and results.
  function applyInfo(frame: NodeJobInfo, metaByPort: PortMeta) {
    const info = frame as unknown as JobInfo;
    jobInfo.value = {
      ...info,
      jobDefinition: job.value?.jobDefinition ?? info.jobDefinition,
    } as JobInfo;

    if (job.value && !job.value.jobDefinition && info.jobDefinition) {
      job.value = { ...job.value, jobDefinition: info.jobDefinition };
    }

    mergeEndpoints(endpoints, info, jobId, metaByPort);
    const cached = jobCache.get(cacheKey(deploymentId, jobId));
    if (cached) {
      cached.jobInfo = jobInfo.value;
      cached.endpoints = new Map(endpoints.value);
    }

    const results = (info as unknown as { results?: ResultsSection }).results;
    if (results && job.value) {
      const isConfidentialJob = Boolean((job.value.jobDefinition as unknown as { logistics?: unknown })?.logistics);
      const isPoster = Boolean(activeAddress.value && job.value.project && activeAddress.value === (job.value.project as unknown as { toString?: () => string })?.toString?.());
      if (!isConfidentialJob || isPoster) applyResults(job.value, results);
    }
  }

  // A finished job still reports its final endpoints and results once.
  async function fetchFinalInfoOnce() {
    if (hasFetchedFinalInfo) return;
    hasFetchedFinalInfo = true;
    if (!nodeAddressOf()) return;
    try {
      const metaByPort = servicesByPort(job.value?.jobDefinition, jobId);
      const nodeJob = await resolveNodeJob();
      let finalStream: NodeStreamSubscription | null = null;
      const closeFinal = () => {
        finalStream?.close();
        finalStream = null;
      };
      finalStream = nodeJob.streamInfo({
        onData: (frame) => {
          applyInfo(frame, metaByPort);
          closeFinal();
        },
        onError: closeFinal,
      });
      setTimeout(closeFinal, 2500);
    } catch {
      // The node may already have released a finished job; the API data stands.
    }
  }

  function disconnectInfo() {
    unsubscribeInfo?.();
    unsubscribeInfo = null;
    feeds?.release();
    feeds = null;
    currentNodeAddress = null;
  }

  // Attach to the job's shared info stream. If the deployment page already
  // holds it, the latest frame is applied right away.
  function connectInfoStreamIfNeeded() {
    const nodeAddress = nodeAddressOf();
    if (!nodeAddress) {
      loading.value = false;
      return;
    }
    if (feeds && currentNodeAddress === nodeAddress) return;
    disconnectInfo();
    currentNodeAddress = nodeAddress;

    const metaByPort = servicesByPort(job.value?.jobDefinition, jobId);
    feeds = acquireJobFeeds(nosana.value.api, jobId, deploymentId);
    const latest = feeds.info.latest.value;
    if (latest) applyInfo(latest, metaByPort);
    unsubscribeInfo = feeds.info.subscribe((frame) => {
      applyInfo(frame, metaByPort);
    });
    loading.value = false;
  }

  function applyApi(api: DeploymentJobApiResponse) {
    assignFromApi(api);
    // The view is usable as soon as the job record is here; the node's info
    // stream fills in operations and endpoints when it opens.
    loading.value = false;
    if (getStateNumber(api.state) === 1) connectInfoStreamIfNeeded();
  }

  // Fetch the job record, cache it and render it. The view keeps showing the
  // previous record until the new one lands, so this doubles as a background
  // refresh; false means the fetch produced nothing.
  async function fetchAndApply(): Promise<boolean> {
    const latest = await fetchDeploymentJob();
    if (!latest) return false;
    const key = cacheKey(deploymentId, jobId);
    const entry = jobCache.get(key);
    if (entry) entry.api = latest;
    else jobCache.set(key, { api: latest, jobInfo: null, endpoints: new Map() });
    applyApi(latest);
    return true;
  }

  async function init() {
    const cached = jobCache.get(cacheKey(deploymentId, jobId));
    if (cached) {
      // Show what was last known, then refresh behind it.
      if (cached.jobInfo) {
        jobInfo.value = cached.jobInfo;
        endpoints.value = new Map(cached.endpoints);
      }
      applyApi(cached.api);
    } else {
      loading.value = true;
    }

    if (!(await fetchAndApply())) loading.value = false;
  }

  onMounted(() => { init(); });
  onBeforeUnmount(disconnectInfo);

  if (liveState) {
    watch(liveState, (state, previous) => {
      if (state !== undefined && state !== previous) void fetchAndApply();
    });
  }

  return {
    job,
    endpoints,
    loading,
    jobInfo,
  } as const;
}


