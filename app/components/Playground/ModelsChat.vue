<template>
  <UApp :locale="locale">
    <div
      class="pg-shell pg-workspace"
      :class="{ 'has-side': wide && isNosa }"
    >
      <PlaygroundSidebar
        v-if="wide && isNosa"
        class="pg-pane pg-pane-side"
        :chats="recent"
        :current-id="currentId"
        @open="open"
        @create="newChat"
        @rename="rename"
        @remove="removeChat"
      />

      <PlaygroundShell
        v-model:draft="draft"
        class="pg-pane pg-pane-main"
        :messages="shown"
        :status="status"
        :error="error"
        :placeholder="placeholder"
        :disabled="!runModel"
        :suggestions="suggestions"
        :suggesting="suggesting"
        @send="send"
        @stop="stop"
        @regenerate="(id) => regenerate({ messageId: id })"
        @approve="(id, approved) => addToolApprovalResponse({ id, approved })"
      >
        <template v-if="isNosa && !wide" #header>
          <UTooltip text="Chats">
            <UButton
              icon="i-lucide-history"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Chats"
              @click="historyOpen = true"
            />
          </UTooltip>
        </template>
        <!-- The model to chat with, top left as on the deployment pages. -->
        <template v-else-if="!isNosa" #header>
          <div class="pg-model-pick">
            <!-- Not modal: a modal menu locks the page's scroll, which shifts the whole page. -->
            <UDropdownMenu
              :items="modelMenu"
              :modal="false"
              :content="{ side: 'bottom', align: 'start' }"
              :ui="{ content: 'pg-shell' }"
            >
              <UButton
                :label="modelLabel"
                trailing-icon="i-lucide-chevron-down"
                color="neutral"
                variant="ghost"
                size="md"
                class="pg-model-button"
              >
                <template #leading>
                  <StatusMark :tone="selectedModel?.available ? 'live' : 'neutral'" :size="12" />
                </template>
              </UButton>
              <!-- As on the deployment pages: a status dot, the name, then its context. -->
              <template #item-leading="{ item }">
                <StatusMark :tone="item.live ? 'live' : 'neutral'" :size="12" />
              </template>
              <template #item-label="{ item }">
                <span class="pg-model-option">
                  <span class="pg-model-name">{{ item.label }}</span>
                  <span class="pg-model-meta">{{ item.meta }}</span>
                  <span v-if="item.price" class="pg-model-meta">{{ item.price }}</span>
                </span>
              </template>
            </UDropdownMenu>
          </div>
        </template>
        <template v-if="!isNosa && shown.length" #actions>
          <UButton
            label="New chat"
            icon="i-lucide-plus"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="newChat"
          />
        </template>

        <template #empty>
          <section v-if="isNosa" class="deploy-surface pg-hero">
            <span class="deploy-surface-grid" aria-hidden="true"></span>
            <h2 class="pg-hero-title">
              Ask <span class="pg-hero-accent">Nosa</span>
            </h2>
            <p class="pg-hero-lead">
              Nosa knows Nosana and works with your account: it looks up your deployments,
              markets and credits, and makes changes once you confirm them.
            </p>
            <p v-if="!runModel" class="pg-hero-lead">
              Nosa is not available right now. Check back soon.
            </p>
            <div v-else class="pg-cards">
              <button
                v-for="card in STARTERS"
                :key="card.title"
                type="button"
                class="pg-card pg-plain"
                @click="send(card.text)"
              >
                <span class="pg-card-head">
                  <span class="pg-card-icon"><UIcon :name="card.icon" /></span>
                  <span class="pg-card-title">{{ card.title }}</span>
                </span>
                <span class="pg-card-text">{{ card.text }}</span>
              </button>
            </div>
          </section>

          <section v-else class="pg-ask">
            <h2 class="pg-ask-title">
              {{ runModel ? `Ask ${modelLabel} anything` : "No model is serving right now" }}
            </h2>
            <div v-if="runModel" class="pg-ask-chips">
              <UButton
                v-for="question in EVERYDAY_QUESTIONS"
                :key="question"
                :label="question"
                color="neutral"
                variant="outline"
                class="pg-ask-chip"
                @click="send(question)"
              />
            </div>
          </section>
        </template>


      </PlaygroundShell>
    </div>

    <!-- Narrower windows keep Nosa's chats, as a drawer. -->
    <USlideover
      v-if="isNosa"
      v-model:open="historyOpen"
      side="left"
      title="Chats"
      :ui="{ content: 'pg-shell', body: 'p-0' }"
    >
      <template #body>
        <PlaygroundSidebar
          :chats="recent"
          :current-id="currentId"
          @open="(id) => closeHistory(() => open(id))"
          @create="closeHistory(newChat)"
          @rename="rename"
          @remove="removeChat"
        />
      </template>
    </USlideover>
  </UApp>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useEventListener, useMediaQuery } from "@vueuse/core";
