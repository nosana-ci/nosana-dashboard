<template>
  <div class="pg-chat">
    <header v-if="$slots.header || $slots.actions" class="pg-bar">
      <div class="pg-bar-main">
        <slot name="header" />
      </div>
      <div class="pg-bar-acts">
        <slot name="actions" />
      </div>
    </header>

    <div v-if="messages.length" class="pg-scroll">
      <UChatMessages
        :messages="messages"
        :status="status"
        should-auto-scroll
        :assistant="{
          variant: 'naked',
          actions: assistantActions,
        }"
        :user="{ variant: 'naked', side: 'right', actions: userActions }"
        :spacing-offset="140"
        class="pg-messages"
      >
        <template #content="{ message }">
          <template v-for="run in runs(message)" :key="run.key">
            <template v-if="run.text">
              <PlaygroundMarkdown
                v-if="message.role === 'assistant'"
                :text="run.text.text"
                :streaming="streaming(run.text, message)"
              />
              <p v-else class="pg-user-text">{{ run.text.text }}</p>
            </template>
            <!-- Reasoning and tool calls in a row read as one indented thread, folded
                 to a summary line once the reply is done. -->
            <div v-else class="pg-thread">
              <button
                v-if="run.steps.length > 1"
                type="button"
                class="pg-thread-head pg-plain"
                :aria-expanded="threadOpen(message, run.key, run.steps)"
                @click="toggleThread(run.key)"
              >
                <UIcon
                  :name="threadOpen(message, run.key, run.steps) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                  class="pg-thread-chevron"
                />
                {{ threadSummary(message, run.steps) }}
              </button>
              <div v-if="run.steps.length === 1 || threadOpen(message, run.key, run.steps)" class="pg-steps">
                <template v-for="(part, j) in run.steps" :key="j">
                  <UChatReasoning
                    v-if="part.type === 'reasoning'"
                    icon="i-lucide-brain"
                    :text="part.text"
                    :duration="reasoningSeconds(message, part)"
                    :streaming="streaming(part, message)"
                    class="my-1"
                  >
                    <PlaygroundMarkdown
                      :text="part.text"
                      :streaming="streaming(part, message)"
                    />
                  </UChatReasoning>
                  <UChatTool
                    v-else-if="isToolUIPart(part)"
                    :text="toolLabel(part)"
                    icon="i-lucide-wrench"
                    :suffix="toolSuffix(part)"
                    :loading="toolBusy(part)"
                    :default-open="part.state === 'approval-requested'"
                    :actions="approvalActions(part)"
                    class="my-1"
                  >
                    <pre class="pg-tool-body">{{ toolBody(part) }}</pre>
                  </UChatTool>
                </template>
              </div>
            </div>
          </template>
        </template>
      </UChatMessages>
    </div>

    <div v-else class="pg-empty">
      <slot name="empty" />
    </div>

    <div class="pg-composer">
      <p v-if="suggesting" class="pg-suggesting">
        <UIcon name="i-lucide-loader-circle" class="pg-suggesting-icon" />
        Suggesting follow-ups…
      </p>
      <div v-else-if="suggestions?.length" class="pg-suggestions">
        <UButton
          v-for="question in suggestions"
          :key="question"
          :label="question"
          color="neutral"
          variant="outline"
          size="lg"
          class="pg-suggestion"
          @click="emit('send', question)"
        />
      </div>
      <UChatPrompt
        v-model="draft"
        :placeholder="placeholder"
        variant="subtle"
        :disabled="disabled"
        @submit="submit"
      >
        <!-- The send button sits on the footer row with the page's controls,
             not in the corner of the text. -->
        <template #footer>
          <div class="pg-composer-foot">
            <slot name="footer" />
            <UChatPromptSubmit
              :status="status"
              class="pg-send"
              @stop="emit('stop')"
              @reload="emit('regenerate')"
            />
          </div>
        </template>
      </UChatPrompt>
      <p v-if="error" class="pg-error">{{ error.message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  getToolName,
  isToolUIPart,
  type ChatStatus,
  type DynamicToolUIPart,
  type TextUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";
import { getTextFromMessage } from "@nuxt/ui/utils/ai";
import type { ReplyMetadata } from "~/utils/playgroundTransport";

type AnyToolPart = ToolUIPart | DynamicToolUIPart;
type Part = UIMessage["parts"][number];

/** A stretch of a message: a text part on its own, or reasoning and tool calls in a row. */
type Run = { key: string; text: TextUIPart; steps?: never } | { key: string; text?: never; steps: Part[] };

/** How long a reasoning step took, as the transport recorded it with the reply. */
function reasoningSeconds(message: UIMessage, part: Part): number | undefined {
  const index = message.parts
    .filter((entry) => entry.type === "reasoning")
    .findIndex((entry) => entry === part);
  return (message.metadata as ReplyMetadata | undefined)?.reasoningSeconds?.[index];
}

// Threads of several steps fold to one line once the reply is done. A reply still
// running, or a step waiting on the reader, keeps its thread open.
const expanded = ref(new Set<string>());

function toggleThread(key: string) {
  const next = new Set(expanded.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  expanded.value = next;
}

const isLive = (message: UIMessage) =>
  (props.status === "submitted" || props.status === "streaming") &&
  message.id === props.messages.at(-1)?.id;

function threadOpen(message: UIMessage, key: string, steps: Part[]): boolean {
  return (
    isLive(message) ||
    steps.some((part) => isToolUIPart(part) && part.state === "approval-requested") ||
    expanded.value.has(key)
  );
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** "Used 7 tools · reasoned 12 seconds", or how far a running reply has got. */
function threadSummary(message: UIMessage, steps: Part[]): string {
  const tools = steps.filter(isToolUIPart).length;
  if (isLive(message)) return tools ? `Working… · ${plural(tools, "tool")}` : "Working…";
  const seconds = steps
    .filter((part) => part.type === "reasoning")
    .reduce((sum, part) => sum + (reasoningSeconds(message, part) ?? 0), 0);
  const parts = [
    tools ? `Used ${plural(tools, "tool")}` : "",
    seconds ? `reasoned ${plural(seconds, "second")}` : "",
  ].filter(Boolean);
  const text = parts.join(" · ") || "Reasoned";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function runs(message: UIMessage): Run[] {
  const out: Run[] = [];
  message.parts.forEach((part, i) => {
    const key = `${message.id}-${i}`;
    if (part.type === "text") out.push({ key, text: part });
    else if (part.type === "reasoning" || isToolUIPart(part)) {
      const last = out.at(-1);
      if (last?.steps) last.steps.push(part);
      else out.push({ key, steps: [part] });
    }
  });
  return out;
}

const props = defineProps<{
  messages: UIMessage[];
  status: ChatStatus;
  error?: Error;
  placeholder?: string;
  disabled?: boolean;
  /** Follow-up questions, offered above the prompt. */
  suggestions?: string[];
  /** The follow-up questions are being written. */
  suggesting?: boolean;
}>();

const emit = defineEmits<{
  send: [text: string];
  stop: [];
  regenerate: [messageId?: string];
  /** The reader's answer to a tool that asked first. */
  approve: [approvalId: string, approved: boolean];
}>();

// The page can fill the prompt too, from a starter card.
const draft = defineModel<string>("draft", { default: "" });
const toast = useToast();

/** A part is only live while the last reply is still coming in; a stopped reply keeps
    its "streaming" state, and so does one saved mid-stream. */
function streaming(part: UIMessage["parts"][number], message: UIMessage): boolean {
  return (
    "state" in part &&
    part.state === "streaming" &&
    props.status === "streaming" &&
    message.id === props.messages.at(-1)?.id
  );
}

function submit() {
  const text = draft.value.trim();
  if (!text) return;
  draft.value = "";
  emit("send", text);
}

const copy = (_: MouseEvent, message: UIMessage) => {
  navigator.clipboard.writeText(getTextFromMessage(message));
  toast.add({ title: "Copied", icon: "i-lucide-check", duration: 1500 });
};

const userActions = [{ label: "Copy", icon: "i-lucide-copy", onClick: copy }];
const assistantActions = [
  { label: "Copy", icon: "i-lucide-copy", onClick: copy },
  {
    label: "Regenerate",
    icon: "i-lucide-refresh-cw",
    onClick: (_: MouseEvent, message: UIMessage) =>
      emit("regenerate", message.id),
  },
];

const toolBusy = (part: AnyToolPart) =>
  part.state === "input-streaming" || part.state === "input-available";

function toolLabel(part: AnyToolPart): string {
  // An MCP tool's name reads as words rather than an identifier.
  const name = humanize(getToolName(part));
  switch (part.state) {
    case "approval-requested":
      return `Wants to run ${name}`;
    case "approval-responded":
      return part.approval?.approved ? `${name} approved` : `${name} declined`;
    case "output-denied":
      return `${name} declined`;
    case "output-error":
      return `${name} failed`;
    default:
      return toolBusy(part) ? `Calling ${name}` : `Used ${name}`;
  }
}

/** "patchDeploymentsByDeploymentUpdateReplicaCount" → "patch deployments update replica count". */
function humanize(name: string): string {
  const words = name
    .replace(/[-_]/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .filter(Boolean);
  const kept: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (words[i]!.toLowerCase() === "by") {
      i++;
      continue;
    }
    kept.push(words[i]!.toLowerCase());
  }
  return kept.join(" ");
}

/** Approve and decline, while a tool is waiting on the reader. */
function approvalActions(part: AnyToolPart) {
  if (part.state !== "approval-requested") return undefined;
  const id = part.approval.id;
  return [
    {
      label: "Confirm",
      icon: "i-lucide-check",
      color: "primary" as const,
      onClick: () => emit("approve", id, true),
    },
    {
      label: "Decline",
      color: "neutral" as const,
      variant: "ghost" as const,
      onClick: () => emit("approve", id, false),
    },
  ];
}

/** The first string argument, such as the expression or the search. */
function toolSuffix(part: AnyToolPart): string | undefined {
  const input = part.input as Record<string, unknown> | undefined;
  const first = input && Object.values(input).find((v) => typeof v === "string");
  return typeof first === "string" ? first : undefined;
}


function toolBody(part: AnyToolPart): string {
  const value =
    part.state === "output-available"
      ? part.output
      : part.state === "output-error"
        ? part.errorText
        : part.input;
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

</script>

<style scoped lang="scss">
.pg-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  background: var(--ui-bg);
}

// The toolbar row every pane shares: one hairline runs across the window.
.pg-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex: none;
  height: var(--pg-toolbar);
  padding: 0 0.75rem 0 1.1rem;
  border-bottom: 1px solid var(--ui-border);
}

.pg-bar-main {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}

.pg-bar-acts {
  display: flex;
  align-items: center;
  gap: 2px;
}

.pg-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

// One reading column, as wide as ChatGPT's, shared with the composer.
.pg-messages {
  max-width: 48rem;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 0.75rem;
  font-size: 1rem;
}

// The reader's turn is a bubble; the model's is the page.
.pg-messages :deep([data-role="user"] [data-slot="content"]) {
  background: var(--pg-bubble);
  border-radius: 20px 20px 6px 20px;
  padding: 0.6rem 0.95rem;
}



// The thread of reasoning and tool calls: indented beside a thin line, under which
// the answer follows at full width.
// The tool's argument after its name; Nuxt UI's `ms-1` is not among the utilities
// generated for the playground.
.pg-steps :deep([data-slot="suffix"]) {
  margin-inline-start: 0.35rem;
}

.pg-thread-head {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0.25rem 0;
  font-size: 0.9rem;
  color: var(--ui-text-muted);
  cursor: pointer;

  &:hover {
    color: var(--ui-text-highlighted);
  }
}

.pg-thread-chevron {
  width: 14px;
  height: 14px;
}

.pg-steps {
  display: grid;
  margin: 0.25rem 0 0.9rem 0.45rem;
  padding-left: 0.9rem;
  border-left: 2px solid var(--ui-border);
}

.pg-user-text {
  white-space: pre-wrap;
  margin: 0;
}

.pg-tool-body {
  margin: 0;
  padding: 0.6rem 0.8rem;
  max-height: 14rem;
  overflow: auto;
  font-size: 0.75rem;
  border-radius: 10px;
  background: var(--ui-bg-muted);
  color: var(--ui-text);
  font-family: var(--pg-mono);
  white-space: pre-wrap;
}

.pg-empty {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

// The prompt floats on the page: a rounded field with a soft lift, and a focus
// halo in the brand colour.
.pg-composer {
  padding: 0.5rem 1.5rem 1.1rem;
  max-width: 48rem;
  width: 100%;
  margin: 0 auto;
}

// Follow-up questions sit just above the prompt, left to right.
.pg-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
}

.pg-suggesting {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.6rem;
  font-size: 0.95rem;
  color: var(--ui-text-muted);
}

.pg-suggesting-icon {
  animation: pg-spin 0.9s linear infinite;
}

@keyframes pg-spin {
  to {
    transform: rotate(360deg);
  }
}

// Read at the chat's own size.
.pg-suggestion {
  max-width: 100%;
  border-radius: 999px;
  font-size: 1rem;
  padding: 0.45rem 0.95rem;
}

.pg-composer :deep([data-slot="root"]) {
  border-radius: 22px;
  background: var(--ui-bg);
  border: 1px solid var(--ui-border-accented);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 10px 30px -14px rgba(0, 0, 0, 0.2);
  transition:
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.pg-composer :deep([data-slot="root"]:focus-within) {
  border-color: color-mix(in srgb, var(--ui-primary) 55%, transparent);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 0 0 4px color-mix(in srgb, var(--ui-primary) 14%, transparent);
}

// Nuxt UI gives the textarea a `px-0` class, which Bulma also defines, with
// !important; the text then starts flush with the icon of the model menu below.
.pg-composer :deep(textarea) {
  font-size: 1rem;
  padding: 1.05rem 1.35rem 0.5rem;
  padding-left: 1.35rem !important;
  padding-right: 1.35rem !important;
}

.pg-composer-foot {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.85rem 0.75rem 0.95rem;
}

// The send button carries the brand glow the deploy page's primary action has.
.pg-composer :deep(.pg-send) {
  flex: none;
  margin-left: auto;
  box-shadow: 0 8px 24px -8px rgba(16, 232, 12, 0.6);
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease;
}

.pg-composer :deep(.pg-send:hover:not(:disabled)) {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px -8px rgba(16, 232, 12, 0.75);
}

.pg-error {
  margin: 0.5rem 0.4rem 0;
  font-size: 0.82rem;
  color: var(--ui-error);
}
</style>
