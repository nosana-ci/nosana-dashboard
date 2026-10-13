<template>
  <UApp>
    <div
      class="pg-shell pg-workspace"
      :class="{ 'has-side': wide, 'has-inspector': inspectorDocked }"
    >
      <PlaygroundSidebar
        v-if="wide"
        class="pg-pane pg-pane-side"
        :chats="recent"
        :current-id="currentId"
        :prompts="PROMPTS"
        @open="open"
        @create="newChat"
        @remove="removeChat"
        @prompt="fill"
        @search="paletteOpen = true"
      />

      <PlaygroundShell
        v-model:draft="draft"
        class="pg-pane pg-pane-main"
        :messages="shown"
        :status="status"
        :error="error"
        :placeholder="
          !apiKey
            ? 'Create an API key under Code to chat'
            : selectedModel
              ? `Ask ${modelName(selectedModel)} anything`
              : 'No model is serving right now'
        "
        :disabled="!model || !apiKey"
        @send="(text) => sendMessage({ text })"
        @stop="stop"
        @regenerate="(id) => regenerate({ messageId: id })"
        @rewind="rewind"
        @speak="speak"
        @branch="branchFrom"
        @approve="approve"
        @slash="paletteOpen = true"
      >
        <template #header>
          <UTooltip v-if="!wide" text="Chats and prompts">
            <UButton
              icon="i-lucide-panel-left"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Chats and prompts"
              @click="sideOpen = true"
            />
          </UTooltip>
          <h2 class="pg-title" :title="chatTitle">{{ chatTitle }}</h2>
          <UPopover v-model:open="renameOpen" :ui="{ content: 'pg-shell p-2' }">
            <UTooltip text="Rename chat">
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="xs"
                aria-label="Rename chat"
                :disabled="!shown.length"
                @click="renameDraft = current?.title ?? ''"
              />
            </UTooltip>
            <template #content>
              <form class="pg-rename" @submit.prevent="commitRename">
                <UInput v-model="renameDraft" placeholder="Chat title" size="sm" autofocus />
                <UButton type="submit" label="Save" size="sm" />
              </form>
            </template>
          </UPopover>
        </template>

        <template #actions>
          <UTooltip text="Copy a link to this chat">
            <UButton
              icon="i-lucide-link"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Copy a link to this chat"
              :disabled="!shown.length"
              @click="shareChat"
            />
          </UTooltip>
          <UDropdownMenu :items="exportMenu" :content="{ align: 'end' }" :ui="{ content: 'pg-shell' }">
            <UTooltip text="Export chat">
              <UButton
                icon="i-lucide-download"
                color="neutral"
                variant="ghost"
                size="sm"
                aria-label="Export chat"
                :disabled="!shown.length"
              />
            </UTooltip>
          </UDropdownMenu>
          <UTooltip text="Clear messages">
            <UButton
              icon="i-lucide-eraser"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Clear messages"
              :disabled="!shown.length"
              @click="clear"
            />
          </UTooltip>
          <UTooltip text="Delete chat">
            <UButton
              icon="i-lucide-trash-2"
              color="neutral"
              variant="ghost"
              size="sm"
              aria-label="Delete chat"
              @click="deleteChat"
            />
          </UTooltip>
          <UTooltip :text="inspectorDocked ? 'Hide settings, tools and code' : 'Settings, tools and code'">
            <UButton
              icon="i-lucide-panel-right"
              color="neutral"
              :variant="inspectorDocked ? 'soft' : 'ghost'"
              size="sm"
              aria-label="Settings, tools and code"
              :aria-pressed="inspectorDocked"
              @click="toggleInspector"
            />
          </UTooltip>
        </template>

        <template #empty>
          <div class="pg-hero">
            <section class="pg-hero-surface">
              <div class="pg-hero-grid" aria-hidden="true"></div>
              <div class="pg-hero-copy">
                <h2 class="pg-hero-title">
                  <template v-if="asNosa">
                    Ask <span class="pg-hero-accent">Nosa</span><br />about Nosana.
                  </template>
                  <template v-else>
                    What would<br />you like to <span class="pg-hero-accent">ask</span>?
                  </template>
                </h2>
                <p class="pg-hero-sub">
                  {{ selectedModel ? modelName(selectedModel) : "A model" }} is
                  serving on Nosana, billed to your credits. Pick a starting
                  point, or write your own below.
                </p>
              </div>
            </section>
            <div class="pg-cards">
              <button
                v-for="card in STARTERS"
                :key="card.title"
                type="button"
                class="pg-card pg-plain"
                :disabled="!model || !apiKey"
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
                <span class="pg-card-cta">
                  Send
                  <UIcon name="i-lucide-arrow-right" />
                </span>
              </button>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="pg-foot">
            <UDropdownMenu :items="modelMenu" :content="{ side: 'top', align: 'start' }" :ui="{ content: 'pg-shell' }">
              <UButton
                icon="i-lucide-box"
                :label="selectedModel ? modelName(selectedModel) : 'No model'"
                trailing-icon="i-lucide-chevron-down"
                color="neutral"
                variant="ghost"
                size="xs"
              />
            </UDropdownMenu>
            <UPopover :content="{ side: 'top', align: 'start' }" :ui="{ content: 'pg-shell p-3 w-64' }">
              <UButton
                icon="i-lucide-wrench"
                :label="toolsLabel"
                color="neutral"
                variant="ghost"
                size="xs"
              />
              <template #content>
                <div class="pg-foot-tools">
                  <USwitch
                    v-for="entry in TOOL_CATALOG"
                    :key="entry.id"
                    :model-value="settings.tools.includes(entry.id)"
                    :label="entry.label"
                    size="sm"
                    @update:model-value="(on) => toggleTool(entry.id, on)"
                  />
                </div>
              </template>
            </UPopover>
            <span class="pg-foot-hint">
              <UKbd value="/" size="sm" /> commands
            </span>
            <span class="pg-foot-grow" />
            <UTooltip text="Rewrite the prompt to be clearer and more specific">
              <UButton
                icon="i-lucide-wand-sparkles"
                label="Improve"
                color="neutral"
                variant="ghost"
                size="xs"
                :loading="improving"
                :disabled="!draft.trim() || !apiKey"
                @click="improve"
              />
            </UTooltip>
            <UTooltip v-if="canListen" :text="listening ? 'Stop dictating' : 'Dictate'">
              <UButton
                :icon="listening ? 'i-lucide-mic-off' : 'i-lucide-mic'"
                :color="listening ? 'primary' : 'neutral'"
                :variant="listening ? 'soft' : 'ghost'"
                size="xs"
                :aria-pressed="listening"
                aria-label="Dictate"
                @click="toggleListening"
              />
            </UTooltip>
          </div>
        </template>
      </PlaygroundShell>

      <PlaygroundInspector
        v-if="inspectorDocked"
        v-model:settings="settings"
        v-model:custom-key="customKey"
        class="pg-pane pg-pane-inspector"
        :model="selectedModel"
        :model-id="model"
        :code-url="codeUrl"
        :usage="usage"
        :knowledge="knowledge"
        :mcp="mcp"
        :nosa="nosa"
      />
    </div>

    <!-- Narrower windows keep the same panes, as drawers. -->
    <USlideover
      v-model:open="sideOpen"
      side="left"
      title="Chats"
      description="Your conversations and saved prompts"
      :ui="{ content: 'pg-shell', body: 'p-0' }"
    >
      <template #body>
        <PlaygroundSidebar
          :chats="recent"
          :current-id="currentId"
          :prompts="PROMPTS"
          @open="(id) => closeSide(() => open(id))"
          @create="closeSide(newChat)"
          @remove="removeChat"
          @prompt="(text) => closeSide(() => fill(text))"
          @search="closeSide(() => (paletteOpen = true))"
        />
      </template>
    </USlideover>
    <USlideover
      v-model:open="inspectorOpen"
      side="right"
      title="Model"
      description="Settings, tools and the code sample"
      :ui="{ content: 'pg-shell', body: 'p-0' }"
    >
      <template #body>
        <PlaygroundInspector
          v-model:settings="settings"
          v-model:custom-key="customKey"
          :model="selectedModel"
          :model-id="model"
          :code-url="codeUrl"
          :usage="usage"
          :knowledge="knowledge"
          :mcp="mcp"
          :nosa="nosa"
        />
      </template>
    </USlideover>

    <!-- ⌘K: past chats, saved prompts and the actions, searchable. -->
    <UModal
      v-model:open="paletteOpen"
      title="Playground commands"
      description="Search chats, prompts and actions"
      :ui="{
        content:
          'pg-shell pg-palette p-0 sm:max-w-2xl rounded-2xl ring-0 overflow-hidden',
        overlay: 'bg-black/50 backdrop-blur-sm',
      }"
    >
      <template #content>
        <UCommandPalette
          :groups="paletteGroups"
          placeholder="Search chats, prompts and actions…"
          close
          :ui="PALETTE_UI"
          @update:open="paletteOpen = $event"
        />
      </template>
    </UModal>
  </UApp>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useEventListener, useLocalStorage, useMediaQuery } from "@vueuse/core";