import { useChat } from "@ai-sdk/vue";
import { lastAssistantMessageIsCompleteWithApprovalResponses, type UIMessage } from "ai";
import { en } from "@nuxt/ui/locale";
import StatusMark from "~/components/Common/StatusMark.vue";
import {
  formatTokenCount,
  formatUsd,
  isChatModel,
  modelName,
  pricePerMillion,
  type LlmModel,
} from "~/composables/useLlmGateway";
import { PlaygroundTransport } from "~/utils/playgroundTransport";
import { STARTERS } from "~/utils/playgroundStarters";
import { titleOf } from "~/composables/usePlaygroundChats";
import { nosaRunModel } from "~/composables/useNosaTools";
import type { ChatSettings } from "~/utils/llmChat";

// The playground's empty chat: everyday asks rather than technical ones, so anyone
// has somewhere to start.
const EVERYDAY_QUESTIONS = [
  "How does GPU inference work?",
  "Help me study for an exam",
  "What can I cook tonight?",
];

const props = defineProps<{
  /**
   * `nosa`: Nosa on the chat model admins chose, with its prompt and the Nosana tools,
   * and the chats kept in a list. `model`: the selected model on its own, as an API key
   * calls it, with the page's settings and one chat at a time.
   */
  variant: "nosa" | "model";
  models: LlmModel[];
  loading?: boolean;
  /** The `model` variant's system prompt and temperature. */
  settings?: Pick<ChatSettings, "systemPrompt" | "temperature">;
}>();

const isNosa = computed(() => props.variant === "nosa");

// In the `model` variant the page keeps the selected model.
const model = defineModel<string>({ default: "" });

const config = useRuntimeConfig().public;

// "Reasoning · 3 seconds" over a reply's thinking, where Nuxt UI says "Thought for".
const locale = {
  ...en,
  messages: {
    ...en.messages,
    chatReasoning: { thinking: "Reasoning…", thought: "Reasoning", thoughtFor: "Reasoning · {duration}" },
  },
};
const nosa = useNosaTools();
const toast = useToast();

// The chats sit beside the chat when there is room, in a drawer otherwise.
const wide = useMediaQuery("(min-width: 1280px)");
const historyOpen = ref(false);

function closeHistory(action: () => void) {
  historyOpen.value = false;
  action();
}

const chatModels = computed(() => props.models.filter(isChatModel));
const upModels = computed(() => chatModels.value.filter((entry) => entry.available));
const selectedModel = computed(
  () => props.models.find((entry) => entry.id === model.value) ?? null,
);
/** The model the request goes to; empty while it is not serving. */
const runModel = computed(() => {
  if (!isNosa.value) return selectedModel.value?.id ?? "";
  return nosaRunModel(props.models, nosa.model.value);
});
const modelLabel = computed(() =>
  selectedModel.value ? modelName(selectedModel.value) : "No model",
);
const placeholder = computed(() => {
  if (isNosa.value) return runModel.value ? "Ask Nosa anything" : "Nosa is not available right now";
  return runModel.value ? `Ask ${modelLabel.value} anything` : "No model is serving right now";
});

