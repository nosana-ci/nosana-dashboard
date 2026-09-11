<template>
  <span
    class="smark"
    :class="[tone, { 'is-pulsing': pulse }]"
    :style="{ '--smark-size': `${size}px` }"
    :title="label"
  >
    <!-- Settled states get a glyph, ongoing ones a dot, so green can mean both
         "serving" and "finished" without the two reading alike. -->
    <svg
      v-if="tone === 'ok'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
    <svg
      v-else-if="tone === 'danger'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M19 5 5 19M5 5l14 14" />
    </svg>
    <span v-else class="smark-dot"></span>
  </span>
</template>

<script setup lang="ts">
import type { StatusTone } from "~/composables/useStatus";

/**
 * The status indicator every surface shares: job rows, status pills, endpoint
 * rows and the deployment timelines. Takes a tone from `getStatusTone` so all
 * of them agree on what a colour means.
 */
withDefaults(
  defineProps<{
    tone: StatusTone;
    /** Halo on a live mark. Only meaningful for `live`. */
    pulse?: boolean;
    /** Box size in px; the dot scales with it, so rows stay aligned whichever
        shape a mark ends up drawing. */
    size?: number;
    /** Tooltip text — the visible surfaces carry no label of their own. */
    label?: string;
  }>(),
  { size: 14 },
);
</script>

<style lang="scss" scoped>
.smark {
  position: relative;
  display: inline-grid;
  place-items: center;
  flex: none;
  width: var(--smark-size, 14px);
  height: var(--smark-size, 14px);
  line-height: 0;

  svg {
    width: 100%;
    height: 100%;
  }
}

.smark-dot {
  position: relative;
  /* Keeps a dot optically the same weight as a glyph in the same box. */
  width: calc(var(--smark-size, 14px) * 0.64);
  height: calc(var(--smark-size, 14px) * 0.64);
  border-radius: 50%;
  background: currentColor;
}

/* One green for both: a running dot and a completed checkmark are the same
   colour, and the shape is the only thing that differs. */
.smark.live,
.smark.ok {
  color: $success;
}
.smark.warn {
  color: $warning;
}
.smark.danger {
  color: $danger;
}
.smark.neutral {
  color: $status-neutral;
}

.smark.live.is-pulsing .smark-dot::after {
  content: "";
  position: absolute;
  /* Grown from the dot, not the box, so the halo keeps its proportions at
     every mark size. */
  inset: calc(var(--smark-size, 14px) * -0.28);
  border-radius: 50%;
  border: 1.5px solid currentColor;
  opacity: 0.5;
  animation: smark-pulse 2.4s ease-out infinite;
}

@keyframes smark-pulse {
  0% {
    transform: scale(0.5);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}
</style>
