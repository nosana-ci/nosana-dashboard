<template>
  <div v-if="!imageOnly" class="tag is-outlined is-light status-tag" :class="getStatusClass(statusString)">
    <span ref="iconRef" class="status-icon-wrap">
      <component
        class="mr-2"
        :is="getIconComponent(statusString as string)"
        :key="statusString"
      />
    </span>

    <span v-if="!imageOnly">{{ statusString }}</span>
  </div>
  <span v-else ref="iconRef" class="status-icon-wrap status-tag" :class="getStatusClass(statusString)">
    <component :is="getIconComponent(statusString as string)" :key="statusString" />
  </span>
</template>

<script setup lang="ts">
import RunningIcon from '@/assets/img/icons/status/running.svg?component';
import StoppedIcon from '@/assets/img/icons/status/stopped.svg?component';
import FailedIcon from '@/assets/img/icons/status/failed.svg?component';
import QueuedIcon from '@/assets/img/icons/status/queued.svg?component';
import DoneIcon from '@/assets/img/icons/status/done.svg?component';
import { useStatus } from '~/composables/useStatus';

const { getStatusClass } = useStatus();
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
      
      // Mark as processed
      a.__dbg = true;

      // Force restart animation by manipulating the dur attribute
      const originalDur = a.getAttribute('dur') || '5s';
      a.setAttribute('dur', '0.001s');
      
      // Use multiple approaches to ensure animation starts
      requestAnimationFrame(() => {
        try {
          a.setAttribute('dur', originalDur);
          a.beginElement();
        } catch {}
        
        // Backup approach: restart animation
        setTimeout(() => {
          try {
            a.endElement();
            a.beginElement();
          } catch {}
        }, 10);
      });
    });
  } catch (e) {
    // no-op
  }
};

const instrumentSvg = (label: string) => {
  const root = iconRef.value as HTMLElement | null;
  const svg = root?.querySelector('svg') as SVGElement | null;
  if (!svg) return;
  
  // Force immediate visibility calculation
  try { 
    svg.getBoundingClientRect(); 
    // Force layout/paint
    svg.style.transform = 'translateZ(0)';
  } catch {}

  // Try multiple times to ensure animation starts
  let attempts = 0;
  const tryStartAnimation = () => {
    attempts++;
    attachSmilDebugListeners(svg, `${label}-attempt-${attempts}`);
    
    if (attempts < 3) {
      setTimeout(tryStartAnimation, 50 * attempts);
    }
  };
  
  // Start immediately and with delays
  tryStartAnimation();

  try {
    const observer = new IntersectionObserver(() => {
      // When element becomes visible, try again
      tryStartAnimation();
    }, { threshold: [0, 0.01, 0.25, 0.5, 0.75, 1] });
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
    background: transparent !important;
    border: none !important;
    padding: 0 !important;

    img {
      margin: 0 !important;
    }

    span:not(.status-icon-wrap) {
      display: none;
    }
    
    // Preserve color inheritance for status icons
    &.status-tag {
      svg {
        color: inherit !important;
      }
    }
  }
}
</style>
