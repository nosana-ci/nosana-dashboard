<template>
  <div ref="root" class="dropdown model-picker" :class="{ 'is-active': open }">
    <div class="dropdown-trigger">
      <button
        type="button"
        class="button is-small is-quiet picker-button"
        aria-haspopup="listbox"
        :aria-expanded="open"
        :disabled="models.length === 0"
        @click="toggle"
      >
        <span class="picker-name">{{ selected ? modelName(selected) : "No models available" }}</span>
        <ChevronDownIcon aria-hidden="true" />
      </button>
    </div>
    <div v-if="open" class="dropdown-menu">
      <div class="dropdown-content">
        <input
          ref="search"
          v-model="query"
          class="picker-search"
          type="search"
          placeholder="Search models"
          aria-label="Search models"
          @keydown.esc="open = false"
        />
        <ul class="picker-list" role="listbox">
          <li v-for="entry in matches" :key="entry.id">
            <button
              type="button"
              class="picker-option"
              :class="{ 'is-selected': entry.id === modelValue }"
              role="option"
              :aria-selected="entry.id === modelValue"
              :disabled="!entry.available"
              @click="pick(entry.id)"
            >
              <StatusMark :tone="entry.available ? 'live' : 'neutral'" :size="12" />
              <span class="picker-option-name">{{ modelName(entry) }}</span>
              <span class="picker-option-price">
                <template v-if="entry.available">
                  {{ formatUsd(pricePerMillion(entry.pricing.prompt)) }} in<br />
                  {{ formatUsd(pricePerMillion(entry.pricing.completion)) }} out
                </template>
                <template v-else>Not serving</template>
              </span>
              <span class="picker-option-meta">
                {{ formatTokenCount(entry.context_length) }} context
              </span>
            </button>
          </li>
          <li v-if="matches.length === 0" class="picker-none">
            No model matches "{{ query.trim() }}".
          </li>
        </ul>
        <p class="picker-count">{{ matches.length }} of {{ models.length }} models</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatusMark from "~/components/Common/StatusMark.vue";
import ChevronDownIcon from "@/assets/img/icons/chevron-down.svg?component";
import type { LlmModel } from "~/composables/useLlmGateway";
import {
  pricePerMillion,
  formatUsd,
  formatTokenCount,
  modelName,
} from "~/composables/useLlmGateway";

const props = defineProps<{
  models: LlmModel[];
  modelValue: string;
}>();
const emit = defineEmits<{ "update:modelValue": [id: string] }>();

const root = ref<HTMLElement | null>(null);
const search = ref<HTMLInputElement | null>(null);
const open = ref(false);
const query = ref("");

const selected = computed(
  () => props.models.find((entry) => entry.id === props.modelValue) ?? null,
);

const matches = computed(() => {
  const needle = query.value.trim().toLowerCase();
  return props.models.filter((entry) =>
    `${entry.name} ${entry.id}`.toLowerCase().includes(needle),
  );
});

const toggle = async () => {
  open.value = !open.value;
  if (!open.value) return;
  query.value = "";
  await nextTick();
  search.value?.focus();
};

const pick = (id: string) => {
  emit("update:modelValue", id);
  open.value = false;
};

onClickOutside(root, () => {
  open.value = false;
});
</script>

<style scoped lang="scss">
.model-picker {
  min-width: 0;
}

.picker-button {
  gap: 6px;
  max-width: 100%;
  font-size: 0.95rem;
  font-weight: 600;

  svg {
    flex: none;
  }
}

.picker-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-menu {
  width: min(440px, calc(100vw - 3rem));
}

.dropdown-content {
  @include soft-panel;
  padding: 0;
}

.picker-search {
  width: 100%;
  border: 0;
  border-bottom: 1px solid $border-soft;
  outline: 0;
  background: transparent;
  padding: 12px 16px;
  font: inherit;
  color: $text;
}

.picker-list {
  max-height: 336px;
  overflow-y: auto;
  padding: 6px;
}

.picker-option {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 2px 10px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 9px;
  background: none;
  font: inherit;
  color: $text;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: $surface-hover;
  }

  &.is-selected {
    background: $surface-track;
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
    background: none;
  }
}

.picker-option-name {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.picker-option-meta {
  grid-column: 2;
}

.picker-option-price {
  grid-row: 1 / span 2;
  grid-column: 3;
  font-family: $family-monospace;
  text-align: right;
}

.picker-option-meta,
.picker-option-price,
.picker-none,
.picker-count {
  font-size: 0.8rem;
  color: $grey-dark;
}

.picker-none {
  padding: 14px 10px;
}

.picker-count {
  padding: 8px 16px;
  border-top: 1px solid $border-soft;
}

html.dark-mode {
  .picker-search,
  .picker-count {
    border-color: rgba($white, 0.1);
  }

  .picker-search,
  .picker-option {
    color: $white;
  }

  .picker-option:hover:not(:disabled) {
    background: rgba($white, 0.06);
  }

  .picker-option.is-selected {
    background: rgba($white, 0.1);
  }

  .picker-option-meta,
  .picker-option-price,
  .picker-none,
  .picker-count {
    color: $text-muted;
  }
}
</style>
