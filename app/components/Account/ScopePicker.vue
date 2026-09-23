<template>
  <div class="field">
    <div
      class="is-flex is-justify-content-space-between is-align-items-center mb-2"
    >
      <label class="label mb-0">Permissions</label>
      <button
        v-if="available.length"
        type="button"
        class="button is-small is-ghost has-text-weight-normal"
        @click="toggleAll"
      >
        {{ allSelected ? "Select none" : "Select all" }}
      </button>
    </div>

    <p v-if="loading" class="has-text-grey is-size-7">Loading permissions…</p>

    <p v-else-if="!available.length" class="has-text-grey is-size-7">
      {{ unavailableNote }}
    </p>

    <template v-else>
      <label
        v-for="entry in available"
        :key="entry.scope"
        class="checkbox is-flex is-align-items-flex-start is-gap-2 py-1"
      >
        <input
          v-model="selected"
          type="checkbox"
          :value="entry.scope"
          class="mt-1"
        />
        <span class="is-flex is-flex-direction-column">
          <span>
            {{ entry.description }}
            <span
              v-if="spendsCredits(entry.description)"
              class="tag is-warning is-light is-rounded ml-1"
              >spends credits</span
            >
          </span>
          <span class="is-family-monospace is-size-7 has-text-grey">{{
            entry.scope
          }}</span>
        </span>
      </label>
    </template>

    <p class="help">{{ help }}</p>
  </div>
</template>

<script setup lang="ts">
import type { ScopeDescriptor } from "~/composables/useScopeCatalogue";

const props = defineProps<{
  modelValue: string[];
  help: string;
  unavailableNote: string;
  /**
   * Restrict which scopes are offered. Defaults to the whole vocabulary, which is right
   * for an API key; an OAuth app takes the grantable subset, since it cannot hold a scope
   * whose routes only accept an API key.
   */
  options?: ScopeDescriptor[];
}>();

const emit = defineEmits<{ "update:modelValue": [string[]] }>();

const { scopes: allScopes, loading, spendsCredits } = useScopeCatalogue();

const available = computed(() => props.options ?? allScopes.value);
const availableNames = computed(() =>
  available.value.map((entry) => entry.scope),
);

const selected = computed({
  get: () => props.modelValue,
  set: (value: string[]) => emit("update:modelValue", value),
});

const allSelected = computed(
  () =>
    available.value.length > 0 &&
    selected.value.length === available.value.length,
);

const toggleAll = () => {
  selected.value = allSelected.value ? [] : [...availableNames.value];
};
</script>
