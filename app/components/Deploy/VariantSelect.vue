<template>
  <!-- A template's variant picker. A custom listbox rather than a native
       select, so the list looks the same everywhere (Windows paints native
       option lists itself) and can show each variant's VRAM. -->
  <div class="variant-select" :class="{ 'is-surface': surface }">
    <button
      ref="trigger"
      type="button"
      class="vs-trigger"
      :class="{ 'is-open': open }"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-label="label"
      @click="toggle"
      @keydown="onTriggerKey"
    >
      <span class="vs-label">Variant</span>
      <span class="vs-value">{{ selected?.name ?? "Choose a variant" }}</span>
      <span v-if="selectedVram" class="vs-vram">{{ selectedVram }}</span>
      <svg class="vs-chevron" viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>

    <Teleport to="body">
      <ul
        v-if="open"
        :id="listId"
        ref="list"
        class="vs-list"
        :class="{ 'is-surface': surface, 'is-up': placement.up }"
        :style="placement.style"
        role="listbox"
        tabindex="-1"
        :aria-label="label"
        :aria-activedescendant="activeId"
        @keydown="onListKey"
      >
        <li
          v-for="(option, index) in options"
          :id="`${listId}-${index}`"
          :key="option.variant.id"
          class="vs-option"
          :class="{
            'is-selected': option.selected,
            'is-active': index === activeIndex,
          }"
          role="option"
          :aria-selected="option.selected"
          @mouseenter="activeIndex = index"
          @click="choose(option.variant)"
        >
          <span class="vs-option-text">
            <strong>{{ option.variant.name }}</strong>
            <small v-if="option.variant.description">
              {{ option.variant.description }}
            </small>
          </span>
          <span v-if="option.vram" class="vs-vram">{{ option.vram }}</span>
          <svg class="vs-check" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </li>
      </ul>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside, useEventListener } from "@vueuse/core";
import {
  formatVram,
  requiredVramMb,
  type TemplateVariant,
} from "~/composables/useTemplates";

const props = defineProps<{
  variants: TemplateVariant[];
  selected: TemplateVariant | undefined;
  /** Accessible name, e.g. the template's name and "variant". */
  label: string;
  /** On the always-dark deploy surface rather than the themed page. */
  surface?: boolean;
}>();

const emit = defineEmits<{ select: [variant: TemplateVariant] }>();

const listId = useId();
const trigger = ref<HTMLElement | null>(null);
const list = ref<HTMLElement | null>(null);
const open = ref(false);
const activeIndex = ref(0);

const vramOf = (variant: TemplateVariant): string | null => {
  const mb = requiredVramMb(variant.jobDefinition);
  return mb ? formatVram(mb) : null;
};

const selectedVram = computed(() =>
  props.selected ? vramOf(props.selected) : null,
);

const options = computed(() =>
  props.variants.map((variant) => ({
    variant,
    vram: vramOf(variant),
    selected: variant.id === props.selected?.id,
  })),
);

const activeId = computed(() => `${listId}-${activeIndex.value}`);

// Under the trigger, or above it when the window has no room below. Fixed to
// the window, so a clipped hero never cuts the list off.
const placement = ref<{ up: boolean; style: Record<string, string> }>({
  up: false,
  style: {},
});
const LIST_MAX_HEIGHT = 320;

function place() {
  const rect = trigger.value?.getBoundingClientRect();
  if (!rect) return;
  const up =
    window.innerHeight - rect.bottom < LIST_MAX_HEIGHT &&
    rect.top > window.innerHeight - rect.bottom;
  placement.value = {
    up,
    style: {
      left: `${rect.left}px`,
      minWidth: `${rect.width}px`,
      ...(up
        ? { bottom: `${window.innerHeight - rect.top + 6}px` }
        : { top: `${rect.bottom + 6}px` }),
    },
  };
}

async function show() {
  activeIndex.value = Math.max(
    0,
    options.value.findIndex((option) => option.selected),
  );
  place();
  open.value = true;
  await nextTick();
  list.value?.focus();
  list.value?.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
}

function close(refocus = false) {
  open.value = false;
  if (refocus) trigger.value?.focus();
}

function toggle() {
  if (open.value) close();
  else void show();
}

function choose(variant: TemplateVariant) {
  emit("select", variant);
  close(true);
}

function move(to: number) {
  const last = options.value.length - 1;
  activeIndex.value = Math.min(Math.max(to, 0), last);
  list.value
    ?.querySelector(`#${CSS.escape(activeId.value)}`)
    ?.scrollIntoView({ block: "nearest" });
}

