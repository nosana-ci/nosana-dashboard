<template>
  <div class="pg-chat">
    <header class="pg-bar">
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
          icon: 'i-lucide-sparkles',
          variant: 'naked',
          actions: assistantActions,
        }"
        :user="{ variant: 'naked', side: 'right', actions: userActions }"
        :spacing-offset="140"
        class="pg-messages"
      >
        <template #content="{ message }">
          <template
            v-for="(part, i) in message.parts"
            :key="`${message.id}-${i}`"
          >
            <template v-if="part.type === 'text'">
              <PlaygroundMarkdown
                v-if="message.role === 'assistant'"
                :text="part.text"
                :streaming="streaming(part, message)"
              />
              <p v-else class="pg-user-text">{{ part.text }}</p>
            </template>
            <UChatReasoning
              v-else-if="part.type === 'reasoning'"
              :text="part.text"
              :streaming="streaming(part, message)"
              class="my-1"
            >
              <PlaygroundMarkdown
                :text="part.text"
                :streaming="streaming(part, message)"
              />
            </UChatReasoning>
            <!-- The sub-agent: asks first, then shows its steps as it works. -->
            <UChatTool
              v-else-if="isToolUIPart(part) && getToolName(part) === 'delegate'"
              :text="delegateLabel(part)"
              icon="i-lucide-bot"
              :loading="delegateBusy(part)"
              :default-open="true"
              :actions="delegateActions(part)"
              class="my-1"
            >
              <div class="pg-delegate">
                <template v-if="part.state === 'approval-requested' || !delegateAgents(part).length">
                  <p
                    v-for="(task, j) in delegateTasks(part)"
                    :key="j"
                    class="pg-delegate-task"
                  >
                    {{ task }}
                  </p>
                </template>
                <div
                  v-else
                  class="pg-agents"
                  :class="{ 'is-many': delegateAgents(part).length > 1 }"
                >
                  <article
                    v-for="agent in delegateAgents(part)"
                    :key="agent.name"
                    class="pg-agent"
                    :data-status="agent.status"
                  >
                    <header class="pg-agent-head">
                      <span class="pg-agent-mark"><UIcon name="i-lucide-bot" /></span>
                      <span class="pg-agent-name">{{ agent.name }}</span>
                      <span class="pg-agent-status">
                        <UIcon
                          v-if="agent.status !== 'done' && agent.status !== 'failed'"
                          name="i-lucide-loader-circle"
                          class="pg-agent-spin"
                        />
                        {{ agentStatus(agent) }}
                      </span>
                    </header>
                    <p class="pg-agent-task">{{ agent.task }}</p>
                    <ul v-if="agent.steps.length" class="pg-delegate-steps">
                      <li v-for="(step, j) in agent.steps" :key="j">
                        <UIcon
                          :name="step.state === 'done' ? 'i-lucide-check' : 'i-lucide-loader-circle'"
                          :class="['pg-delegate-step-icon', { 'is-running': step.state !== 'done' }]"
                        />
                        {{ step.label }}
                      </li>
                    </ul>
                    <PlaygroundMarkdown
                      v-if="agent.text"
                      :text="agent.text"
                      :streaming="agent.status === 'writing'"
                      class="pg-agent-text"
                    />
                    <p v-if="agent.error" class="pg-delegate-error">{{ agent.error }}</p>
                  </article>
                </div>
                <p v-if="part.state === 'output-error'" class="pg-delegate-error">
                  {{ part.errorText }}
                </p>
              </div>
            </UChatTool>
            <UChatTool
              v-else-if="isToolUIPart(part)"
              :text="toolLabel(part)"
              :suffix="toolSuffix(part)"
              :icon="toolIcon(part)"
              :loading="toolBusy(part)"
              :default-open="part.state === 'approval-requested'"
              :actions="approvalActions(part)"
              class="my-1"
            >
              <pre class="pg-tool-body">{{ toolBody(part) }}</pre>
            </UChatTool>
          </template>
          <p
            v-if="message.role === 'assistant' && statsOf(message)"
            class="pg-stats"
          >
            {{ statsOf(message) }}
          </p>
          <!-- While the reply comes in: how fast, live. -->
          <p
            v-else-if="live && message.id === messages.at(-1)?.id"
            class="pg-stats pg-live"
          >
            <UIcon name="i-lucide-zap" class="pg-live-icon" />
            {{ live }}
          </p>
        </template>
      </UChatMessages>
    </div>

    <div v-else class="pg-empty">
      <slot name="empty" />
    </div>

    <div class="pg-composer">
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
import { computed, nextTick, ref, watch } from "vue";
import { useNow } from "@vueuse/core";
import {
  getToolName,
  isToolUIPart,
  type ChatStatus,
  type DynamicToolUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";
import { getTextFromMessage } from "@nuxt/ui/utils/ai";
import type { ReplyStats } from "~/utils/modelTransport";
import {
  TOOL_CATALOG,
  type AgentProgress,
  type DelegateProgress,
} from "~/utils/playgroundTools";
import { usdToCredits } from "~/composables/useLlmGateway";

type AnyToolPart = ToolUIPart | DynamicToolUIPart;

const props = defineProps<{
  messages: UIMessage<ReplyStats>[];
  status: ChatStatus;
  error?: Error;
  placeholder?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  send: [text: string];
  stop: [];
  regenerate: [messageId?: string];
  /** Drop this message and everything after it; its text is back in the prompt. */
  rewind: [messageId: string];
  /** Read this reply aloud. */
  speak: [text: string];
  /** Copy the chat up to and including this message into a new one. */
  branch: [messageId: string];
  /** The reader's answer to a tool that asked first. */
  approve: [approvalId: string, approved: boolean];
  /** "/" alone in the prompt asks for the prompt palette. */
  slash: [];
}>();

// The page can fill the prompt too, from a saved prompt or an edited message.
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

watch(draft, (value) => {
  if (value === "/") {
    draft.value = "";
    emit("slash");
  }
});

// A live read on the reply as it streams: tokens are estimated from characters
// until the gateway reports the real count at the end.
const now = useNow({ interval: 250 });
const streamStart = ref(0);
watch(
  () => props.status,
  (status) => {
    if (status === "submitted") streamStart.value = Date.now();
  },
);
const live = computed(() => {
  if (props.status !== "streaming" || !streamStart.value) return null;
  const last = props.messages.at(-1);
  if (!last || last.role !== "assistant") return null;
  const chars = last.parts.reduce(
    (sum, part) =>
      sum + ("text" in part && typeof part.text === "string" ? part.text.length : 0),
    0,
  );
  const seconds = Math.max(0.25, (now.value.getTime() - streamStart.value) / 1000);
  const tokens = Math.round(chars / 4);
  if (!tokens) return "Thinking…";
  return `${Math.round(tokens / seconds)} tok/s · ~${tokens.toLocaleString()} tokens · ${seconds.toFixed(1)}s`;
});

function submit() {
  const text = draft.value.trim();
  if (!text) return;
  draft.value = "";
  emit("send", text);
}

function focusPrompt() {
  nextTick(() => {
    document.querySelector<HTMLTextAreaElement>(".pg-composer textarea")?.focus();
  });
}

const copy = (_: MouseEvent, message: UIMessage) => {
  navigator.clipboard.writeText(getTextFromMessage(message));
  toast.add({ title: "Copied", icon: "i-lucide-check", duration: 1500 });
};

const edit = (_: MouseEvent, message: UIMessage) => {
  draft.value = getTextFromMessage(message);
  emit("rewind", message.id);
  focusPrompt();
};

const branchFrom = (_: MouseEvent, message: UIMessage) =>
  emit("branch", message.id);

const userActions = [
  { label: "Edit", icon: "i-lucide-pencil", onClick: edit },
  { label: "Copy", icon: "i-lucide-copy", onClick: copy },
  { label: "Branch from here", icon: "i-lucide-git-branch", onClick: branchFrom },
];
const assistantActions = [
  { label: "Copy", icon: "i-lucide-copy", onClick: copy },
  {
    label: "Read aloud",
    icon: "i-lucide-volume-2",
    onClick: (_: MouseEvent, message: UIMessage) =>
      emit("speak", getTextFromMessage(message)),
  },
  {
    label: "Regenerate",
    icon: "i-lucide-refresh-cw",
    onClick: (_: MouseEvent, message: UIMessage) =>
      emit("regenerate", message.id),
  },
  { label: "Branch from here", icon: "i-lucide-git-branch", onClick: branchFrom },
];

// Tool calls, labelled by the catalog entry when they are one of ours.
const toolMeta = (part: AnyToolPart) =>
  TOOL_CATALOG.find((entry) => entry.id === getToolName(part));

const toolBusy = (part: AnyToolPart) =>
  part.state === "input-streaming" || part.state === "input-available";

function toolLabel(part: AnyToolPart): string {
  // An MCP tool's name reads as words rather than an identifier.
  const name = toolMeta(part)?.label ?? humanize(getToolName(part));
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

const toolIcon = (part: AnyToolPart) =>
  toolMeta(part)?.icon ?? (part.type === "dynamic-tool" ? "i-lucide-plug" : "i-lucide-wrench");

function toolBody(part: AnyToolPart): string {
  const value =
    part.state === "output-available"
      ? part.output
      : part.state === "output-error"
        ? part.errorText
        : part.input;
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

// The delegation's part: the tasks it was given and each agent's progress.
const delegateTasks = (part: AnyToolPart): string[] => {
  const input = part.input as { tasks?: string[]; task?: string } | undefined;
  return input?.tasks ?? (input?.task ? [input.task] : []);
};

const delegateProgress = (part: AnyToolPart): DelegateProgress | null =>
  part.state === "output-available"
    ? (part.output as DelegateProgress)
    : null;

const delegateAgents = (part: AnyToolPart): AgentProgress[] =>
  delegateProgress(part)?.agents ?? [];

const delegateBusy = (part: AnyToolPart) =>
  toolBusy(part) ||
  (part.state === "output-available" && part.preliminary === true);

const agentStatus = (agent: AgentProgress) =>
  ({
    thinking: "Thinking",
    tool: "Using a tool",
    writing: "Writing",
    done: "Done",
    failed: "Failed",
  })[agent.status];

function delegateLabel(part: AnyToolPart): string {
  switch (part.state) {
    case "approval-requested":
      return delegateTasks(part).length > 1
        ? `Wants to spin up ${delegateTasks(part).length} sub-agents`
        : "Wants to hand this to a sub-agent";
    case "approval-responded":
      return part.approval?.approved ? "Delegation approved" : "Delegation declined";
    case "output-denied":
      return "Delegation declined";
    case "output-error":
      return "Sub-agent failed";
    case "output-available": {
      const n = delegateAgents(part).length;
      const who = n > 1 ? `${n} sub-agents` : "Sub-agent";
      return part.preliminary ? `${who} working` : `${who} finished`;
    }
    default:
      return "Preparing a sub-agent";
  }
}

const delegateActions = approvalActions;

/** "1.2s to first token · 48 tok/s · 312 tokens · ≈ 0.4 credits", from what is known. */
function statsOf(message: UIMessage<ReplyStats>): string | null {
  const s = message.metadata;
  if (!s) return null;
  // Not while this reply is still coming in.
  if (props.status !== "ready" && message.id === props.messages.at(-1)?.id)
    return null;
  const parts: string[] = [];
  if (s.ttft !== undefined) parts.push(`${s.ttft.toFixed(1)}s to first token`);
  if (s.outputTokens && s.duration)
    parts.push(`${Math.round(s.outputTokens / s.duration)} tok/s`);
  if (s.outputTokens) parts.push(`${s.outputTokens} tokens`);
  if (s.costUsd !== undefined) parts.push(`≈ ${credits(s.costUsd)} credits`);
  if (s.finishReason === "length") parts.push("cut off at the token limit");
  return parts.length ? parts.join(" · ") : null;
}

function credits(usd: number): string {
  const value = usdToCredits(usd);
  if (value === 0) return "0";
  return value < 0.01 ? "<0.01" : value.toFixed(2);
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

.pg-messages {
  max-width: 54rem;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 0.75rem;
  font-size: 0.95rem;
}

// The reader's turn is a bubble; the model's is the page.
.pg-messages :deep([data-role="user"] [data-slot="content"]) {
  background: var(--pg-bubble);
  border-radius: 20px 20px 6px 20px;
  padding: 0.6rem 0.95rem;
}

.pg-messages :deep([data-role="assistant"] [data-slot="leading"]) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #34d399, #0a8a08);
  color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.pg-messages :deep([data-role="assistant"] [data-slot="leadingIcon"]) {
  width: 15px;
  height: 15px;
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
  white-space: pre-wrap;
}

.pg-delegate {
  display: grid;
  gap: 0.6rem;
  padding: 0.35rem 0;
  font-size: 0.85rem;
}

.pg-delegate-task {
  margin: 0;
  padding: 0.55rem 0.75rem;
  border-left: 2px solid var(--ui-primary);
  background: var(--ui-bg-muted);
  border-radius: 0 8px 8px 0;
  color: var(--ui-text);
}

.pg-delegate-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: var(--ui-text-muted);

  li {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }
}

.pg-delegate-step-icon {
  width: 14px;
  height: 14px;
  color: var(--ui-primary);

  &.is-running {
    animation: pg-spin 1s linear infinite;
  }
}

@keyframes pg-spin {
  to {
    transform: rotate(360deg);
  }
}

// One card per agent, side by side when there are several.
.pg-agents {
  display: grid;
  gap: 0.6rem;

  &.is-many {
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  }
}

.pg-agent {
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  background: var(--ui-bg-elevated);
  transition: border-color 0.2s ease;

  &[data-status="done"] {
    border-color: rgba(16, 232, 12, 0.35);
  }

  &[data-status="failed"] {
    border-color: color-mix(in srgb, var(--ui-error) 50%, transparent);
  }
}

.pg-agent-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pg-agent-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--pg-green) 0%, #0aa908 100%);
  color: #05230a;
  font-size: 0.9rem;
}

.pg-agent-name {
  font-family: var(--pg-title);
  font-weight: 600;
  color: var(--ui-text-highlighted);
}

.pg-agent-status {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--ui-bg-accented);
  font-family: var(--pg-mono);
  font-size: 0.64rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ui-text-muted);

  [data-status="done"] & {
    color: var(--ui-primary);
    background: var(--pg-chip-bg);
  }
}

.pg-agent-spin {
  width: 11px;
  height: 11px;
  animation: pg-spin 1s linear infinite;
}

.pg-agent-task {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.4;
  color: var(--ui-text-muted);
}

.pg-agent-text {
  padding-top: 0.4rem;
  border-top: 1px solid var(--ui-border-muted);
  font-size: 0.82rem;
}

.pg-delegate-error {
  margin: 0;
  color: var(--ui-error);
}

.pg-stats {
  margin: 0.6rem 0 0;
  font-family: var(--pg-mono);
  font-size: 0.68rem;
  letter-spacing: 0.01em;
  color: var(--ui-text-dimmed);
}

.pg-live {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--ui-primary);
}

.pg-live-icon {
  width: 12px;
  height: 12px;
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
  max-width: 54rem;
  width: 100%;
  margin: 0 auto;
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
  font-size: 0.95rem;
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

.pg-tool-body {
  font-family: var(--pg-mono);
}

.pg-error {
  margin: 0.5rem 0.4rem 0;
  font-size: 0.82rem;
  color: var(--ui-error);
}
</style>
