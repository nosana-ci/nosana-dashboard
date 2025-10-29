<template>
  <div
    v-if="!imageOnly"
    class="tag status-tag"
    :class="[{ 'is-outlined': outlined }, getStatusClass(statusString)]"
  >
    <span ref="iconRef" class="status-icon-wrap">
      <component class="mr-2" :is="getIconComponent(statusString)" :key="statusString" />
    </span>
    <span v-if="showLabel">{{ statusString }}</span>
  </div>
  <span v-else ref="iconRef" class="status-icon-wrap status-tag" :class="getStatusClass(statusString)">
    <component :is="getIconComponent(statusString)" :key="statusString" />
  </span>
</template>

<script setup lang="ts">
import RunningIcon from '@/assets/img/icons/status/running.svg?component';
import StoppedIcon from '@/assets/img/icons/status/stopped.svg?component';
import FailedIcon from '@/assets/img/icons/status/failed.svg?component';
import QueuedIcon from '@/assets/img/icons/status/queued.svg?component';
import DoneIcon from '@/assets/img/icons/status/done.svg?component';
import ArchiveIcon from '@/assets/img/icons/archive.svg?component';
import { useStatus } from '~/composables/useStatus';

const { getStatusClass } = useStatus();

const props = withDefaults(defineProps<{
  status: string | number;
  fallbackState?: string | number;
  imageOnly?: boolean;
  outlined?: boolean;
  showLabel?: boolean;
}>(), {
  imageOnly: false,
  outlined: true,
  showLabel: true,
});

const mapNumericState = (val: number): string => {
  if (val === 0) return 'QUEUED';
  if (val === 1) return 'RUNNING';
  if (val === 2) return 'COMPLETED';
  if (val === 3) return 'STOPPED';
  return 'STOPPED';
};

const normalizeStringStatus = (val: string): string | null => {
  const v = val.toLowerCase().trim();
  if (v === 'success') return 'SUCCESS';
  if (v === 'failed') return 'FAILED';
  if (v === 'stopped') return 'STOPPED';
  if (v === 'stopping') return 'STOPPING';
  if (v === 'queued') return 'QUEUED';
  if (v === 'running') return 'RUNNING';
  if (v === 'starting') return 'STARTING';
  if (v === 'completed') return 'COMPLETED';
  if (v === 'draft') return 'DRAFT';
  if (v === 'error') return 'ERROR';
  if (v === 'insufficient_funds') return 'INSUFFICIENT_FUNDS';
  if (v === 'archived') return 'ARCHIVED';
  // Endpoint statuses
  if (v === 'online') return 'ONLINE';
  if (v === 'offline') return 'OFFLINE';
  if (v === 'unknown') return 'UNKNOWN';
  if (v === 'loading') return 'LOADING';
  return null;
};

const statusString = computed(() => {
  const primary = props.status as any;
  let resolved: string | null = null;
  let used: 'primary' | 'fallback' = 'primary';

  if (typeof primary === 'number') {
    resolved = mapNumericState(primary);
  } else if (typeof primary === 'string') {
    const lowered = primary.toLowerCase().trim();
    if (lowered !== 'null' && lowered !== 'undefined' && lowered !== '') {
      const normalized = normalizeStringStatus(primary);
      if (normalized) {
        resolved = normalized;
      } else {
        used = 'fallback';
      }
    } else {
      used = 'fallback';
    }
  } else {
    used = 'fallback';
  }

  if (used === 'fallback' || !resolved) {
    const fb = props.fallbackState as any;
    if (typeof fb === 'number') {
      resolved = mapNumericState(fb);
    } else if (typeof fb === 'string') {
      const lowered = fb.toLowerCase().trim();
      if (lowered === 'null' || lowered === 'undefined' || lowered === '') {
        resolved = 'STOPPED';
      } else {
        const normalized = normalizeStringStatus(fb);
        resolved = normalized ?? 'STOPPED';
      }
    } else {
      resolved = 'STOPPED';
    }
  }

  return resolved as string;
});

const getIconComponent = (status: string) => {
  if (status === 'QUEUED' || status === 'DRAFT') return QueuedIcon;
  if (status === 'RUNNING' || status === 'STARTING') return RunningIcon;
  if (status === 'STOPPING') return StoppedIcon; // Use stop square icon for stopping state
  if (status === 'COMPLETED' || status === 'SUCCESS') return DoneIcon;
  if (status === 'FAILED' || status === 'YAML_ERROR' || status === 'ERROR' || status === 'INSUFFICIENT_FUNDS') return FailedIcon;
  if (status === 'ARCHIVED') return ArchiveIcon; // Use archive icon for archived status
  // Endpoint statuses - reuse appropriate existing icons
  if (status === 'ONLINE') return DoneIcon; // Green checkmark for online
  if (status === 'OFFLINE') return FailedIcon; // Red X for offline  
  if (status === 'UNKNOWN' || status === 'LOADING') return QueuedIcon; // Orange ? for unknown/loading
  return StoppedIcon; // For STOPPED and any other states
};

const iconRef = ref<HTMLElement | null>(null);
</script>

<style lang="scss" scoped>
.tag {
  min-width: max-content;
}

@include until-widescreen {
  .tag {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;

    img {
      margin: 0 !important;
    }

    span:not(.status-icon-wrap) {
      display: none;
    }

    &.status-tag {
      svg {
        color: inherit !important;
      }
    }
  }
}
</style>


