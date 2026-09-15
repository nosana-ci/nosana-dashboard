<template>
  <div class="field">
    <div
      class="is-flex is-justify-content-space-between is-align-items-center mb-2"
    >
      <label class="label mb-0">Permissions</label>
      <button
        v-if="scopes.length"
        type="button"
        class="button is-small is-ghost has-text-weight-normal"
        @click="toggleAll"
      >
        {{ allSelected ? "Select none" : "Select all" }}
      </button>
    </div>

    <p v-if="loading" class="has-text-grey is-size-7">Loading permissions…</p>

    <p v-else-if="!scopes.length" class="has-text-grey is-size-7">
      {{ unavailableNote }}
    </p>

    <template v-else>
      <label
        v-for="entry in scopes"
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

const props = defineProps<{
  modelValue: string[];
  help: string;
  unavailableNote: string;
}>();

const emit = defineEmits<{ "update:modelValue": [string[]] }>();

const { scopes, scopeNames, loading, spendsCredits } = useScopeCatalogue();

const selected = computed({
  get: () => props.modelValue,
  set: (value: string[]) => emit("update:modelValue", value),
});

const allSelected = computed(
  () =>
    scopes.value.length > 0 && selected.value.length === scopes.value.length,
);

const toggleAll = () => {
  selected.value = allSelected.value ? [] : [...scopeNames.value];
};
</script>
