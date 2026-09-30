<template>
  <!-- ModelChat supplies the panel; the picker goes in its bar rather than a second one. -->
  <ModelChat
    scope="playground"
    session-key="playground"
    :url="playgroundUrl"
    :model="model"
    :headers="{}"
    api-key=""
    :status="status"
    error=""
  >
    <template #model>
      <div class="select is-small">
        <select v-model="model" :disabled="availableModels.length === 0">
          <option v-if="availableModels.length === 0" value="">
            No models available
          </option>
          <option v-for="entry in availableModels" :key="entry.id" :value="entry.id">
            {{ entry.name || entry.id }}
          </option>
        </select>
      </div>

      <span v-if="selectedModel" class="is-size-7 has-text-grey model-facts">
        <span>{{ formatTokenCount(selectedModel.context_length) }} context</span>
        <span>
          {{ formatUsd(pricePerMillion(selectedModel.pricing.prompt)) }} in /
          {{ formatUsd(pricePerMillion(selectedModel.pricing.completion)) }} out
          per 1M
        </span>
      </span>
    </template>
  </ModelChat>
</template>

<script setup lang="ts">
import ModelChat from "~/components/Common/ModelChat.vue";
import type { LlmModel } from "~/composables/useLlmGateway";
import {
  pricePerMillion,
  formatUsd,
  formatTokenCount,
} from "~/composables/useLlmGateway";

const props = defineProps<{
  models: LlmModel[];
  loading?: boolean;
  initialModel?: string | null;
}>();

// The page keeps the selected model so the code sample below matches the chat.
const emit = defineEmits<{ model: [id: string] }>();

const config = useRuntimeConfig().public;

/** ModelChat appends /v1/chat/completions, which is where the proxy serves it. */
const playgroundUrl = `${config.apiBase}/playground`;

const availableModels = computed(() =>
  props.models.filter((entry) => entry.available),
);

const model = ref(props.initialModel ?? "");

const selectedModel = computed(
  () => props.models.find((entry) => entry.id === model.value) ?? null,
);

// "ended" rather than "error": nothing is broken when no model happens to be serving.
const status = computed(() => {
  if (props.loading) return "starting" as const;
  return model.value ? ("ready" as const) : ("ended" as const);
});

watch(
  availableModels,
  (list) => {
    if (!model.value && list.length > 0) model.value = list[0]!.id;
  },
  { immediate: true },
);

watch(model, (id) => {
  if (id) emit("model", id);
});

watch(
  () => props.initialModel,
  (next) => {
    if (next) model.value = next;
  },
);
</script>

<style scoped lang="scss">
.model-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.9rem;
}
</style>
