<template>
  <!-- The sample calls the public API with the reader's own key, not the
       session-authenticated proxy the chat itself uses. -->
  <ModelChatCode
    :url="codeUrl"
    :model="model"
    :headers="{}"
    key-env="NOSANA_API_KEY"
    :settings="settings"
    note="The sample calls the public API with your own key; the playground itself uses your session."
  >
    <template #footer>
      <LlmSnippetKeys />
    </template>
  </ModelChatCode>
</template>

<script setup lang="ts">
import ModelChatCode from "~/components/Common/ModelChatCode.vue";
import type { ChatSettings } from "~/utils/llmChat";

defineProps<{
  model: string;
  /** The base URL the sample calls. */
  codeUrl: string;
  settings: ChatSettings;
}>();
</script>
