<template>
  <div
    ref="outerRef"
    class="log-collector-viewer"
    @scroll="handleScroll"
  >
    <div v-if="isConnecting && entries.length === 0" class="connecting-message">
      Loading logs...
    </div>

    <div
      v-if="entries.length === 0 && !isConnecting"
      class="empty-message"
    >
      No log entries to display
    </div>

    <!-- Table header -->
    <div v-show="entries.length > 0" class="log-table-header">
      <span v-if="showJobBadges" class="col-job">Job</span>
      <span class="col-date">Date</span>
      <span class="col-op">Op</span>
      <span class="col-level">Level</span>
      <span class="col-desc">Log</span>
    </div>

    <!-- Top scroll status -->
    <div v-if="loadingOlderLogs" class="scroll-status loading">
      Loading older logs...
    </div>
    <div v-else-if="allLogsLoaded && entries.length > 0" class="scroll-status done">
      All logs loaded
    </div>

    <div
      v-show="entries.length > 0"
      :style="{ height: totalSize + 'px', width: '100%', position: 'relative' }"
    >
      <div
        v-for="item in virtualItems"
        :key="entries[item.index]?.id ?? item.index"
        :data-index="item.index"
        :ref="(el) => measureElement(el as HTMLElement | null)"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${item.start}px)`,
        }"
        class="log-row"
        :class="'row-' + entries[item.index]?.type"
      >
        <span v-if="showJobBadges" class="col-job">
          <LogCollectorJobBadge
            :jobId="entries[item.index].jobId"
            :index="jobIndexMap.get(entries[item.index].jobId) ?? 0"
          />
        </span>
        <span class="col-date">{{ formatEpochMs(entries[item.index].timestamp) }}</span>
        <span class="col-op">{{ entries[item.index].opId || '-' }}</span>
        <span class="col-level">
          <span class="level-tag" :class="'level-' + entries[item.index].type">
            {{ logTypeLabel(entries[item.index].type) }}
          </span>
        </span>
        <span class="col-desc" v-html="entries[item.index].content"></span>
      </div>
    </div>

    <LogCollectorProgressBars
      :progressBars="progressBars"
      :resourceProgressBars="resourceProgressBars"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRef } from 'vue';
import { useVirtualizer } from '@tanstack/vue-virtual';
import type { UnifiedLogEntry } from '~/composables/jobs/logCollectorTypes';
import type { ProgressBar } from '~/composables/jobs/logTypes';
import { logTypeLabel, formatEpochMs } from '~/composables/jobs/logCollectorUtils';
import { useLogScroll } from '~/composables/jobs/useLogScroll';
import LogCollectorJobBadge from './LogCollectorJobBadge.vue';
import LogCollectorProgressBars from './LogCollectorProgressBars.vue';

const props = defineProps<{
  entries: UnifiedLogEntry[];
  progressBars: Map<string, ProgressBar>;
  resourceProgressBars: Map<string, Record<string, unknown>>;
  isConnecting: boolean;
  showJobBadges: boolean;
  jobs: { job: string }[];
  loadingOlderLogs: boolean;
  allLogsLoaded: boolean;
}>();

const emit = defineEmits<{
  'scrolledNearTop': [];
}>();

const jobIndexMap = computed(() => {
  const map = new Map<string, number>();
  props.jobs.forEach((j, i) => map.set(j.job, i));
  return map;
});

const outerRef = ref<HTMLElement | null>(null);

const virtualizer = useVirtualizer({
  get count() {
    return props.entries.length;
  },
  getScrollElement: () => outerRef.value,
  estimateSize: () => 26,
  overscan: 30,
});

const virtualItems = computed(() => virtualizer.value.getVirtualItems());
const totalSize = computed(() => virtualizer.value.getTotalSize());

function measureElement(el: HTMLElement | null) {
  if (el) {
    virtualizer.value.measureElement(el);
  }
}

const { handleScroll, scrollToBottom } = useLogScroll({
  entries: toRef(props, 'entries'),
  outerRef,
  virtualizer,
  allLogsLoaded: toRef(props, 'allLogsLoaded'),
  loadingOlderLogs: toRef(props, 'loadingOlderLogs'),
  onScrolledNearTop: () => emit('scrolledNearTop'),
});

defineExpose({ scrollToBottom });
</script>

<style lang="scss" scoped>
.log-collector-viewer {
  font-family: "JetBrains Mono", monospace;
  background-color: #0d1117;
  color: #c9d1d9;
  border-radius: 4px;
  overflow-y: auto;
  height: 100%;
  min-width: 0;
  flex: 1;
  position: relative;
}

.log-table-header {
  display: flex;
  align-items: center;
  padding: 0.4rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6e7681;
  border-bottom: 1px solid #21262d;
  position: sticky;
  top: 0;
  background: #0d1117;
  z-index: 1;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.log-row {
  display: flex;
  align-items: flex-start;
  padding: 0.2rem 0.6rem;
  font-size: 0.85rem;
  border-bottom: 1px solid rgba(#21262d, 0.5);
  line-height: 1.45;

  &.row-error {
    background: rgba(#dc2626, 0.06);
  }

  &:hover {
    background: rgba(#ffffff, 0.03);
  }
}

.col-level {
  width: 55px;
  flex-shrink: 0;
  text-align: center;
  padding-right: 0.3rem;
}

.col-date {
  width: 120px;
  flex-shrink: 0;
  color: #6e7681;
  font-size: 0.8rem;
  padding-right: 0.4rem;
}

.col-op {
  width: 100px;
  flex-shrink: 0;
  color: #6e7681;
  font-size: 0.8rem;
  padding-right: 0.4rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-job {
  width: 75px;
  flex-shrink: 0;
  padding-right: 0.4rem;
}

.col-desc {
  flex: 1;
  min-width: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.scroll-status {
  text-align: center;
  padding: 0.5rem;
  font-size: 0.75rem;

  &.loading {
    color: #58a6ff;
  }

  &.done {
    color: #3d434a;
  }
}

.level-tag {
  display: inline-block;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0.05rem 0.3rem;
  border-radius: 3px;
  line-height: 1.4;

  &.level-container { color: #8b949e; background: rgba(#8b949e, 0.12); }
  &.level-system { color: #58a6ff; background: rgba(#58a6ff, 0.12); }
  &.level-error { color: #f85149; background: rgba(#f85149, 0.15); }
}

.connecting-message {
  color: #ffffff;
  text-align: center;
  padding: 2rem;
  font-size: 0.9rem;
}

.empty-message {
  color: #6e7681;
  text-align: center;
  padding: 2rem;
  font-size: 0.9rem;
}

@import "~/assets/styles/_ansi-colors.scss";
:deep() { @include ansi-colors; }
</style>
