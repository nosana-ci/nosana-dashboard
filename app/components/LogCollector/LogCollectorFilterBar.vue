<template>
  <div class="filter-bar">
    <div class="search-combo" :class="{ focused: searchFocused }">
      <LogCollectorDropdown
        :label="activeJobLabel"
        dropdown-class="dropdown--jobs"
        menu-class="dropdown-menu--jobs"
      >
        <LogCollectorJobSelect
          :jobs="jobs"
          :selectedJobIds="selectedJobIds"
          @toggle="$emit('toggleJob', $event)"
          @selectState="$emit('selectState', $event)"
          @selectAll="$emit('selectAllJobs')"
        />
      </LogCollectorDropdown>

      <span class="combo-sep"></span>

      <LogCollectorDropdown :label="activeLevelLabel">
        <LogCollectorLevelSelect
          :activeTypes="activeTypes"
          @toggle="$emit('toggleLevel', $event)"
          @showAll="$emit('showAllLevels')"
          @clearLevels="$emit('clearLevels')"
        />
      </LogCollectorDropdown>

      <span class="combo-sep"></span>

      <template v-if="opIds.length > 0">
        <LogCollectorDropdown :label="activeOpLabel">
          <LogCollectorOpSelect
            :opIds="opIds"
            :selectedOpId="selectedOpId"
            @update:selectedOpId="$emit('update:selectedOpId', $event)"
          />
        </LogCollectorDropdown>

        <span class="combo-sep"></span>
      </template>

      <LogCollectorSearchInput
        :model-value="searchText"
        placeholder="Search log output..."
        @update:model-value="$emit('update:searchText', $event)"
        @update:focused="searchFocused = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JobItem } from '~/composables/jobs/logCollectorTypes';
import type { LogEntryType } from '~/composables/jobs/logCollectorUtils';
import LogCollectorDropdown from './LogCollectorDropdown.vue';
import LogCollectorSearchInput from './LogCollectorSearchInput.vue';
import LogCollectorJobSelect from './LogCollectorJobSelect.vue';
import LogCollectorLevelSelect from './LogCollectorLevelSelect.vue';
import LogCollectorOpSelect from './LogCollectorOpSelect.vue';

const props = defineProps<{
  jobs: JobItem[];
  selectedJobIds: Set<string>;
  opIds: string[];
  selectedOpId: string;
  activeTypes: Set<LogEntryType>;
  searchText: string;
}>();

const emit = defineEmits<{
  toggleJob: [jobId: string];
  selectState: [state: import('@nosana/kit').JobState];
  selectAllJobs: [];
  toggleLevel: [type: LogEntryType];
  showAllLevels: [];
  clearLevels: [];
  'update:selectedOpId': [value: string];
  'update:searchText': [value: string];
}>();

const searchFocused = ref(false);

const activeJobLabel = computed(() => {
  if (props.selectedJobIds.size === 0) return 'All jobs';
  if (props.selectedJobIds.size === 1) {
    const id = [...props.selectedJobIds][0]!;
    return id.slice(0, 12);
  }
  return `${props.selectedJobIds.size} jobs`;
});

const activeLevelLabel = computed(() => {
  if (props.activeTypes.size === 0) return 'All levels';
  if (props.activeTypes.size === 1) {
    const name = props.activeTypes.values().next().value;
    return name === 'container' ? 'Output' : name === 'error' ? 'Error' : 'System';
  }
  return `${props.activeTypes.size} levels`;
});

const activeOpLabel = computed(() => {
  if (!props.selectedOpId) return 'All ops';
  return props.selectedOpId;
});

</script>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0;
}

.search-combo {
  display: flex;
  align-items: stretch;
  border: 1px solid $border;
  border-radius: 6px;
  background: $scheme-main;
  flex: 1;
  position: relative;
  transition: border-color 0.15s, box-shadow 0.15s;

  &.focused {
    border-color: $link;
    box-shadow: 0 0 0 2px rgba($link, 0.12);
  }
}

.combo-sep {
  width: 1px;
  background: $border;
  flex-shrink: 0;
  margin: 0.35rem 0;
}

html.dark-mode {
  .search-combo {
    background: $black-ter;
    border-color: $grey-darker;

    &.focused { border-color: $link; }
  }

  .combo-sep { background: $grey-darker; }
}
</style>
