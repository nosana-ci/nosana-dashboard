import { ref, computed, type Ref, type ShallowRef } from 'vue';
import { JobState } from '@nosana/kit';
import type { JobItem, UnifiedLogEntry } from './logCollectorTypes';
import type { FLogEntry } from './useFLogs';
import { useFLogs } from './useFLogs';
import { NULL_ADDRESS } from '~/utils/solana';
import { resolveJobState } from './logCollectorUtils';
import { makeEntry, insertSorted } from './logEntryUtils';
import type { ProgressBar } from './logTypes';

export interface FLogInstance {
  jobId: string;
  systemLogs: Ref<FLogEntry[]>;
  logsByOp: Ref<Map<string, FLogEntry[]>>;
  progressBars: Ref<Map<string, ProgressBar>>;
  resourceProgressBars: Ref<Map<string, Record<string, unknown>>>;
  isConnecting: Ref<boolean>;
  connectionEstablished: Ref<boolean>;
}

interface UseLiveLogsDeps {
  entries: ShallowRef<UnifiedLogEntry[]>;
  seq: Ref<number>;
  getAuth: () => Promise<string>;
}

export function useLiveLogs(deps: UseLiveLogsDeps) {
  const instances = new Map<string, FLogInstance>();

  const opIds = ref<Set<string>>(new Set());

  const anyConnecting = computed(() =>
    [...instances.values()].some((inst) => inst.isConnecting.value),
  );

  function handleEntry(flog: FLogEntry, jobId: string, flogOpId: string) {
    const opId = flogOpId === 'system' ? null : flogOpId;
    if (opId) opIds.value.add(opId);

    const entry = makeEntry(
      ++deps.seq.value, jobId, opId,
      opId ? 'container' : 'system',
      flog.timestamp,
      flog.content,
    );
    deps.entries.value = insertSorted(deps.entries.value, [entry]);
  }

  function createInstance(jobId: string, node: string) {
    if (instances.has(jobId)) return;

    const nodeRef = ref(node);
    const shouldConnect = computed(() => !!nodeRef.value && nodeRef.value !== NULL_ADDRESS);
    const flog = useFLogs(jobId, nodeRef, shouldConnect, deps.getAuth, {
      onEntry: (entry, opId) => handleEntry(entry, jobId, opId),
    });

    instances.set(jobId, {
      jobId,
      systemLogs: flog.systemLogs,
      logsByOp: flog.logsByOp,
      progressBars: flog.progressBars,
      resourceProgressBars: flog.resourceProgressBars,
      isConnecting: flog.isConnecting,
      connectionEstablished: flog.connectionEstablished,
    });
  }

  function removeInstance(jobId: string) {
    instances.delete(jobId);
  }

  function sync(jobs: JobItem[]) {
    const currentJobIds = new Set(jobs.map((j) => j.job));

    // Remove stale instances
    for (const jobId of instances.keys()) {
      if (!currentJobIds.has(jobId)) {
        removeInstance(jobId);
      }
    }

    // Create/remove instances based on job state
    for (const job of jobs) {
      const state = resolveJobState(job.state);

      if (state === JobState.RUNNING && job.node && job.node !== NULL_ADDRESS) {
        createInstance(job.job, job.node);
      }

      if (state >= JobState.COMPLETED && instances.has(job.job)) {
        removeInstance(job.job);
      }
    }
  }

  function dispose() {
    instances.clear();
  }

  return {
    instances,
    opIds,
    anyConnecting,
    sync,
    dispose,
  };
}
