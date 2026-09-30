<template>
  <div class="chat-settings" :class="{ 'is-stacked': stacked }">
    <label class="chat-field">
      <span>System prompt</span>
      <textarea
        :value="settings.systemPrompt"
        class="chat-prompt"
        rows="3"
        placeholder="Optional. Sent before every conversation."
        @input="set('systemPrompt', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </label>
    <div class="chat-field-col">
      <label class="chat-field">
        <span
          >Temperature
          <b class="is-family-monospace">{{ settings.temperature.toFixed(1) }}</b></span
        >
        <input
          :value="settings.temperature"
          type="range"
          min="0"
          max="2"
          step="0.1"
          @input="set('temperature', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
      <label v-if="showMaxTokens" class="chat-field">
        <span>Max tokens</span>
        <input
          :value="settings.maxTokens"
          class="input is-small"
          type="number"
          min="1"
          @input="set('maxTokens', Number(($event.target as HTMLInputElement).value))"
        />
      </label>
      <label v-if="showApiKey" class="chat-field">
        <span>API key</span>
        <!-- Applied on change, so each keystroke isn't a new request to the server. -->
        <input
          :value="apiKey"
          class="input is-small"
          type="password"
          autocomplete="off"
          placeholder="Only if the server asks for one"
          @change="apiKey = ($event.target as HTMLInputElement).value.trim()"
        />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatSettings } from "~/utils/llmChat";

/**
 * The chat's system prompt and sampling controls. ModelChat shows it in the tray
 * under its bar, or in a panel the page provides; it is the same form either way.
 */
defineProps<{
  showMaxTokens?: boolean;
  showApiKey?: boolean;
  /** One column, for a narrow panel. */
  stacked?: boolean;
}>();

const settings = defineModel<ChatSettings>({ required: true });
const apiKey = defineModel<string>("apiKey", { default: "" });

const set = <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
  settings.value = { ...settings.value, [key]: value };
};
</script>

<style scoped lang="scss">
.chat-settings {
  display: grid;
  grid-template-columns: 1fr 200px;
  gap: 14px;

  &.is-stacked {
    grid-template-columns: 1fr;

    // A value beside its label sits at the far edge, above the slider's end.
    .chat-field > span {
      display: flex;
      justify-content: space-between;
    }
  }
}

.chat-field-col {
  display: grid;
  gap: 10px;
  align-content: start;
}

.chat-field {
  display: grid;
  gap: 5px;
  font-size: 0.82rem;
  // The shared muted grey is too faint at this size on white.
  color: $grey-dark;

  b {
    color: $text;
    font-weight: 600;
  }

  // The same box as the chat's message input, rather than Bulma's textarea.
  .chat-prompt {
    padding: 9px 14px;
    border: 1px solid $border-soft;
    border-radius: 14px;
    outline: 0;
    background: $white;
    font: inherit;
    font-size: 0.86rem;
    color: $text;
    resize: vertical;

    &:focus {
      border-color: $secondary;
      box-shadow: 0 0 0 3px rgba($secondary, 0.2);
    }
  }

  input[type="range"] {
    accent-color: $secondary;
  }
}

html.dark-mode {
  .chat-field {
    color: $text-muted;
  }

  .chat-field b {
    color: $white;
  }

  .chat-prompt {
    background: transparent;
    border-color: rgba($white, 0.14);
    color: $white;

    &:focus {
      border-color: $secondary;
    }
  }
}

@include touch {
  .chat-settings {
    grid-template-columns: 1fr;
  }
}
</style>
