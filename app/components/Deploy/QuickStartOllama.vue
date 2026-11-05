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
  <template v-for="model in results" :key="model.name">
    <button
      type="button"
      class="dropdown-item"
      :title="model.sizes.length > 1 ? undefined : `Deploy ${model.name}`"
      :aria-expanded="model.sizes.length > 1 ? picked === model.name : undefined"
      @click="choose(model)"
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

    <!-- A picked model in several sizes: the size to deploy -->
    <div v-if="picked === model.name" class="dropdown-item">
      <div class="size-options is-align-self-stretch">
        <button
          v-for="size in model.sizes"
          :key="size"
          type="button"
          class="size-option is-flex is-flex-direction-column has-text-left"
          @click="emit('pick', `${model.name}:${size}`)"
        >
          <strong>Deploy {{ size }}</strong>
          <small class="is-family-monospace">{{ sizeVram(model, size) }}</small>
        </button>
      </div>
    </div>
  </template>
  <p
    v-if="library.length && !results.length && !typedModel"
    class="dropdown-item is-muted"
  >
    No library models match “{{ term.trim() }}”.
  </p>
</template>

<script setup lang="ts">
import { formatVram } from "~/composables/useTemplates";
import type { OllamaLibraryModel } from "~/utils/quickStart";
import {
  isOllamaModelRef,
  loadOllamaLibrary,
  ollamaVramMb,
  searchOllamaLibrary,
} from "~/utils/quickStart";

const props = defineProps<{ term: string }>();

const emit = defineEmits<{
  /** A model to deploy, as Ollama names it. */
  pick: [model: string];
}>();

// The library loads once this list first opens.
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
// typed, since the library may lag a day behind ollama.com or the tag may be a quantisation.
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

// A model in several sizes opens to pick one, the way a Hugging Face model
// picks its runtime; with one size or none it deploys straight away.
const picked = ref("");
const choose = (model: OllamaLibraryModel) => {
  if (model.sizes.length < 2) return emit("pick", model.name);
  picked.value = picked.value === model.name ? "" : model.name;
};

const sizeVram = (model: OllamaLibraryModel, size: string): string => {
  const mb = ollamaVramMb(`${model.name}:${size}`);
  return mb ? `About ${formatVram(mb)}` : "GPU memory unknown";
};
</script>

<style lang="scss" scoped>
// A picked model's sizes, styled like a Hugging Face model's runtimes.
.size-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.size-option {
  gap: 3px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1.5px solid rgba($secondary, 0.35);
  background: rgba($secondary, 0.06);
  font: inherit;
  color: inherit;
  cursor: pointer;

  small {
    color: $secondary-text;

    html.dark-mode & {
      color: $secondary;
    }
  }

  &:hover,
  &:focus-visible {
    border-color: $secondary;
    background: rgba($secondary, 0.12);
  }
}
</style>
