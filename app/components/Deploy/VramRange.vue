<template>
  <div class="vram-range" role="group" aria-label="VRAM range">
    <span class="vram-range-prefix">VRAM</span>
    <div class="vram-range-track">
      <div
        class="vram-range-fill"
        :style="{ left: `${percent(low)}%`, right: `${100 - percent(high)}%` }"
      ></div>
      <input
        type="range"
        min="0"
        :max="last"
        step="1"
        :value="low"
        :disabled="last === 0"
        aria-label="Minimum VRAM"
        :aria-valuetext="`${sizeAt(low)} GB`"
        @input="onLow"
      />
      <input
        type="range"
        min="0"
        :max="last"
        step="1"
        :value="high"
        :disabled="last === 0"
        aria-label="Maximum VRAM"
        :aria-valuetext="`${sizeAt(high)} GB`"
        @input="onHigh"
      />
    </div>
    <span class="vram-range-value">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { formatVramRange } from "~/composables/useNodeRequirements";

/**
 * A two-thumb VRAM filter whose stops are the sizes GPUs come in, so every
 * position names a size some GPU has. The whole range is `null` (no filter).
 */
const props = defineProps<{
  /** Distinct VRAM sizes in GB, ascending. */
  sizes: number[];
  /** The lowest and highest size shown; null shows every size. */
  modelValue: [number, number] | null;
}>();
const emit = defineEmits<{
  "update:modelValue": [value: [number, number] | null];
}>();

const last = computed(() => Math.max(props.sizes.length - 1, 0));

// A bound the sizes no longer include (the catalogue changed) falls back to that end.
function indexOf(gb: number | undefined, fallback: number): number {
  const index = gb === undefined ? -1 : props.sizes.indexOf(gb);
  return index < 0 ? fallback : index;
}

const low = computed(() => indexOf(props.modelValue?.[0], 0));
const high = computed(() => indexOf(props.modelValue?.[1], last.value));

const sizeAt = (index: number) => props.sizes[index] ?? 0;
const percent = (index: number) =>
  last.value ? (index / last.value) * 100 : 0;

// "8–80 GB", or "24 GB" with both thumbs on one size.
const label = computed(() => formatVramRange(sizeAt(low.value), sizeAt(high.value)));

function update(lowIndex: number, highIndex: number) {
  const full = lowIndex === 0 && highIndex === last.value;
  emit(
    "update:modelValue",
    full ? null : [sizeAt(lowIndex), sizeAt(highIndex)],
  );
}

// A thumb stops at the other one: the range never inverts.
function onLow(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return;
  const index = Math.min(Number(event.target.value), high.value);
  event.target.value = String(index);
  update(index, high.value);
}

function onHigh(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return;
  const index = Math.max(Number(event.target.value), low.value);
  event.target.value = String(index);
  update(low.value, index);
}
</script>

<style lang="scss" scoped>
$mono: ui-monospace, "SF Mono", "JetBrains Mono", "Cascadia Code", Menlo,
  Consolas, monospace;

// The same pill as the search field next to it.
.vram-range {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  height: 38px;
  padding: 0 0.85rem;
  border-radius: 999px;
  border: 1px solid $border-soft;
  background: $white;
}

.vram-range-prefix {
  flex-shrink: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: $text-muted;
}

.vram-range-value {
  flex-shrink: 0;
  min-width: 4.75rem;
  font-family: $mono;
  font-size: 0.75rem;
  color: $text;
  text-align: right;
}

@mixin thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--vram-thumb, #ffffff);
  border: 3px solid $secondary;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  cursor: pointer;
}

// Both inputs span the track; only their thumbs take the pointer, so each
// thumb can be dragged wherever the other one sits.
.vram-range-track {
  position: relative;
  width: 110px;
  height: 4px;
  border-radius: 2px;
  background: $surface-track;

  input {
    appearance: none;
    position: absolute;
    top: -5px;
    left: 0;
    width: 100%;
    height: 14px;
    margin: 0;
    background: transparent;
    outline: none;
    pointer-events: none;

    &::-webkit-slider-thumb {
      appearance: none;
      @include thumb;
    }

    &::-moz-range-thumb {
      @include thumb;
    }

    &:focus-visible::-webkit-slider-thumb {
      box-shadow: 0 0 0 3px rgba($secondary, 0.25);
    }

    &:disabled {
      opacity: 0.5;
    }
  }
}

.vram-range-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 2px;
  background: $secondary;
  pointer-events: none;
}

html.dark-mode {
  .vram-range {
    background: rgba($white, 0.04);
    border-color: rgba($white, 0.12);
  }

  .vram-range-value {
    color: $white;
  }

  .vram-range-track {
    background: #3a3a3a;
    --vram-thumb: #242526;
  }
}
</style>