import { useChat } from "@ai-sdk/vue";
import { getTextFromMessage } from "@nuxt/ui/utils/ai";
import {
  isChatModel,
  modelName,
  type LlmModel,
} from "~/composables/useLlmGateway";
import { lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import {
  ModelChatTransport,
  hasContent,
  improvePrompt,
  languageModel,
  type ModelRequest,
  type ModelUIMessage,
} from "~/utils/modelTransport";
import { decodeShare, encodeShare } from "~/utils/playgroundShare";
import type { PlaygroundUsage } from "~/components/Playground/Inspector.vue";
import { buildTools, TOOL_CATALOG } from "~/utils/playgroundTools";
import {
  DEFAULT_SETTINGS,
  NOSA_TOOLS,
  PROMPTS,
  STARTERS,
  resolveMaxTokens,
  type PlaygroundSettings,
} from "~/utils/playgroundSettings";

// Spotlight proportions: a tall search line, roomy rows, quiet group labels.
const PALETTE_UI = {
  input: "[&>input]:h-14 [&>input]:text-base",
  viewport: "p-3",
  group: "p-1",
  label: "px-3.5 pt-3 pb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.07em] text-dimmed",
  item: "px-3.5 py-2.5 gap-3 rounded-lg text-sm",
  itemLeadingIcon: "size-4 text-dimmed",
  itemLabelSuffix: "text-dimmed",
  itemTrailingKbds: "gap-1",
};

const props = defineProps<{
  models: LlmModel[];
  loading?: boolean;
  /** The base URL the code sample calls. */
  codeUrl: string;
}>();

// The page keeps the selected model so a playground link can name it.
const model = defineModel<string>({ default: "" });

const config = useRuntimeConfig().public;
// The gateway authenticates the user's own API key, the one the code sample shows.
const inferenceBase = (config.inferenceBase as string).replace(/\/$/, "");
const apiBase = config.apiBase as string;
const { apiKey, customKey } = usePlaygroundKey();

// The reader's documents and MCP servers, both offered to the model as tools.
const embeddingModel = computed(
  () => props.models.find((entry) => /embed/i.test(entry.id) && entry.available)?.id ?? null,
);
const knowledge = useKnowledge(() => ({
  baseURL: `${inferenceBase}/v1`,
  apiKey: apiKey.value,
  model: embeddingModel.value,
}));
const nosaUrl = ((config.nosaUrl as string | undefined) || "").replace(/\/$/, "") || undefined;
// Nosa's persona, run on whichever model is selected.
const nosa = useNosaProfile(nosaUrl);
const mcp = useMcpServers({ nosaUrl });

// Three panes with room for them; drawers otherwise. The dashboard's own nav
// takes the first 240px of the window.
const wide = useMediaQuery("(min-width: 1500px)");
const medium = useMediaQuery("(min-width: 1150px)");
const sideOpen = ref(false);
const inspectorOpen = ref(false);
const paletteOpen = ref(false);

// The inspector stays out of the way until asked for; the choice is remembered.
// With room it docks beside the chat, otherwise it is a drawer.
const showInspector = useLocalStorage("playground-inspector", false);
const inspectorDocked = computed(() => medium.value && showInspector.value);

function toggleInspector() {
  if (medium.value) showInspector.value = !showInspector.value;
  else inspectorOpen.value = true;
}

function closeSide(action: () => void) {
  sideOpen.value = false;
  action();
}

const chatModels = computed(() => props.models.filter(isChatModel));
const selectedModel = computed(
  () => props.models.find((entry) => entry.id === model.value) ?? null,
);

watch(
  () => chatModels.value.filter((entry) => entry.available),
  (list) => {
    // Also replaces a model from the URL that cannot chat, such as an embedding model.
    if (list.length > 0 && !list.some((entry) => entry.id === model.value))
      model.value = list[0]!.id;
  },
  { immediate: true },
);

const modelMenu = computed(() => [
  chatModels.value.map((entry) => ({
    label: modelName(entry),
    icon: entry.id === model.value ? "i-lucide-check" : "i-lucide-box",
    disabled: !entry.available,
    onSelect: () => (model.value = entry.id),
  })),
]);

const settings = useLocalStorage<PlaygroundSettings>(
  "playground-ui-settings",
  DEFAULT_SETTINGS,
  { mergeDefaults: true },
);

function toggleTool(id: string, on: boolean) {
  const rest = settings.value.tools.filter((entry) => entry !== id);
  settings.value.tools = on ? [...rest, id] : rest;
}

const toolsLabel = computed(() => {
  const on = toolIds.value.length + Object.keys(mcp.toolSet.value).length;
  return on === 0 ? "No tools" : `${on} tool${on === 1 ? "" : "s"} on`;
});

const draft = ref("");

/** Puts text in the prompt for the reader to finish, and focuses it. */
function fill(text: string) {
  draft.value = text;
  requestAnimationFrame(() => {
    document.querySelector<HTMLTextAreaElement>(".pg-composer textarea")?.focus();
  });
}

// Conversations live in this browser; one is open in the chat at a time.
const {
  recent,
  current,
  currentId,
  create,
  branch,
  open,
  remove,
  rename,
  save,
} = usePlaygroundChats();
if (!current.value) create();

const asNosa = computed(() => settings.value.persona === "nosa");

/** Nosa's instructions first, then whatever the reader added. */
const systemPrompt = computed(() => {
  const own = settings.value.systemPrompt.trim();
  if (!asNosa.value) return own;
  const base = nosa.profile.value?.system ?? "";
  return own ? `${base}\n\n${own}` : base;
});

const toolIds = computed(() =>
  asNosa.value
    ? [...new Set([...settings.value.tools, ...NOSA_TOOLS])]
    : settings.value.tools,
);

const request = (): ModelRequest => ({
  baseURL: `${inferenceBase}/v1`,
  apiKey: apiKey.value,
  model: model.value,
  system: systemPrompt.value,
  temperature: settings.value.temperature,
  maxTokens: resolveMaxTokens(
    settings.value,
    selectedModel.value?.max_output_tokens,
  ),
  tools: {
    ...buildTools(toolIds.value, {
      apiBase,
      nosaUrl,
      officialLinks: () => nosa.profile.value?.officialLinks ?? null,
      model: () => languageModel(`${inferenceBase}/v1`, apiKey.value, model.value),
      knowledge: {
        count: () => knowledge.docs.value.length,
        search: (query, limit) => knowledge.query(query, limit),
      },
    }),
    ...mcp.toolSet.value,
  },
  pricing: selectedModel.value?.pricing,
});

const {
  messages,
  status,
  error,
  sendMessage,
  stop,
  regenerate,
  addToolApprovalResponse,
} = useChat<ModelUIMessage>({
  transport: new ModelChatTransport(request),
  messages: [...(current.value?.messages ?? [])],
  throttle: 50,
  // Once the reader has answered an approval, the reply carries on by itself.
  sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
});

function approve(id: string, approved: boolean) {
  addToolApprovalResponse({ id, approved });
}

const toast = useToast();

// Dictation lands in the prompt; a reply can be read back.
const { canListen, listening, toggleListening, speak } = usePlaygroundSpeech(
  (text) => {
    const spoken = text.trim();
    if (spoken) draft.value = draft.value ? `${draft.value} ${spoken}` : spoken;
  },
);

// One call to the same model turns a rough draft into a clear prompt.
const improving = ref(false);
async function improve() {
  const text = draft.value.trim();
  if (!text || improving.value) return;
  improving.value = true;
  try {
    draft.value = await improvePrompt(request(), text);
  } catch (cause) {
    toast.add({
      title: "Could not improve the prompt",
      description: cause instanceof Error ? cause.message : String(cause),
      color: "error",
    });
  } finally {
    improving.value = false;
  }
}

// The chat as a link: everything is in the URL fragment, nothing is uploaded.
async function shareChat() {
  const hash = await encodeShare(current.value?.title ?? "", shown.value);
  const url = `${location.origin}/playground${hash}`;
  await navigator.clipboard.writeText(url);
  toast.add({
    title: "Link copied",
    description: `${Math.round(url.length / 1024)} KB, holding the whole chat`,
    icon: "i-lucide-link",
  });
}

onMounted(async () => {
  mcp.connectAll();
  void nosa.load();
  const shared = await decodeShare(location.hash);
  if (!shared) return;
  stop();
  const chat = create();
  // The chat switch empties the messages on the next tick; the import comes after it.
  await nextTick();
  messages.value = shared.messages;
  if (shared.title) rename(chat.id, shared.title);
  history.replaceState(null, "", location.pathname + location.search);
  toast.add({ title: "Shared chat opened", icon: "i-lucide-link" });
});

// What this chat has cost so far, from the replies' own records.
const usage = computed<PlaygroundUsage>(() => {
  const replies = shown.value.filter(
    (entry) => entry.role === "assistant" && entry.metadata,
  );
  const tps: number[] = [];
  let inputTokens = 0;
  let outputTokens = 0;
  let costUsd = 0;
  for (const reply of replies) {
    const s = reply.metadata!;
    inputTokens += s.inputTokens ?? 0;
    outputTokens += s.outputTokens ?? 0;
    costUsd += s.costUsd ?? 0;
    if (s.outputTokens && s.duration) tps.push(s.outputTokens / s.duration);
  }
  return { requests: replies.length, inputTokens, outputTokens, costUsd, tps };
});

// A failed reply leaves an empty assistant message behind; neither the reader nor the
// model needs to see it, and the next message is sent as if it were not there.
const shown = computed(() => messages.value.filter(hasContent));
watch(shown, (list) => save(list), { deep: true });

watch(currentId, () => {
  stop();
  messages.value = [...(current.value?.messages ?? [])];
});

const chatTitle = computed(() => current.value?.title || "New chat");

const renameOpen = ref(false);
const renameDraft = ref("");

function commitRename() {
  if (current.value) rename(current.value.id, renameDraft.value);
  renameOpen.value = false;
}

function newChat() {
  stop();
  create();
}

function clear() {
  stop();
  messages.value = [];
  if (current.value) current.value.title = "";
}

function removeChat(id: string) {
  if (id === currentId.value) stop();
  remove(id);
  if (!current.value) create();
}

function deleteChat() {
  if (current.value) removeChat(current.value.id);
}

/** A new chat that shares everything up to this message, to take elsewhere. */
function branchFrom(messageId: string) {
  const index = messages.value.findIndex((entry) => entry.id === messageId);
  const source = current.value;
  if (index < 0 || !source) return;
  stop();
  const kept = messages.value.slice(0, index + 1);
  const base = source.title || "New chat";
  const title = base.includes("· branch") ? base : `${base} · branch`;
  branch(source.id, kept, title);
  toast.add({
    title: "Branched",
    description: `Carrying on from message ${index + 1} in a new chat.`,
    icon: "i-lucide-git-branch",
  });
}

/** Back to just before this message, so an edited version can be sent instead. */
function rewind(messageId: string) {
  stop();
  const index = messages.value.findIndex((entry) => entry.id === messageId);
  if (index >= 0) messages.value = messages.value.slice(0, index);
}

function exportChat(format: "md" | "json") {
  const list = shown.value;
  if (!list.length) return;
  const name = (current.value?.title || "playground-chat")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  const body =
    format === "json"
      ? JSON.stringify(list, null, 2)
      : list
          .map((entry) => {
            const who =
              entry.role === "user"
                ? "You"
                : entry.metadata?.model || "Assistant";
            return `## ${who}\n\n${getTextFromMessage(entry)}`;
          })
          .join("\n\n");
  const blob = new Blob([body], {
    type: format === "json" ? "application/json" : "text/markdown",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}

/** "just now", "5m ago", "3h ago", "2d ago". */
function ago(timestamp: number): string {
  const seconds = Math.max(0, (Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const exportMenu = [
  [
    {
      label: "Copy share link",
      icon: "i-lucide-link",
      onSelect: shareChat,
    },
    {
      label: "Export as Markdown",
      icon: "i-lucide-file-text",
      onSelect: () => exportChat("md"),
    },
    {
      label: "Export as JSON",
      icon: "i-lucide-braces",
      onSelect: () => exportChat("json"),
    },
  ],
];

const paletteGroups = computed(() => [
  {
    id: "actions",
    label: "Actions",
    items: [
      {
        label: "New chat",
        icon: "i-lucide-plus",
        kbds: ["meta", "shift", "o"],
        onSelect: () => done(newChat),
      },
      {
        label: "Copy share link",
        icon: "i-lucide-link",
        onSelect: () => done(shareChat),
      },
      {
        label: "Clear messages",
        icon: "i-lucide-eraser",
        onSelect: () => done(clear),
      },
      {
        label: "Export as Markdown",
        icon: "i-lucide-file-text",
        onSelect: () => done(() => exportChat("md")),
      },
      {
        label: "Export as JSON",
        icon: "i-lucide-braces",
        onSelect: () => done(() => exportChat("json")),
      },
    ],
  },
  {
    id: "prompts",
    label: "Prompts",
    items: PROMPTS.map((prompt) => ({
      label: prompt.label,
      suffix: prompt.text.replace(/\s+/g, " ").slice(0, 70),
      icon: "i-lucide-sparkles",
      onSelect: () => done(() => fill(prompt.text)),
    })),
  },
  {
    id: "chats",
    label: "Conversations",
    items: recent.value.map((chat) => ({
      label: chat.title || "New chat",
      suffix: ago(chat.updatedAt),
      icon:
        chat.id === currentId.value
          ? "i-lucide-check"
          : "i-lucide-message-square",
      onSelect: () => done(() => open(chat.id)),
    })),
  },
]);

function done(action: () => void) {
  paletteOpen.value = false;
  action();
}

defineShortcuts({
  meta_k: () => (paletteOpen.value = !paletteOpen.value),
  meta_shift_o: newChat,
});

// Escape stops a reply. Not a shortcut above: those prevent the default, and an
// Escape that is prevented no longer closes a menu or popover.
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

  &.has-inspector {
    grid-template-columns: minmax(0, 1fr) 350px;
  }

  &.has-side {
    grid-template-columns: 264px minmax(0, 1fr);
  }

  &.has-side.has-inspector {
    grid-template-columns: 264px minmax(0, 1fr) 350px;
  }
}

.pg-pane {
  min-width: 0;
  min-height: 0;
}

.pg-pane-side,
.pg-pane-inspector {
  background: var(--pg-pane);
}

.pg-pane-side {
  border-right: 1px solid var(--ui-border);
}

.pg-pane-inspector {
  border-left: 1px solid var(--ui-border);
}

.pg-title {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--pg-title);
  font-size: 0.98rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ui-text-highlighted);
}

.pg-rename {
  display: flex;
  gap: 0.4rem;
}

.pg-hero {
  width: 100%;
  max-width: 50rem;
  display: grid;
  gap: 1rem;
}

// The dark, green-lit surface the deploy and developer pages open with.
.pg-hero-surface {
  position: relative;
  overflow: hidden;
  padding: 2.25rem 2.5rem;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at 88% 10%, rgba(16, 232, 12, 0.18), transparent 44%),
    linear-gradient(135deg, #0a0c0a 0%, #0f130d 55%, #0b0d0b 100%);
  box-shadow: 0 24px 60px -30px rgba(0, 0, 0, 0.6);
}

.pg-hero-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: linear-gradient(to bottom, black, transparent 90%);
  pointer-events: none;
}

.pg-hero-copy {
  position: relative;
}

.pg-hero-title {
  margin: 0 0 0.6rem;
  font-family: var(--pg-title);
  font-size: 2.35rem;
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.01em;
  color: #fff;
}

.pg-hero-accent {
  color: var(--pg-green);
}

.pg-hero-sub {
  margin: 0;
  max-width: 32rem;
  font-size: 0.98rem;
  line-height: 1.5;
  color: #b7c0b6;
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

  &:hover:not(:disabled) .pg-card-cta {
    color: var(--ui-primary);

    :deep(svg),
    :deep(span) {
      transform: translateX(3px);
    }
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

.pg-card-cta {
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid var(--ui-border-muted);
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--ui-text-dimmed);
  transition: color 0.2s ease;

  :deep(span) {
    transition: transform 0.2s ease;
  }
}

.pg-foot {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.pg-foot-tools {
  display: grid;
  gap: 0.6rem;
}

.pg-foot-grow {
  flex: 1;
}

.pg-foot-hint {
  margin-left: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: var(--ui-text-dimmed);
}
</style>
