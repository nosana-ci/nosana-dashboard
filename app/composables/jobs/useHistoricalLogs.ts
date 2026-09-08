import { ref, computed, type Ref, type ShallowRef, type ComputedRef } from 'vue';
import { JobState, type NosanaClient } from '@nosana/kit';
import type { DeploymentJob as ApiDeploymentJob } from '@nosana/api';
import type { JobItem, UnifiedLogEntry } from './logCollectorTypes';
import { resolveJobState, getJobTimeBounds } from './logCollectorUtils';
import { insertSorted } from './logEntryUtils';
import { parseJobResult } from './parseJobResult';

interface UseHistoricalLogsDeps {
  deploymentId: string;
  entries: ShallowRef<UnifiedLogEntry[]>;
  jobsMap: ComputedRef<Map<string, JobItem>>;
  seq: Ref<number>;
  nosana: Ref<NosanaClient>;
}

export function useHistoricalLogs(deps: UseHistoricalLogsDeps) {
  const opIds = ref<Set<string>>(new Set());
  const completedResults = ref<Record<string, boolean>>({});
  const loadingOlderLogs = ref(false);

  const allLogsLoaded = computed(() =>
    !deps.jobsMap.value.values().some(
      (job) => resolveJobState(job.state) >= JobState.COMPLETED && !completedResults.value[job.job],
    ),
  );

  async function fetchCompletedResult(jobId: string) {
    completedResults.value[jobId] = true;
    loadingOlderLogs.value = true;

    try {
      const dep = await deps.nosana.value.api.deployments.get(deps.deploymentId);
      const jobResponse = (await dep.getJob(jobId)) as ApiDeploymentJob;
      const jobResult = jobResponse?.jobResult;

      if (jobResult) {
        const jobBounds = getJobTimeBounds(deps.jobsMap.value.get(jobId)!);
        const parsed = parseJobResult(jobId, jobResult as unknown as Record<string, unknown>, jobBounds, deps.seq);

        for (const opId of parsed.opIds) {
          opIds.value.add(opId);
        }

        if (parsed.entries.length > 0) {
          const base = deps.entries.value.filter((e) => e.jobId !== jobId);
          deps.entries.value = insertSorted(base, parsed.entries);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch results for job ${jobId}:`, error);
    } finally {
      loadingOlderLogs.value = false;
    }
  }

  function getCompletedTimeline() {
    return [...deps.jobsMap.value.values()]
      .filter((job) => resolveJobState(job.state) >= JobState.COMPLETED)
      .map((job) => ({ jobId: job.job, ...getJobTimeBounds(job) }))
      .sort((a, b) => b.end - a.end);
  }

  let initialFetchDone = false;

  function autoFetchIfNoLiveJobs() {
    if (initialFetchDone) return;
    const hasRunning = [...deps.jobsMap.value.values()].some(
      (j) => resolveJobState(j.state) === JobState.RUNNING,
    );
    if (hasRunning) {
      initialFetchDone = true;
      return;
    }
    const timeline = getCompletedTimeline();
    const first = timeline[0];
    if (first && !completedResults.value[first.jobId]) {
      initialFetchDone = true;
      fetchCompletedResult(first.jobId);
    }
  }

  function loadOlderLogs() {
    if (loadingOlderLogs.value || allLogsLoaded.value) return;
    const timeline = getCompletedTimeline();
    for (const entry of timeline) {
      if (!completedResults.value[entry.jobId]) {
        fetchCompletedResult(entry.jobId);
        return;
      }
    }
  }

  function ensureJobsLoaded(jobIds: string[]) {
    let fetched = 0;
    for (const id of jobIds) {
      if (fetched >= 3) break;
      const job = deps.jobsMap.value.get(id);
      if (job && resolveJobState(job.state) >= JobState.COMPLETED && !completedResults.value[id]) {
        fetchCompletedResult(id);
        fetched++;
      }
    }
  }

  return {
    opIds,
    loadOlderLogs,
    loadingOlderLogs,
    allLogsLoaded,
    ensureJobsLoaded,
    autoFetchIfNoLiveJobs,
  };
}
