<template>
  <section class="box p-0 playground">
    <!-- Model bar: the only control. Its specs and price are what a models list
         would otherwise carry, shown for the model actually selected. -->
    <div class="model-bar p-4">
      <div class="is-flex is-align-items-center is-gap-2 is-flex-wrap-wrap">
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
          <span class="is-family-monospace">{{ selectedModel.id }}</span>
          <span>{{ formatTokenCount(selectedModel.context_length) }} context</span>
          <span>
            {{ formatUsd(pricePerMillion(selectedModel.pricing.prompt)) }} in /
            {{ formatUsd(pricePerMillion(selectedModel.pricing.completion)) }} out
            per 1M
          </span>
        </span>

        <button
          v-if="messages.length"
          class="button is-small ml-auto"
          :disabled="streaming"
          @click="reset"
        >
          Clear
        </button>
      </div>
    </div>

    <div ref="scrollArea" class="messages p-5">
      <div v-if="messages.length === 0" class="empty-chat has-text-centered">
        <span class="icon is-large has-text-grey-light">
          <FontAwesomeIcon :icon="faComments" size="2x" />
        </span>
        <h5 class="title is-6 mt-2 mb-0">Free playground</h5>
      </div>

      <div
        v-for="(message, index) in messages"
        :key="index"
        class="message-row"
        :class="`is-${message.role}`"
      >
        <span class="is-size-7 has-text-grey is-uppercase message-role">
          {{ message.role }}
        </span>
        <div
          v-if="message.role === 'assistant'"
          class="message-body content is-small"
          v-html="render(message.content)"
        ></div>
        <div v-else class="message-body">{{ message.content }}</div>

        <div v-if="message.usage" class="is-size-7 has-text-grey mt-2">
          <span class="is-family-monospace">
            {{ message.usage.prompt_tokens }} in ·
            {{ message.usage.completion_tokens }} out · {{ costOf(message.usage) }}
          </span>
        </div>
      </div>

      <div v-if="streaming && !hasStreamedText" class="message-row is-assistant">
        <span class="is-size-7 has-text-grey is-uppercase message-role">assistant</span>
        <div class="message-body has-text-grey">…</div>
      </div>
    </div>

    <div v-if="error" class="notification is-warning is-light m-4 py-3">
      <div class="is-flex is-align-items-center is-justify-content-space-between is-gap-2">
        <div>
          <strong>{{ error.title }}</strong>
          <p class="mb-0 is-size-7">{{ error.message }}</p>
        </div>
      </div>
    </div>

    <div class="composer p-4">
      <textarea
        v-model="prompt"
        class="textarea is-small"
        rows="1"
        placeholder="Ask something…"
        :disabled="!canSend"
        @keydown.enter.exact.prevent="send"
      ></textarea>
      <button
        v-if="!streaming"
        class="button is-dark is-small"
        :disabled="!canSend || prompt.trim().length === 0"
        @click="send"
      >
        Send
      </button>
      <button v-else class="button is-small" @click="stop">Stop</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import OpenAI from "openai/index.mjs";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";
import type { LlmModel } from "~/composables/useLlmGateway";
import { pricePerMillion, usdToCredits } from "~/composables/useLlmGateway";

/**
 * Sent on every request. The gateway reserves the whole context plus this limit
 * before running anything, so leaving it off would hold far more credit than a
 * playground turn can spend.
 */
const MAX_TOKENS = 512;

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
}

interface PlaygroundMessage {
  role: "user" | "assistant";
  content: string;
  usage?: Usage;
}

const props = defineProps<{
  models: LlmModel[];
  initialModel?: string | null;
}>();
const emit = defineEmits<{
  model: [value: string | null];
}>();

const config = useRuntimeConfig().public;

const availableModels = computed(() => props.models.filter((entry) => entry.available));

const model = ref(props.initialModel ?? "");
const prompt = ref("");
const messages = ref<PlaygroundMessage[]>([]);
const streaming = ref(false);
const error = ref<{ title: string; message: string; topUp?: boolean } | null>(null);
const scrollArea = ref<HTMLElement | null>(null);
let controller: AbortController | null = null;

const selectedModel = computed(
  () => props.models.find((entry) => entry.id === model.value) ?? null,
);

const canSend = computed(() => Boolean(selectedModel.value?.available) && !streaming.value);

const hasStreamedText = computed(() => {
  const last = messages.value[messages.value.length - 1];
  return last?.role === "assistant" && last.content.length > 0;
});

watch(
  availableModels,
  (list) => {
    if (list.length === 0) {
      if (props.models.length > 0) model.value = "";
      return;
    }
    if (!list.some((entry) => entry.id === model.value)) {
      model.value = list[0]!.id;
    }
  },
  { immediate: true },
);

watch(model, (next) => emit("model", next || null));

watch(
  () => props.initialModel,
  (next) => {
    if (next) model.value = next;
  },
);

const render = (markdown: string) =>
  DOMPurify.sanitize(marked.parse(markdown, { async: false }) as string);

