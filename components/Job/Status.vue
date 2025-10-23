<template>
  <div v-if="!imageOnly" class="tag is-outlined is-light" :class="{
    'is-success': statusString === 'SUCCESS',
    'is-info': statusString === 'RUNNING' || statusString === 'PENDING',
    'is-warning': statusString === 'QUEUED',
    'is-danger': statusString === 'FAILED' || statusString === 'YAML_ERROR',
  }">
    <img class="mr-2" :src="`/img/icons/status/${getIcon(statusString as string)}.svg`" />

    <span v-if="!imageOnly">{{ statusString }}</span>
  </div>
  <img v-else :src="`/img/icons/status/${getIcon(statusString as string)}.svg`" />
</template>

<script setup lang="ts">
const props = defineProps({
  status: {
    type: [String, Number],
    required: true,
  },
  fallbackState: {
    type: [String, Number],
    required: false,
    default: undefined,
  },
  imageOnly: {
    type: Boolean,
    default: false,
  },
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
  if (v === 'queued') return 'QUEUED';
  if (v === 'running') return 'RUNNING';
  if (v === 'completed') return 'COMPLETED';
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
    used = 'fallback';
  }

 
  return resolved as string;
});

const getIcon = (status: string) => {
  let icon = 'stopped';
  if (status === 'QUEUED') {
    icon = 'queued';
  } else if (status === 'RUNNING') {
    icon = 'running';
  } else if (status === 'COMPLETED' || status === 'SUCCESS') {
    icon = 'done';
  } else if (status === 'FAILED' || status === 'YAML_ERROR') {
    icon = 'failed';
  }
  return icon;
};
</script>

<style lang="scss" scoped>
.tag {
  min-width: max-content;
}

@include until-widescreen {
  .tag {
    background: none !important;
    border: none !important;
    padding: 0 !important;

    img {
      margin: 0 !important;
    }

    span {
      display: none;
    }
  }
}
</style>
