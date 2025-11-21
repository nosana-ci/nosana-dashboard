<template>
  <div ref="iconRef" class="status-tag-wrapper">
    <div
      v-if="!imageOnly"
      class="tag status-tag"
      :class="[{ 'is-outlined': outlined }, getStatusClass(statusString)]"
    >
      <span class="status-icon-wrap">
        <component
          class="mr-2"
          :is="getIconComponent(statusString)"
          :key="statusString"
        />
      </span>
      <span v-if="showLabel">{{ statusString }}</span>
    </div>
    <span
      v-else
      class="status-icon-wrap status-tag"
      :class="getStatusClass(statusString)"
    >
      <component :is="getIconComponent(statusString)" :key="statusString" />
    </span>
  </div>
</template>

<script setup lang="ts">
import RunningIcon from "@/assets/img/icons/status/running.svg?component";
import StoppedIcon from "@/assets/img/icons/status/stopped.svg?component";
import FailedIcon from "@/assets/img/icons/status/failed.svg?component";
import QueuedIcon from "@/assets/img/icons/status/queued.svg?component";
import DoneIcon from "@/assets/img/icons/status/done.svg?component";
import ArchiveIcon from "@/assets/img/icons/archive.svg?component";
import { useStatus } from "~/composables/useStatus";

const { getStatusClass } = useStatus();

const props = withDefaults(
  defineProps<{
    status: string | number;
    fallbackState?: string | number;
    imageOnly?: boolean;
    outlined?: boolean;
    showLabel?: boolean;
  }>(),
  { imageOnly: false, outlined: true, showLabel: true }
);

const mapNumericState = (val: number): string => {
  if (val === 0) return "QUEUED";
  if (val === 1) return "RUNNING";
  if (val === 2) return "COMPLETED";
  if (val === 3) return "STOPPED";
  return "STOPPED";
};

const VALID_STATUS_MAP: Record<string, string> = {
  SUCCESS: "SUCCESS",
  FAILED: "FAILED", 
  STOPPED: "STOPPED",
  STOPPING: "STOPPING",
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  STARTING: "STARTING",
  COMPLETED: "COMPLETED",
  DRAFT: "DRAFT",
  ERROR: "ERROR",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  ARCHIVED: "ARCHIVED",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE", 
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
  UNKNOWN: "UNKNOWN",
  LOADING: "LOADING"
};

const isEmptyOrInvalid = (val: string): boolean => {
  const lowered = val.toLowerCase().trim();
  return lowered === "null" || lowered === "undefined" || lowered === "";
};

const normalizeStringStatus = (val: string): string | null => {
  const upperVal = val.toUpperCase().trim();
  return VALID_STATUS_MAP[upperVal] || null;
};

const mapStringState = (val: string): string | null => {
  if (isEmptyOrInvalid(val)) {
    return null;
  }
  return normalizeStringStatus(val);
};

const mapFallbackStringState = (val: string): string => {
  if (isEmptyOrInvalid(val)) {
    return "STOPPED";
  }
  return normalizeStringStatus(val) ?? "STOPPED";
};

const statusString = computed(() => {
  const primary = props.status;
  let resolved: string | null = null;
  let isPrimary = true;

  if (typeof primary === "number") {
    resolved = mapNumericState(primary);
  } else if (typeof primary === "string") {
    const stringResult = mapStringState(primary);
    if (stringResult) {
      resolved = stringResult;
    } else {
      isPrimary = false;
    }
  } else {
    isPrimary = false;
  }

  if (!isPrimary || !resolved) {
    const fb = props.fallbackState;
    if (typeof fb === "number") {
      resolved = mapNumericState(fb);
    } else if (typeof fb === "string") {
      resolved = mapFallbackStringState(fb);
    } else {
      resolved = "STOPPED";
    }
  }

  return resolved as string;
});

const ICON_MAP: Record<string, any> = {
  QUEUED: QueuedIcon,
  DRAFT: QueuedIcon,
  RUNNING: RunningIcon,
  STARTING: RunningIcon,
  STOPPING: StoppedIcon,
  COMPLETED: DoneIcon,
  SUCCESS: DoneIcon,
  FAILED: FailedIcon,
  YAML_ERROR: FailedIcon,
  ERROR: FailedIcon,
  INSUFFICIENT_FUNDS: FailedIcon,
  ARCHIVED: ArchiveIcon,
  ACTIVE: RunningIcon,
  INACTIVE: StoppedIcon,
  ONLINE: DoneIcon,
  OFFLINE: StoppedIcon,
  UNKNOWN: QueuedIcon,
  LOADING: QueuedIcon,
  STOPPED: StoppedIcon
};

const getIconComponent = (status: string) => {
  return ICON_MAP[status] || StoppedIcon;
};

const iconRef = ref<HTMLElement | null>(null);

// Ensure SVG animations start immediately (fixes delay on route navigation)
const ensureAnimationStarts = () => {
  if (!iconRef.value) return;

  const svg = iconRef.value.querySelector("svg");
  if (!svg) return;

  const animations = svg.querySelectorAll("animateTransform");
  animations.forEach((anim: any) => {
    try {
      // Force restart: end current animation and begin new one
      anim.endElement();
      anim.beginElement();

      // Force immediate visual update - this fixes the 2-second delay
      const parentSvg = anim.closest("svg");
      if (parentSvg) {
        // Force browser to recalculate styles and start animation immediately
        parentSvg.style.animationPlayState = "paused";
        parentSvg.getBoundingClientRect(); // Force layout
        parentSvg.style.animationPlayState = "running";
      }
    } catch (e) {
      // Fallback: just begin if end fails
      try {
        anim.beginElement();
      } catch {}
    }
  });
};

// Restart animations when component mounts or status changes
onMounted(() => {
  nextTick(ensureAnimationStarts);
});

watch(
  () => statusString.value,
  () => {
    nextTick(ensureAnimationStarts);
  }
);
</script>

<style lang="scss" scoped>
.status-tag-wrapper {
  display: inline-block;
}

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
