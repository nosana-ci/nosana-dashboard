<template>
  <div v-if="model" class="box p-0">
    <CommonModelChatCode
      title="Inference"
      :url="inferenceBase"
      :model="model.id"
      key-env="NOSANA_API_KEY"
      :key-hint="false"
      :settings="settings"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { isChatModel } from "~/composables/useLlmGateway";
import type { ChatSettings } from "~/utils/llmChat";

/** How to call the inference API with an API key, shown for a model that is serving. */
const { inferenceBase, models } = useLlmGateway();

const model = computed(() => {
  const chat = models.value.filter(isChatModel);
  return chat.find((entry) => entry.available) ?? chat[0] ?? null;
});

const settings = computed<ChatSettings>(() => ({
  systemPrompt: "",
  temperature: 0.7,
  maxTokens: Math.min(1024, model.value?.max_output_tokens ?? 1024),
}));
</script>
