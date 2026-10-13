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
import {
  getToolName,
  isToolUIPart,
  type ChatStatus,
  type DynamicToolUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";
import { getTextFromMessage } from "@nuxt/ui/utils/ai";
import { TOOL_CATALOG } from "~/utils/playgroundTools";

type AnyToolPart = ToolUIPart | DynamicToolUIPart;

const props = defineProps<{
  messages: UIMessage[];
  status: ChatStatus;
  error?: Error;
  placeholder?: string;
  disabled?: boolean;
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
