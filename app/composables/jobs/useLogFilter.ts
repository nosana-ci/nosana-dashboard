import { ref, computed, type Ref } from 'vue';
import { JobState } from '@nosana/kit';
import type { JobItem, UnifiedLogEntry, LogFilterState } from './logCollectorTypes';
import { extractPlainText, resolveJobState, LOG_TYPES, type LogEntryType } from './logCollectorUtils';

export function useLogFilter(
  entries: Ref<UnifiedLogEntry[]>,
  jobs: Ref<JobItem[]>,
  selectedJobIds: Ref<Set<string>>,
) {
  const selectedOpId = ref('');
  const activeTypes = ref<Set<LogEntryType>>(new Set());
  const searchText = ref('');

  const filterState = computed<LogFilterState>(() => ({
    jobIds: selectedJobIds.value,
    opIds: selectedOpId.value ? new Set([selectedOpId.value]) : new Set(),
    types: activeTypes.value,
    searchText: searchText.value,
  }));

  const filtered = computed(() => {
    const f = filterState.value;
    const all = entries.value;

    const hasJobFilter = f.jobIds.size > 0;
    const hasOpFilter = f.opIds.size > 0;
    const hasTypeFilter = f.types.size > 0;
    const search = f.searchText.toLowerCase().trim();
    const hasSearch = search.length > 0;

    if (!hasJobFilter && !hasOpFilter && !hasTypeFilter && !hasSearch) {
      return all;
    }

    return all.filter((entry) => {
      if (hasJobFilter && !f.jobIds.has(entry.jobId)) return false;
      if (hasOpFilter && (entry.opId === null || !f.opIds.has(entry.opId))) return false;
      if (hasTypeFilter && !f.types.has(entry.type)) return false;
      if (hasSearch && !extractPlainText(entry).includes(search)) return false;
      return true;
    });
  });

  function toggleJob(jobId: string) {
    if (selectedJobIds.value.has(jobId)) selectedJobIds.value.delete(jobId);
    else selectedJobIds.value.add(jobId);

    selectedJobIds.value = new Set(selectedJobIds.value);
  }

  function selectAllJobs() {
    selectedJobIds.value = new Set();
  }

  function selectState(state: JobState) {
    const ids = jobs.value
      .filter((j) => resolveJobState(j.state) === state)
      .map((j) => j.job);
    selectedJobIds.value = new Set(ids);
  }

  function toggleLevel(type: LogEntryType) {
    if (activeTypes.value.size === 0) {
      for (const t of LOG_TYPES) {
        if (t.value !== type) activeTypes.value.add(t.value);
      }
    } else if (activeTypes.value.has(type)) {
      activeTypes.value.delete(type);
    } else {
      activeTypes.value.add(type);
    }
    activeTypes.value = new Set(activeTypes.value);
  }

  function showAllLevels() {
    activeTypes.value = new Set();
  }

  function clearLevels() {
    activeTypes.value = new Set(['container']);
  }

  return {
    selectedOpId,
    activeTypes,
    searchText,
    filtered,
    toggleJob,
    selectAllJobs,
    selectState,
    toggleLevel,
    showAllLevels,
    clearLevels,
  };
}