const costOf = (usage: Usage) => {
  const entry = selectedModel.value;
  if (!entry) return "";
  const usd =
    (usage.prompt_tokens * pricePerMillion(entry.pricing.prompt)) / 1_000_000 +
    (usage.completion_tokens * pricePerMillion(entry.pricing.completion)) / 1_000_000;
  const credits = usdToCredits(usd);
  return `${credits < 1 ? credits.toFixed(2) : credits.toFixed(1)} sponsored credits`;
};

const scrollToBottom = async () => {
  await nextTick();
  if (scrollArea.value) scrollArea.value.scrollTop = scrollArea.value.scrollHeight;
};

const describe = (thrown: any) => {
  const status = thrown?.status ?? thrown?.response?.status;
  const detail = thrown?.error?.message ?? thrown?.message ?? "Unknown error.";
  if (status === 402)
    return {
      title: "Playground temporarily unavailable",
      message: "The sponsored playground balance is currently unavailable.",
    };
  if (status === 401)
    return { title: "Session expired", message: "Sign in again to continue using the playground." };
  if (status === 403)
    return {
      title: "Model unavailable",
      message: "This model is not enabled for the free playground.",
    };
  if (status === 429)
    return { title: "Playground busy", message: "Too many requests. Wait a moment." };
  if (status === 503)
    return {
      title: "Model unavailable",
      message: "No healthy endpoint is serving this model right now.",
    };
  return { title: "Request failed", message: detail };
};

const send = async () => {
  const text = prompt.value.trim();
  if (!text || !canSend.value) return;

  error.value = null;
  messages.value.push({ role: "user", content: text });
  prompt.value = "";
  streaming.value = true;
  await scrollToBottom();

  const history = messages.value.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const assistant: PlaygroundMessage = { role: "assistant", content: "" };
  messages.value.push(assistant);

  controller = new AbortController();
  try {
    const client = new OpenAI({
      baseURL: `${config.apiBase}/playground/v1`,
      // Authentication is the HttpOnly SuperTokens session cookie. The SDK requires an
      // apiKey value, but client-manager discards this placeholder and supplies the
      // sponsored credential server-side.
      apiKey: "playground-session",
      dangerouslyAllowBrowser: true,
      fetch: (input, init) => {
        // The OpenAI SDK adds its own Authorization and X-Stainless headers. Neither is
        // needed by the session-authenticated proxy, and forwarding them would make the
        // browser's credentialed CORS preflight request headers client-manager does not
        // allow. SuperTokens adds its own permitted session/CSRF headers afterwards.
        const sdkHeaders = new Headers(init?.headers);
        const contentType = sdkHeaders.get("content-type");
        return fetch(input, {
          ...init,
          credentials: "include",
          headers: contentType ? { "content-type": contentType } : undefined,
        });
      },
    });

    const stream = await client.chat.completions.create(
      {
        model: model.value,
        messages: history,
        max_tokens: MAX_TOKENS,
        stream: true,
      },
      { signal: controller.signal },
    );

    for await (const chunk of stream as any) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        assistant.content += delta;
        await scrollToBottom();
      }
      // The gateway injects stream_options.include_usage, so the final frame carries it.
      if (chunk.usage) assistant.usage = chunk.usage;
    }
  } catch (thrown: any) {
    if (thrown?.name !== "AbortError") {
      error.value = describe(thrown);
      if (assistant.content.length === 0) messages.value.pop();
    }
  } finally {
    streaming.value = false;
    controller = null;
    await scrollToBottom();
  }
};

const stop = () => {
  controller?.abort();
};

const reset = () => {
  messages.value = [];
  error.value = null;
};
</script>

<style scoped lang="scss">
.playground {
  display: flex;
  flex-direction: column;
  min-height: 560px;
}

.model-bar {
  border-bottom: 1px solid $border;
}

.model-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.9rem;
}

.messages {
  flex: 1;
  overflow-y: auto;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.empty-chat {
  margin: auto;
  max-width: 24rem;
}

.message-role {
  display: block;
  letter-spacing: 0.06em;
  margin-bottom: 0.35rem;
}

.message-body {
  line-height: 1.6;
  white-space: pre-wrap;

  :deep(p:last-child) {
    margin-bottom: 0;
  }
}

.message-row.is-user .message-body {
  padding: 0.7rem 0.9rem;
  border-radius: 6px;
  background: $background;
}

.composer {
  display: flex;
  gap: 0.6rem;
  align-items: stretch;
  min-width: 0;
  border-top: 1px solid $border;

  .textarea {
    flex: 1 1 auto;
    width: auto;
    height: 36px;
    min-width: 0;
    min-height: 36px;
    padding-block: calc((36px - 1.25rem - 2px) / 2);
    line-height: 1.25rem;
    resize: none;
  }

  .button {
    flex: 0 0 auto;
    height: 36px;
  }
}

.dark-mode {
  .model-bar {
    border-bottom-color: rgba(255, 255, 255, 0.07);
  }
  .composer {
    border-top-color: rgba(255, 255, 255, 0.07);
  }
}
</style>
