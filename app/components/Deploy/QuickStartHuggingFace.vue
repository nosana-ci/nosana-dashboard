<template>
  <p v-if="error" class="dropdown-item is-muted">{{ error }}</p>
  <template v-for="model in results" v-else :key="model.id">
    <button
      type="button"
      class="dropdown-item"
      :class="{ 'is-unsupported': !huggingFaceApps(model).length }"
      :aria-expanded="picked?.id === model.id"
      @click="togglePick(model)"
    >
      <span class="is-flex is-flex-wrap-wrap is-align-items-center is-gap-0.5">
        <strong class="result-name is-family-monospace has-text-weight-semibold">{{ model.id }}</strong>
        <span v-if="isGated(model)" class="tag is-rounded is-warning is-light">
          <span>gated</span>
        </span>
      </span>
      <span class="result-meta">{{ modelMeta(model) }}</span>
    </button>

    <!-- A picked model: its token when gated, and the runtimes that serve it -->
    <div v-if="picked?.id === model.id" class="dropdown-item">
      <div class="app-options is-align-self-stretch">
        <template v-if="huggingFaceApps(model).length">
          <!-- A gated repo: vLLM and SGLang download it with the reader's token -->
          <div
            v-if="isGated(model) && huggingFaceApps(model).some(takesToken)"
            class="field mb-0"
          >
            <label class="label is-small mb-1">Hugging Face token</label>
            <div class="control">
              <input
                v-model="token"
                class="input is-small is-family-monospace"
                type="password"
                placeholder="hf_…"
                autocomplete="off"
                spellcheck="false"
              />
            </div>
            <p class="help">
              This repo is gated. Use a token whose account has accepted its
              terms; it goes in the job's HF_TOKEN.
            </p>
          </div>
          <button
            v-for="app in huggingFaceApps(model)"
            :key="app"
            type="button"
            class="app-option is-flex is-flex-direction-column has-text-left"
            :disabled="needsToken(model, app)"
            @click="emit('pick', model, app, token)"
          >
            <strong>Deploy with {{ QUICK_START_APPS[app].name }}</strong>
            <span class="is-size-7 is-muted">
              {{ QUICK_START_APPS[app].blurb }}
            </span>
            <small class="is-family-monospace">{{ appVram(model, app) }}</small>
          </button>
        </template>
        <p v-else class="is-muted">
          This model can't be deployed from here: only chat models with safetensors weights (served with vLLM or SGLang) or GGUF repos (served with Ollama) are supported.
        </p>
      </div>
    </div>
  </template>
  <p v-if="!error && !loading && !results.length" class="dropdown-item is-muted">
    No models match “{{ term.trim() }}”.
  </p>
</template>

<script setup lang="ts">
import { watchDebounced } from "@vueuse/core";
import { formatVram } from "~/composables/useTemplates";
import {
  QUICK_START_APPS,
  formatCount,
  formatParams,
  huggingFaceApps,
  huggingFaceParams,
  huggingFaceVramMb,
  isGated,
  searchHuggingFace,
  takesToken,
  type HuggingFaceModel,
  type QuickStartApp,
} from "~/utils/quickStart";

const props = defineProps<{ term: string }>();

const emit = defineEmits<{
  /** A model to deploy with a runtime, and the token for a gated repo. */
  pick: [model: HuggingFaceModel, app: QuickStartApp, token: string];
  /** Whether a search is out, for the search field's spinner. */
  loading: [loading: boolean];
}>();

/* Searched as you type, from when this list first opens; the newest request wins */
const results = ref<HuggingFaceModel[]>([]);
const picked = ref<HuggingFaceModel | null>(null);
const token = ref("");
const loading = ref(false);
const error = ref("");
let controller: AbortController | null = null;

watch(loading, (value) => emit("loading", value));

const search = async () => {
  controller?.abort();
  const request = new AbortController();
  controller = request;
  loading.value = true;
  error.value = "";
  try {
    results.value = await searchHuggingFace(props.term, request.signal);
    picked.value = null;
  } catch (caught) {
    if (request.signal.aborted) return;
    console.error("Hugging Face search error:", caught);
    error.value = "Hugging Face could not be searched. Try again in a moment.";
  } finally {
    if (!request.signal.aborted) loading.value = false;
  }
};

onMounted(search);
watchDebounced(() => props.term, search, { debounce: 250 });

const togglePick = (model: HuggingFaceModel) => {
  picked.value = picked.value?.id === model.id ? null : model;
};

const needsToken = (model: HuggingFaceModel, app: QuickStartApp): boolean =>
  isGated(model) && takesToken(app) && !token.value.trim();

// "8.2B params · 9.8M downloads · 2.1k likes"
const modelMeta = (model: HuggingFaceModel): string => {
  const params = huggingFaceParams(model);
  return [
    params ? `${formatParams(params)} params` : null,
    model.downloads ? `${formatCount(model.downloads)} downloads` : null,
    model.likes ? `${formatCount(model.likes)} likes` : null,
  ]
    .filter(Boolean)
    .join(" · ");
};

const appVram = (model: HuggingFaceModel, app: QuickStartApp): string => {
  const mb = huggingFaceVramMb(model, app);
  return mb ? `About ${formatVram(mb)}` : "GPU memory unknown";
};
</script>

<style lang="scss" scoped>
.is-unsupported {
  opacity: 0.6;
}

// A picked model: its token and the runtimes that serve it.
.app-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;

  > .field,
  > p {
    grid-column: 1 / -1;
  }
}

.app-option {
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

  &:hover:not(:disabled),
  &:focus-visible {
    border-color: $secondary;
    background: rgba($secondary, 0.12);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}
</style>
