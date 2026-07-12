import type { Deployment, JobDefinition } from "@nosana/kit";
import type {
  DeploymentJobItem,
  DeploymentEventItem,
  DeploymentRevisionItem,
} from "@nosana/api";
import { useKit } from "~/composables/useKit";

export interface DeploymentDetailDeps {
  hasAnyAuth: Ref<boolean>;
  isWalletMode: Ref<boolean>;
  activeTab: Ref<string>;
}

export function useDeploymentDetail(deps: DeploymentDetailDeps) {
  const route = useRoute();
  const { nosana } = useKit();

  // Core state
  const deployment = ref<Deployment | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  // Sub-resource state
  const deploymentJobs = ref<DeploymentJobItem[]>([]);
  const deploymentEventsData = ref<DeploymentEventItem[]>([]);
  const deploymentRevisions = ref<DeploymentRevisionItem[]>([]);
  const tasks = ref<any[]>([]);

  // Loading flags
  const jobsLoading = ref(false);
  const eventsLoading = ref(false);
  const revisionsLoading = ref(false);
  const tasksLoading = ref(false);

  // Preloaded deployment from navigation
  const preloadedDeployment = useState<Deployment | null>(
    "preloadedDeployment",
    () => null,
  );

  // Job states extracted from deployment response
  const jobStates = ref<Record<string, number>>({});
  const allJobsData = ref<Record<string, any>>({});

  // Helper function to convert job state string to number
  const jobStateStringToNumber = (
    state: string | number | undefined,
  ): number => {
    if (typeof state === "number") return state;
    if (!state) return 0;

    const stateUpper = String(state).toUpperCase();
    const stateMap: Record<string, number> = {
      QUEUED: 0,
      RUNNING: 1,
      COMPLETED: 2,
      STOPPED: 3,
    };

    return stateMap[stateUpper] ?? 0;
  };

  const applyDeploymentSnapshot = (dep: Deployment) => {
    deployment.value = dep;
    jobStates.value = {};
    allJobsData.value = {};
    if (deploymentJobs.value) {
      for (const job of deploymentJobs.value) {
        const stateNum = jobStateStringToNumber(job.state);
        jobStates.value[job.job] = stateNum;
        allJobsData.value[job.job] = job;
      }
    }
  };

  // Sub-resource loaders
  const loadJobs = async (silent = false) => {
    if (!deployment.value) return;
    if (silent !== true) jobsLoading.value = true;

    try {
      const result = await deployment.value.getJobs();
      deploymentJobs.value = result?.jobs || [];
    } catch (err: any) {
      console.error("Load jobs error:", err);
      if (!silent) {
        console.error(`Failed to load jobs: ${err.message}`);
      }
    } finally {
      jobsLoading.value = false;
    }
  };

  const loadEvents = async (silent = false) => {
    if (!deployment.value) return;
    if (silent !== true) eventsLoading.value = true;

    try {
      const result = await deployment.value.getEvents();
      deploymentEventsData.value = result?.events || [];
    } catch (err: any) {
      console.error("Load events error:", err);
      if (!silent) {
        console.error(`Failed to load events: ${err.message}`);
      }
    } finally {
      eventsLoading.value = false;
    }
  };

  const loadRevisions = async (silent = false) => {
    if (!deployment.value) return;
    if (silent !== true) revisionsLoading.value = true;

    try {
      const result = await deployment.value.getRevisions();
      deploymentRevisions.value = result?.revisions || [];
    } catch (err: any) {
      console.error("Load revisions error:", err);
      if (!silent) {
        console.error(`Failed to load revisions: ${err.message}`);
      }
    } finally {
      revisionsLoading.value = false;
    }
  };

  const loadTasks = async (silent = false) => {
    if (!deployment.value) return;
    if (silent !== true) tasksLoading.value = true;

    try {
      const result = await deployment.value.getTasks();
      tasks.value = result?.tasks || [];
    } catch (err: any) {
      console.error("Load tasks error:", err);
      if (!silent) {
        console.error(`Failed to load tasks: ${err.message}`);
      }
    } finally {
      tasksLoading.value = false;
    }
  };

  // Main deployment loader
  // loadJobDefinition is injected after creation to avoid circular dependency
  let _loadJobDefinition: (() => Promise<void>) | null = null;

  const setLoadJobDefinition = (fn: () => Promise<void>) => {
    _loadJobDefinition = fn;
  };

  const loadDeployment = async (silent = false) => {
    // Skip parent deployment fetch when on job subroute
    if ((route.params as any)?.jobaddress) {
      if (!silent) loading.value = false;
      return;
    }
    if (!deps.hasAnyAuth.value) {
      error.value = "Please log in or connect wallet to view deployments";
      if (!silent) loading.value = false;
      return;
    }

    // Wait for SDK to be ready (wallet set for wallet users)
    if (deps.isWalletMode.value && !nosana.value.wallet) {
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (nosana.value.wallet) {
          break;
        }
      }
      if (!nosana.value.wallet) {
        await nextTick();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    try {
      if (!silent) {
        loading.value = true;
        error.value = null;
      }

      const deploymentId = route.params.id as string;
      if (
        preloadedDeployment.value &&
        preloadedDeployment.value.id === deploymentId
      ) {
        applyDeploymentSnapshot(preloadedDeployment.value);
        preloadedDeployment.value = null;
        if (!silent) {
          await loadRevisions();
          if (_loadJobDefinition) await _loadJobDefinition();
          await loadJobs();
          await loadEvents();
          await loadTasks();
        }
        return;
      }

      const data = await nosana.value.api.deployments.get(deploymentId);

      applyDeploymentSnapshot(data as Deployment);

      if (!silent) {
        await loadRevisions();
        if (_loadJobDefinition) await _loadJobDefinition();
        await loadJobs();
        await loadEvents();
        await loadTasks();
      }
    } catch (err: any) {
      console.error("Error loading deployment:", err);
      if (!silent) {
        error.value = `Failed to load deployment: ${err.message}`;
      }
    } finally {
      if (!silent) loading.value = false;
    }
  };

  // Computed properties
  const deploymentStatus = computed(() =>
    deployment.value?.status?.toUpperCase(),
  );

  const hasVault = computed(() => {
    if (!deployment.value || typeof deployment.value !== "object") return false;
    return "vault" in deployment.value;
  });

  const deploymentVault = computed(() => {
    if (
      !hasVault.value ||
      !deployment.value ||
      typeof deployment.value.vault !== "object"
    )
      return null;
    return (deployment.value as any).vault;
  });

  const deploymentSchedule = computed<string | null>(() => {
    const d = deployment.value as unknown as { schedule?: string } | null;
    return d?.schedule ?? null;
  });

  const hasActiveJobs = computed(() => {
    return Object.values(jobStates.value).some(
      (state) => state === 0 || state === 1 || state === 3,
    );
  });

  return {
    // Core state
    deployment,
    loading,
    error,

    // Sub-resource data
    deploymentJobs,
    deploymentEventsData,
    deploymentRevisions,
    tasks,

    // Loading flags
    jobsLoading,
    eventsLoading,
    revisionsLoading,
    tasksLoading,

    // Job state
    jobStates,
    allJobsData,
    jobStateStringToNumber,

    // Computed
    deploymentStatus,
    hasVault,
    deploymentVault,
    deploymentSchedule,
    hasActiveJobs,

    // Functions
    applyDeploymentSnapshot,
    loadDeployment,
    loadJobs,
    loadEvents,
    loadRevisions,
    loadTasks,
    setLoadJobDefinition,
  };
}