function onTriggerKey(event: KeyboardEvent) {
  if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
    event.preventDefault();
    void show();
  }
}

function chooseActive() {
  const option = options.value[activeIndex.value];
  if (option) choose(option.variant);
}

function onListKey(event: KeyboardEvent) {
  const keys: Record<string, () => void> = {
    ArrowDown: () => move(activeIndex.value + 1),
    ArrowUp: () => move(activeIndex.value - 1),
    Home: () => move(0),
    End: () => move(options.value.length - 1),
    Enter: chooseActive,
    " ": chooseActive,
    Escape: () => close(true),
    Tab: () => close(),
  };
  const action = keys[event.key];
  if (!action) return;
  if (event.key !== "Tab") event.preventDefault();
  action();
}

onClickOutside(list, () => close(), { ignore: [trigger] });
// The list is fixed to the window: rather than chase the trigger, it closes
// when the page scrolls or resizes under it.
useEventListener(
  window,
  "scroll",
  (event: Event) => {
    if (open.value && event.target !== list.value) close();
  },
  { capture: true, passive: true },
);
useEventListener(window, "resize", () => close());
</script>

<style scoped lang="scss">
/* ---------- The trigger: a field, like the template search ---------- */
.vs-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 2.75rem;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid $border-soft;
  background: $white;
  color: $text;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: $border-strong;
  }

  &:focus-visible,
  &.is-open {
    outline: 0;
    border-color: $secondary;
    box-shadow: 0 0 0 3px rgba($secondary, 0.18);
  }
}

.vs-label {
  flex-shrink: 0;
  font-family: var(--mono, $family-monospace);
  font-size: 0.68rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: $text-muted;
}

.vs-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
  font-weight: 600;
}

.vs-vram {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba($secondary, 0.12);
  color: $secondary-text;
  font-family: var(--mono, $family-monospace);
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}

.vs-chevron {
  flex-shrink: 0;
  width: 15px;
  height: 15px;
  fill: none;
  stroke: $text-muted;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform 0.2s ease;

  .is-open & {
    transform: rotate(180deg);
  }
}

/* ---------- The list: a floating card of options ---------- */
.vs-list {
  position: fixed;
  z-index: 1000;
  max-width: min(440px, calc(100vw - 32px));
  max-height: 320px;
  overflow-y: auto;
  margin: 0;
  padding: 6px;
  list-style: none;
  border-radius: 14px;
  border: 1px solid $border-soft;
  background: $white;
  box-shadow:
    0 1px 2px rgba($black, 0.04),
    0 16px 40px -8px rgba($black, 0.22);
  outline: 0;
  transform-origin: top center;

  &.is-up {
    transform-origin: bottom center;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .vs-list {
    animation: vs-in 0.14s ease;
  }
}

@keyframes vs-in {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
}

.vs-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  color: $text;
  cursor: pointer;

  &.is-active {
    background: $surface-hover;
  }

  &.is-selected {
    background: rgba($secondary, 0.1);
  }
}

.vs-option-text {
  flex: 1;
  min-width: 0;

  strong {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: inherit;
  }

  small {
    display: block;
    margin-top: 1px;
    font-size: 0.75rem;
    line-height: 1.4;
    color: $text-muted;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.vs-check {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  fill: none;
  stroke: $secondary-text;
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  visibility: hidden;

  .is-selected & {
    visibility: visible;
  }
}

/* ---------- Dark: the dark theme, and the always-dark deploy surface ---------- */
@mixin variant-select-dark {
  .vs-trigger {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.12);
    color: #fff;

    &:hover {
      border-color: rgba(255, 255, 255, 0.24);
    }

    &:focus-visible,
    &.is-open {
      border-color: $secondary;
    }
  }

  .vs-label,
  .vs-chevron {
    color: #8a948a;
    stroke: #8a948a;
  }

  .vs-vram {
    color: $secondary;
  }
}

@mixin variant-list-dark {
  background: #1f221f;
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 50px -16px rgba(0, 0, 0, 0.85);

  .vs-option {
    color: #fff;

    &.is-active {
      background: rgba(255, 255, 255, 0.06);
    }

    &.is-selected {
      background: rgba($secondary, 0.12);
    }
  }

  .vs-option-text small {
    color: #8a948a;
  }

  .vs-vram {
    color: $secondary;
  }

  .vs-check {
    stroke: $secondary;
  }
}

.variant-select.is-surface {
  @include variant-select-dark;
}

.vs-list.is-surface {
  @include variant-list-dark;
}

html.dark-mode {
  .variant-select {
    @include variant-select-dark;
  }

  .vs-list {
    @include variant-list-dark;
  }
}
</style>