// A remembered model that is no longer serving gives way to the first that is up.
watch(
  upModels,
  (list) => {
    if (isNosa.value) return;
    if (list.length > 0 && !list.some((entry) => entry.id === model.value))
      model.value = list[0]!.id;
  },
  { immediate: true },
);

/** An entry in the model menu: a status dot, the name, its context and price. */
type ModelOption = {
  label: string;
  meta: string;
  price: string;
  live: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

const modelMenu = computed<ModelOption[][]>(() => [
  chatModels.value.map((entry) => ({
    label: modelName(entry),
    meta: entry.available ? `${formatTokenCount(entry.context_length)} context` : "Not serving",
    price: `${formatUsd(pricePerMillion(entry.pricing.prompt))} in · ${formatUsd(pricePerMillion(entry.pricing.completion))} out per 1M`,
    live: entry.available,
    disabled: !entry.available,
    onSelect: () => (model.value = entry.id),
  })),
]);

if (isNosa.value && nosa.enabled) void nosa.load();
watch(nosa.error, (message) => {
  if (message) toast.add({ title: "Nosa is not available", description: message, color: "error" });
});

const draft = ref("");

// Conversations live in this browser; one is open in the chat at a time.
// Each page keeps its own conversations in this browser.
const { recent, current, currentId, create, open, remove, rename, save, suggest } =
  usePlaygroundChats(props.variant === "nosa" ? "playground-ui" : "playground-models");
if (!current.value) create();

const transport = new PlaygroundTransport(config.apiBase as string, () =>
  isNosa.value
    ? // Nosa answers with the prompt admins edit, and can use the Nosana tools.
      { model: runModel.value, system: nosa.system.value || undefined, tools: nosa.tools.value }
    : {
        model: runModel.value,
        system: props.settings?.systemPrompt.trim() || undefined,
        temperature: props.settings?.temperature,
      },
);

const { messages, status, error, sendMessage, stop, regenerate, addToolApprovalResponse } =
  useChat({
    transport,
    messages: [...(current.value?.messages ?? [])],
    throttle: 50,
    // Once the reader has answered an approval, the reply carries on by itself.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

// A failed reply leaves an empty assistant message behind; neither the reader nor the
// model needs to see it, and the next message is sent as if it were not there.
const hasContent = (message: UIMessage) =>
  message.role !== "assistant" || message.parts.length > 0;
const shown = computed(() => messages.value.filter(hasContent));
watch(shown, (list) => save(list), { deep: true });

// Follow-up questions, asked of the same model once a reply has settled and kept with
// the chat. They are hidden while the reader types and replaced by the next reply's.
const suggestions = ref<string[]>([...(current.value?.suggestions ?? [])]);
const suggesting = ref(false);
let suggestAbort: AbortController | null = null;

function clearSuggestions() {
  suggestAbort?.abort();
  suggestAbort = null;
  suggesting.value = false;
  suggestions.value = [];
}

watch(currentId, () => {
  stop();
  clearSuggestions();
  messages.value = [...(current.value?.messages ?? [])];
  suggestions.value = [...(current.value?.suggestions ?? [])];
});

watch(status, async (now, before) => {
  if (now !== "ready" || before === "ready") return;
  const last = messages.value.at(-1);
  const answered =
    last?.role === "assistant" &&
    last.parts.some((part) => part.type === "text" && part.text.trim()) &&
    !last.parts.some((part) => "state" in part && part.state === "approval-requested");
  if (!answered) return;
  clearSuggestions();
  const chatId = currentId.value;
  const abort = (suggestAbort = new AbortController());
  suggesting.value = true;
  try {
    const list = await transport.suggest(messages.value, abort.signal);
    if (abort.signal.aborted) return;
    suggestions.value = list;
    suggest(chatId, list);
  } catch {
    // Suggestions are an extra; a failed one shows nothing.
  } finally {
    if (!abort.signal.aborted) suggesting.value = false;
  }
});

watch(draft, (text) => {
  if (text) clearSuggestions();
});

function send(text: string) {
  clearSuggestions();
  suggest(currentId.value, []);
  const first = !messages.value.some((message) => message.role === "user");
  if (first && currentId.value) void nameChat(currentId.value, text);
  sendMessage({ text });
}

/** Names a chat after its first question, alongside the answer. */
async function nameChat(chatId: string, question: string) {
  try {
    const name = await transport.title(question);
    const chat = recent.value.find((entry) => entry.id === chatId);
    // A name the reader gave it in the meantime stays.
    if (name && chat && chat.title === titleOf(chat.messages)) rename(chatId, name);
  } catch {
    // The question's own words stay as the name.
  }
}


function newChat() {
  stop();
  clearSuggestions();
  create();
}

function removeChat(id: string) {
  if (id === currentId.value) stop();
  remove(id);
  if (!current.value) create();
}

// Escape stops a reply.
useEventListener(document, "keydown", (event: KeyboardEvent) => {
  if (event.key !== "Escape") return;
  if (status.value === "streaming" || status.value === "submitted") stop();
});
</script>

<style scoped lang="scss">
// The whole page, split into tinted side panes and the white (or near-black)
// page of the conversation. No frame: it is the app, not a card in one.

.pg-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--ui-bg);

  &.has-side {
    grid-template-columns: 260px minmax(0, 1fr);
  }

}

.pg-pane {
  min-width: 0;
  min-height: 0;
}

.pg-pane-side {
  background: var(--pg-pane);
}

.pg-pane-side {
  border-right: 1px solid var(--ui-border);
}

// The starter cards line up with the reading column.
// The deploy page's hero surface (deploy-surface.scss), always dark.
.pg-hero {
  width: 100%;
  max-width: 52rem;
  display: grid;
  gap: 1rem;
  padding: 2.25rem;
}

.pg-hero-title {
  position: relative;
  margin: 0;
  font-family: $title-family;
  font-weight: 600;
  font-size: 2.25rem;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: #fff;
}

.pg-hero-accent {
  color: $secondary;
}

.pg-hero-lead {
  position: relative;
  margin: 0 0 0.5rem;
  color: #b7c0b6;
  font-size: 1.0625rem;
  line-height: 1.55;
}

.pg-cards {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  text-align: left;
}

.pg-card {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1.1rem 1.15rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.2s ease,
    background 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    border-color: rgba($secondary, 0.45);
    background: rgba(255, 255, 255, 0.07);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@media screen and (max-width: 768px) {
  .pg-hero {
    padding: 1.5rem;
  }

  .pg-hero-title {
    font-size: 1.75rem;
  }

  .pg-cards {
    grid-template-columns: minmax(0, 1fr);
  }
}

.pg-card-head {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.pg-card-icon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--pg-green) 0%, #0aa908 100%);
  color: #05230a;
  font-size: 1.2rem;
  box-shadow: 0 8px 20px -10px rgba(16, 232, 12, 0.7);
}



.pg-card-title {
  font-family: var(--pg-title);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  color: #fff;
}

.pg-card-text {
  font-size: 0.85rem;
  line-height: 1.45;
  color: #b7c0b6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pg-model-option {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pg-model-name {
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.pg-model-meta {
  font-size: 0.75rem;
  color: var(--ui-text-muted);
}

.pg-model-button {
  font-weight: 600;
}

.pg-model-pick {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
}

.pg-ask {
  width: 100%;
  max-width: 52rem;
  display: grid;
  justify-items: center;
  gap: 1.25rem;
  text-align: center;
}

.pg-ask-title {
  margin: 0;
  font-family: var(--pg-title);
  font-size: 2.25rem;
  font-weight: 600;
  line-height: 1.15;
  color: var(--ui-text-highlighted);
}

.pg-ask-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
}

.pg-ask-chip {
  border-radius: 999px;
  font-size: 1rem;
  padding: 0.45rem 0.95rem;
}

</style>
