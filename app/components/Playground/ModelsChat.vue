<template>
  <UApp :locale="locale">
    <div
      class="pg-shell pg-workspace"
      :class="{ 'has-side': wide }"
    >
      <PlaygroundSidebar
        v-if="wide"
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
        :placeholder="runModel ? `Ask ${modelLabel} anything` : 'No model is serving right now'"
        :disabled="!runModel"
        :suggestions="suggestions"
        :suggesting="suggesting"
        @send="send"
        @stop="stop"
        @regenerate="(id) => regenerate({ messageId: id })"
        @approve="(id, approved) => addToolApprovalResponse({ id, approved })"
      >
        <template v-if="!wide" #header>
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

        <template #empty>
          <div class="pg-hero">
            <div class="pg-cards">
              <button
                v-for="card in STARTERS"
                :key="card.title"
                type="button"
                class="pg-card pg-plain"
                :disabled="!runModel"
                @click="send(card.text)"
              >
                <span class="pg-card-head">
                  <span class="pg-card-icon"><UIcon :name="card.icon" /></span>
                  <span class="pg-card-title">{{ card.title }}</span>
                </span>
                <span class="pg-card-text">{{ card.text }}</span>
              </button>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="pg-foot">
            <UDropdownMenu :items="modelMenu" :content="{ side: 'top', align: 'start' }" :ui="{ content: 'pg-shell' }">
              <UButton
                :label="modelLabel"
                trailing-icon="i-lucide-chevron-down"
                color="neutral"
                variant="ghost"
                size="xs"
              />
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
      </PlaygroundShell>
    </div>

    <!-- Narrower windows keep the same panes, as drawers. -->
    <USlideover
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

const props = defineProps<{
  models: LlmModel[];
  loading?: boolean;
}>();

// The page keeps the selected model, remembered in this browser.
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

/** Nosa is listed as a model: its prompt and tools, on the first model that is up. */
const NOSA = "nosa";

const chatModels = computed(() => props.models.filter(isChatModel));
const upModels = computed(() => chatModels.value.filter((entry) => entry.available));
const asNosa = computed(() => nosa.enabled && model.value === NOSA);
const selectedModel = computed(() =>
  asNosa.value
    ? (upModels.value[0] ?? null)
    : (props.models.find((entry) => entry.id === model.value) ?? null),
);
/** The model the request goes to. */
const runModel = computed(() => selectedModel.value?.id ?? "");
const modelLabel = computed(() =>
  asNosa.value ? "Nosa" : selectedModel.value ? modelName(selectedModel.value) : "No model",
);

// Nosa is the default where it is available; otherwise, or when a remembered model is
// no longer serving, the first model that is up.
if (!model.value && nosa.enabled) model.value = NOSA;
watch(
  upModels,
  (list) => {
    if (asNosa.value) return;
    if (list.length > 0 && !list.some((entry) => entry.id === model.value))
      model.value = list[0]!.id;
  },
  { immediate: true },
);

/** An entry in the model menu: a status dot, the name, its context and price. */
type ModelOption = {
  label: string;
  meta: string;
  price?: string;
  live: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

const modelMenu = computed<ModelOption[][]>(() => [
  ...(nosa.enabled
    ? [[{
        label: "Nosa",
        meta: "Nosana's assistant",
        live: upModels.value.length > 0,
        onSelect: () => (model.value = NOSA),
      }]]
    : []),
  chatModels.value.map((entry) => ({
    label: modelName(entry),
    meta: entry.available ? `${formatTokenCount(entry.context_length)} context` : "Not serving",
    price: `${formatUsd(pricePerMillion(entry.pricing.prompt))} in · ${formatUsd(pricePerMillion(entry.pricing.completion))} out per 1M`,
    live: entry.available,
    disabled: !entry.available,
    onSelect: () => (model.value = entry.id),
  })),
]);

// Every model gets the Nosana tools, so they load with the page.
if (nosa.enabled) void nosa.load();
watch(nosa.error, (message) => {
  if (message) toast.add({ title: "The Nosana tools are not available", description: message, color: "error" });
});



const draft = ref("");

// Conversations live in this browser; one is open in the chat at a time.
const { recent, current, currentId, create, open, remove, rename, save } = usePlaygroundChats();
if (!current.value) create();

const transport = new PlaygroundTransport(config.apiBase as string, () => ({
  model: runModel.value,
  system: asNosa.value ? nosa.system.value : undefined,
  // Every model can use the Nosana tools; Nosa adds its instructions on top.
  tools: nosa.tools.value,
}));

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

watch(currentId, () => {
  stop();
  clearSuggestions();
  messages.value = [...(current.value?.messages ?? [])];
});

// Follow-up questions, asked of the same model once a reply has settled. They go as
// soon as the reader types, sends or moves to another chat.
const suggestions = ref<string[]>([]);
const suggesting = ref(false);
let suggestAbort: AbortController | null = null;

function clearSuggestions() {
  suggestAbort?.abort();
  suggestAbort = null;
  suggesting.value = false;
  suggestions.value = [];
}

watch(status, async (now, before) => {
  if (now !== "ready" || before === "ready") return;
  const last = messages.value.at(-1);
  const answered =
    last?.role === "assistant" &&
    last.parts.some((part) => part.type === "text" && part.text.trim()) &&
    !last.parts.some((part) => "state" in part && part.state === "approval-requested");
  if (!answered) return;
  clearSuggestions();
  const abort = (suggestAbort = new AbortController());
  suggesting.value = true;
  try {
    const list = await transport.suggest(messages.value, abort.signal);
    if (!abort.signal.aborted) suggestions.value = list;
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

// The chat and its history are one card, like the model's cards beside them.
.pg-workspace {
  @include soft-panel;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  overflow: hidden;

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
.pg-hero {
  width: 100%;
  max-width: 45rem;
  display: grid;
  gap: 1rem;
}

.pg-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  text-align: left;
}

// Template tiles: an icon tile, an eyebrow, a name, two lines, a quiet call.
.pg-card {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 1.1rem 1.15rem 1rem;
  border: 1px solid var(--ui-border);
  border-radius: 14px;
  background: var(--ui-bg-elevated);
  color: var(--ui-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    border-color: rgba(16, 232, 12, 0.45);
    box-shadow: 0 16px 36px -22px rgba(0, 0, 0, 0.45);
  }


  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
  color: var(--ui-text-highlighted);
}

.pg-card-text {
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--ui-text-muted);
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

.pg-foot {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}
</style>
