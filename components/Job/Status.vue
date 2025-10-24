<template>
  <div v-if="!imageOnly" class="tag is-outlined is-light status-tag" :class="{
    'is-success': statusString === 'SUCCESS' || statusString === 'COMPLETED',
    'is-info': statusString === 'RUNNING' || statusString === 'PENDING',
    'is-warning': statusString === 'QUEUED',
    'is-danger': statusString === 'FAILED' || statusString === 'YAML_ERROR',
    'is-dark': statusString === 'STOPPED'
  }">
    <span ref="iconRef" class="status-icon-wrap">
      <component
        class="mr-2"
        :is="getIconComponent(statusString as string)"
        :key="statusString"
      />
    </span>

    <span v-if="!imageOnly">{{ statusString }}</span>
  </div>
  <span v-else ref="iconRef" class="status-icon-wrap">
    <component :is="getIconComponent(statusString as string)" :key="statusString" />
  </span>
</template>

<script setup lang="ts">
import RunningIcon from '@/assets/img/icons/status/running.svg?component';
import StoppedIcon from '@/assets/img/icons/status/stopped.svg?component';
import FailedIcon from '@/assets/img/icons/status/failed.svg?component';
import QueuedIcon from '@/assets/img/icons/status/queued.svg?component';
import DoneIcon from '@/assets/img/icons/status/done.svg?component';
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

const getIconComponent = (status: string) => {
  if (status === 'QUEUED') return QueuedIcon;
  if (status === 'RUNNING') return RunningIcon;
  if (status === 'COMPLETED' || status === 'SUCCESS') return DoneIcon;
  if (status === 'FAILED' || status === 'YAML_ERROR') return FailedIcon;
  return StoppedIcon;
};

// Debug: instrument SVG mount and SMIL lifecycle
const iconRef = ref<HTMLElement | null>(null);

const attachSmilDebugListeners = (svgEl: SVGElement, contextLabel: string) => {
  try {
    const animations = svgEl.querySelectorAll('animateTransform');
    animations.forEach((anim) => {
      const a = anim as SVGAnimateElement & { __dbg?: boolean };
      if (a.__dbg) return;
      // Attach listeners to ensure the browser sets up SMIL timelines
      a.addEventListener('beginEvent', () => {});
      a.addEventListener('repeatEvent', () => {});
      a.addEventListener('endEvent', () => {});
      a.__dbg = true;

      // Attempt to force-start the SMIL animation immediately
      try {
        a.beginElement();
      } catch {}
    });
  } catch (e) {
    // no-op
  }
};

const instrumentSvg = (label: string) => {
  const root = iconRef.value as HTMLElement | null;
  const svg = root?.querySelector('svg') as SVGElement | null;
  if (!svg) return;
  attachSmilDebugListeners(svg, label);

  // Log visibility and bounding box, observe viewport intersection
  try { void svg.getBoundingClientRect(); } catch {}

  try {
    const observer = new IntersectionObserver(() => {}, { threshold: [0, 0.01, 0.25, 0.5, 0.75, 1] });
    observer.observe(svg);
  } catch {}
};

onMounted(() => {
  nextTick(() => instrumentSvg(`mounted status=${statusString.value}`));
});

watch(statusString, (val) => {
  nextTick(() => instrumentSvg(`statusChanged status=${val}`));
});
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
