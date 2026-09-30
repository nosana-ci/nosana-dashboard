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
    :suggestions="SUGGESTIONS"
    :settings-to="dockTo?.settings"
    :code-to="dockTo?.code"
    :code-url="codeUrl"
    code-key-env="NOSANA_API_KEY"
  >
    <template #model>
      <LlmModelPicker v-model="model" :models="chatModels" />
    </template>
    <template #empty>
      <h2 class="title is-2 mb-0 empty-title">
        Ask {{ selectedModel ? modelName(selectedModel) : "the model" }} anything
      </h2>
    </template>
    <template #actions>
      <slot name="actions" />
    </template>
    <!-- The sample calls the public API with the reader's own key, not the
         session-authenticated proxy the chat itself uses. -->
    <template #code-footer>
      <LlmSnippetKeys />
    </template>
  </ModelChat>
</template>

<script setup lang="ts">
import ModelChat from "~/components/Common/ModelChat.vue";
import { isChatModel, modelName, type LlmModel } from "~/composables/useLlmGateway";

const props = defineProps<{
  models: LlmModel[];
  loading?: boolean;
  /** The base URL the code sample calls. */
  codeUrl: string;
  /** Panels the page provides for the chat's settings and code; see ModelChat. */
  dockTo?: { settings: string; code: string } | null;
}>();

// The page keeps the selected model so its details and code sample match the chat.
const model = defineModel<string>({ default: "" });

const config = useRuntimeConfig().public;

/** ModelChat appends /v1/chat/completions, which is where the proxy serves it. */
const playgroundUrl = `${config.apiBase}/playground`;

// The catalog also lists embedding models, which cannot answer a chat request.
const chatModels = computed(() => props.models.filter(isChatModel));

const availableModels = computed(() =>
  chatModels.value.filter((entry) => entry.available),
);

// Everyday asks rather than technical ones, so anyone has somewhere to start.
const SUGGESTIONS = [
  "How does GPU inference work?",
  "Help me study for an exam",
  "What can I cook tonight?",
];

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
    // Also replaces a model from the URL that cannot chat, such as an embedding model.
    if (list.length > 0 && !list.some((entry) => entry.id === model.value))
      model.value = list[0]!.id;
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.empty-title {
  font-weight: $weight-medium;
  color: $text;
  text-wrap: balance;
}

html.dark-mode .empty-title {
  color: $white;
}
</style>
