<template>
  <UApp>
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
        @send="(text) => sendMessage({ text })"
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
                v-for="card in starters"
                :key="card.title"
                type="button"
                class="pg-card pg-plain"
                :disabled="!runModel"
                @click="sendMessage({ text: card.text })"
              >
                <span class="pg-card-head">
                  <span class="pg-card-icon"><UIcon :name="card.icon" /></span>
                  <span class="pg-card-titles">
                    <span class="pg-card-kicker">{{ card.kicker }}</span>
                    <span class="pg-card-title">{{ card.title }}</span>
                  </span>
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
                icon="i-lucide-box"
                :label="modelLabel"
                trailing-icon="i-lucide-chevron-down"
                color="neutral"
                variant="ghost"
                size="xs"
              />
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
import { isChatModel, modelName, type LlmModel } from "~/composables/useLlmGateway";
import { PlaygroundTransport } from "~/utils/playgroundTransport";
import { buildTools } from "~/utils/playgroundTools";
import { NOSA_STARTERS, STARTERS } from "~/utils/playgroundStarters";

const props = defineProps<{
  models: LlmModel[];
  loading?: boolean;
}>();

// The page keeps the selected model, remembered in this browser.
const model = defineModel<string>({ default: "" });

const config = useRuntimeConfig().public;
const nosa = useNosaTools();
const toast = useToast();

// The chats sit beside the chat when there is room, in a drawer otherwise.
const wide = useMediaQuery("(min-width: 1150px)");
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

watch(
  upModels,
  (list) => {
    // Also replaces a model from the URL that cannot chat, such as an embedding model.
    if (asNosa.value) return;
    if (list.length > 0 && !list.some((entry) => entry.id === model.value))
      model.value = list[0]!.id;
  },
  { immediate: true },
);

const modelMenu = computed(() => [
  ...(nosa.enabled
    ? [[{
        label: "Nosa",
        description: "Nosana's assistant, with your account and the docs",
        icon: asNosa.value ? "i-lucide-check" : "i-lucide-sparkles",
        onSelect: () => (model.value = NOSA),
      }]]
    : []),
  chatModels.value.map((entry) => ({
    label: modelName(entry),
    icon: entry.id === model.value ? "i-lucide-check" : "i-lucide-box",
    disabled: !entry.available,
    onSelect: () => (model.value = entry.id),
  })),
]);


watch(asNosa, (on) => on && nosa.load(), { immediate: true });
watch(nosa.error, (message) => {
  if (message) toast.add({ title: "Nosa's tools are not available", description: message, color: "error" });
});


const starters = computed(() => (asNosa.value ? NOSA_STARTERS : STARTERS));

const draft = ref("");

// Conversations live in this browser; one is open in the chat at a time.
const { recent, current, currentId, create, open, remove, rename, save } = usePlaygroundChats();
if (!current.value) create();

const { messages, status, error, sendMessage, stop, regenerate, addToolApprovalResponse } =
  useChat({
    transport: new PlaygroundTransport(config.apiBase as string, () => ({
      model: runModel.value,
      system: asNosa.value ? nosa.system.value : undefined,
      tools: {
        ...buildTools(config.apiBase as string),
        ...(asNosa.value ? nosa.tools.value : {}),
      },
    })),
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
  messages.value = [...(current.value?.messages ?? [])];
});


function newChat() {
  stop();
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
    grid-template-columns: 264px minmax(0, 1fr);
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

.pg-hero {
  width: 100%;
  max-width: 50rem;
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

.pg-card-titles {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pg-card-kicker {
  font-family: var(--pg-mono);
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ui-text-dimmed);
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

.pg-foot {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}
</style>
