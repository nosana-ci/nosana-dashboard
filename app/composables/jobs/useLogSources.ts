import { ref, shallowRef, computed, watch, onUnmounted, type Ref } from 'vue';
import type { JobItem, UnifiedLogEntry } from './logCollectorTypes';
import type { ProgressBar } from './logTypes';
import { useKit } from '~/composables/useKit';
import { useCvmAuth } from '~/composables/useCvmAuth';
import { isCvmMarket } from '~/utils/cvm';
import { getNodeJob } from '~/utils/kitJobAccess';
import { useLiveLogs } from './useLiveLogs';
import { useHistoricalLogs } from './useHistoricalLogs';

interface LogSourcesDeps {
  deploymentId: string;
  jobs: Ref<JobItem[]>;
  selectedJobIds: Ref<Set<string>>;
  market?: Ref<string | undefined>;
}

export function useLogSources(deps: LogSourcesDeps) {
  const { nosana } = useKit();
  const { getJobAuthHeader } = useCvmAuth();

  const entries = shallowRef<UnifiedLogEntry[]>([]);
  const seq = ref(0);

  const jobsMap = computed(() => {
    const map = new Map<string, JobItem>();
    for (const job of deps.jobs.value) {
      map.set(job.job, job);
    }
    return map;
  });

  const sortedJobs = computed(() => {
    const jobs = deps.jobs.value || [];
    return [...jobs].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  });

  const live = useLiveLogs({
    entries,
    seq,
    resolveNodeJob: (jobId) => getNodeJob(nosana.value.api, jobId, deps.deploymentId),
    isCvm: computed(() => isCvmMarket(deps.market?.value)),
    getJobAuth: getJobAuthHeader,
  });

  const historical = useHistoricalLogs({
    deploymentId: deps.deploymentId,
    entries,
    jobsMap,
    seq,
    nosana,
  });

  const allOpIds = computed(() =>
    Array.from(new Set([...live.opIds.value, ...historical.opIds.value])),
  );

  const allProgressBars = computed(() => {
    const bars = new Map<string, ProgressBar>();
    for (const [jobId, inst] of live.instances) {
      for (const [barId, bar] of inst.progressBars.value) {
        bars.set(`${jobId}:${barId}`, bar);
      }
    }
    return bars;
  });

  const allResourceProgressBars = computed(() => {
    const bars = new Map<string, Record<string, unknown>>();
    for (const [jobId, inst] of live.instances) {
      for (const [barId, bar] of inst.resourceProgressBars.value) {
        bars.set(`${jobId}:${barId}`, bar);
      }
    }
    return bars;
  });

  function syncJobs() {
    live.sync(deps.jobs.value || []);
  }

  watch(
    () => deps.jobs.value,
    () => {
      syncJobs();
      historical.autoFetchIfNoLiveJobs();
    },
    { immediate: true },
  );

  watch(deps.selectedJobIds, (ids) => {
    if (ids.size > 0) {
      historical.ensureJobsLoaded(Array.from(ids));
    }
  });

  onUnmounted(() => {
    live.dispose();
  });

  return {
    entries,
    allProgressBars,
    allResourceProgressBars,
    anyConnecting: live.anyConnecting,
    allOpIds,
    sortedJobs,
    loadOlderLogs: historical.loadOlderLogs,
    loadingOlderLogs: historical.loadingOlderLogs,
    allLogsLoaded: historical.allLogsLoaded,
  };
}
