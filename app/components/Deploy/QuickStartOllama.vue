<template>
  <p v-if="failed" class="dropdown-item is-muted">
    The Ollama library could not be loaded. Reload the page to try again.
  </p>
  <!-- A model typed in full that the list does not offer: first, as typed -->
  <button
    v-if="typedModel"
    type="button"
    class="dropdown-item"
    @click="emit('pick', typedModel)"
  >
    <span class="is-flex is-flex-wrap-wrap is-align-items-center is-gap-0.5">
      <strong class="result-name is-family-monospace has-text-weight-semibold">{{ typedModel }}</strong>
      <span class="tag is-rounded is-warning is-light">
        <span>Not in the library list</span>
      </span>
    </span>
    <span class="result-meta">
      Deploys as typed, so check the spelling: the host pulls it from
      ollama.com when the job starts, and fails if it does not exist.
    </span>
  </button>
  <button
    v-for="model in results"
    :key="model.name"
    type="button"
    class="dropdown-item"
    :title="`Deploy ${model.name}`"
    @click="emit('pick', model.name)"
  >
    <span class="is-flex is-flex-wrap-wrap is-align-items-center is-gap-0.5">
      <strong class="result-name is-family-monospace has-text-weight-semibold">{{ model.name }}</strong>
      <span
        v-for="capability in model.capabilities"
        :key="capability"
        class="tag is-rounded"
      >
        <span>{{ capability }}</span>
      </span>
    </span>
    <span class="result-meta">{{ model.description }}</span>
    <span
      v-if="model.sizes.length"
      class="is-flex is-flex-wrap-wrap is-gap-0.5 mt-1"
    >
      <span
        v-for="size in model.sizes"
        :key="size"
        class="tag is-rounded is-family-monospace"
      >
        <span>{{ size }}</span>
      </span>
    </span>
  </button>
  <p
    v-if="library.length && !results.length && !typedModel"
    class="dropdown-item is-muted"
  >
    No library models match “{{ term.trim() }}”.
  </p>
</template>

<script setup lang="ts">
import type { OllamaLibraryModel } from "~/utils/ollamaLibrary";
import {
  isOllamaModelRef,
  loadOllamaLibrary,
  searchOllamaLibrary,
} from "~/utils/quickStart";

const props = defineProps<{ term: string }>();

const emit = defineEmits<{
  /** A model to deploy, as Ollama names it. */
  pick: [model: string];
}>();

// The library snapshot loads once this list first opens.
const library = shallowRef<OllamaLibraryModel[]>([]);
const failed = ref(false);
onMounted(async () => {
  try {
    library.value = await loadOllamaLibrary();
  } catch (error) {
    console.error("Ollama library load error:", error);
    failed.value = true;
  }
});

const results = computed(() => searchOllamaLibrary(library.value, props.term));

// A model typed in full that the list does not offer as such: deployable as
// typed, since the library snapshot may lag or the tag may be a quantisation.
const typedModel = computed(() => {
  const typed = props.term.trim().toLowerCase();
  if (!library.value.length || !typed || !isOllamaModelRef(typed)) return "";
  const [name, tag] = typed.split(":");
  const listed = results.value.some(
    (model) =>
      model.name === name &&
      (!tag || tag === "latest" || model.sizes.includes(tag)),
  );
  return listed ? "" : typed;
});
</script>
