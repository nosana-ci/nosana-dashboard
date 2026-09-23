<template>
  <div class="chat" :class="`is-${status}`">
    <div class="chat-bar">
      <div class="chat-model">
        <StatusMark
          :tone="TONES[status]"
          :pulse="status === 'ready'"
          :label="LABELS[status]"
        />
        <span class="chat-model-name" :title="model">{{
          model || "Model"
        }}</span>
        <span class="chat-via">via {{ opId }} :{{ port }}</span>
      </div>
      <div class="chat-acts">
        <button
          type="button"
          class="button is-small is-quiet"
          :class="{ 'is-on': tray === 'settings' }"
          :aria-pressed="tray === 'settings'"
          title="System prompt and sampling"
          @click="toggleTray('settings')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
          </svg>
          <span>Settings</span>
        </button>
        <button
          type="button"
          class="button is-small is-quiet"
          :class="{ 'is-on': tray === 'code' }"
          :aria-pressed="tray === 'code'"
          title="Call this model from your own code"
          @click="toggleTray('code')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m16 18 6-6-6-6M8 6l-6 6 6 6" />
          </svg>
          <span>Code</span>
        </button>
        <button
          type="button"
          class="button is-small is-quiet"
          :disabled="messages.length === 0"
          title="Clear the conversation and its saved history"
          @click="clear"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
          <span>Clear</span>
        </button>
      </div>
    </div>

    <div v-if="tray === 'settings'" class="chat-tray chat-settings">
      <label class="chat-field chat-field-wide">
        <span>System prompt</span>
        <textarea
          v-model="settings.systemPrompt"
          class="textarea"
          rows="3"
          placeholder="Optional. Sent before every conversation."
        ></textarea>
      </label>
      <div class="chat-field-col">
        <label class="chat-field">
          <span
            >Temperature
            <b class="mono">{{ settings.temperature.toFixed(1) }}</b></span
          >
          <input
            v-model.number="settings.temperature"
            type="range"
            min="0"
            max="2"
            step="0.1"
          />
        </label>
        <label class="chat-field">
          <span>Max tokens</span>
          <input
            v-model.number="settings.maxTokens"
            class="input is-small"
            type="number"
            min="1"
          />
        </label>
        <label class="chat-field">
          <span>API key</span>
          <input
            v-model.lazy="keyModel"
            class="input is-small"
            type="password"
            autocomplete="off"
            placeholder="Only if the server asks for one"
          />
        </label>
      </div>
    </div>

    <div v-if="tray === 'code'" class="chat-tray">
      <div class="chat-code-head">
        <div class="chat-langs" role="tablist" aria-label="Language">
          <button
            v-for="(label, key) in LANGS"
            :key="key"
            type="button"
            role="tab"
            :aria-selected="lang === key"
            :class="{ 'is-active': lang === key }"
            @click="lang = key"
          >
            {{ label }}
          </button>
        </div>
        <button type="button" class="button is-small is-quiet" @click="copyCode">
          Copy
        </button>
      </div>
      <pre class="chat-code"><code v-html="highlight(snippet)"></code></pre>
      <p class="chat-note">
        {{ COPY[scope].code }}
        <template v-if="usesKey">
          Set <span class="mono">VLLM_API_KEY</span> to your key first.
        </template>
      </p>
    </div>

    <div v-if="status === 'starting'" class="chat-banner is-warn">
      <StatusMark tone="warn" :size="12" />
      <p>
        <strong>Model is loading.</strong> Chat opens once
        <span class="mono">{{ opId }} :{{ port }}</span> is online.
      </p>
      <button
        v-if="scope === 'job'"
        type="button"
        class="button is-small is-quiet"
        @click="emit('viewLogs')"
      >
        View logs
      </button>
    </div>
    <form
      v-else-if="status === 'auth'"
      class="chat-banner is-warn chat-key"
      @submit.prevent="submitKey"
    >
      <StatusMark tone="warn" :size="12" />
      <p>
        <strong>{{
          apiKey
            ? "The endpoint rejected this API key."
            : "This model needs an API key."
        }}</strong>
        It stays in this browser tab and isn't saved with the conversation.
      </p>
      <input
        v-model="keyDraft"
        class="input is-small"
        type="password"
        autocomplete="off"
        placeholder="API key"
        aria-label="API key"
      />
      <button
        type="submit"
        class="button is-small is-quiet"
        :disabled="!keyDraft.trim()"
      >
        Use key
      </button>
    </form>
    <div v-else-if="status === 'error'" class="chat-banner is-danger">
      <StatusMark tone="danger" :size="12" />
      <p>{{ error }}</p>
      <button type="button" class="button is-small is-quiet" @click="emit('retry')">
        Retry
      </button>
    </div>
    <div v-else-if="status === 'ended'" class="chat-banner">
      <StatusMark tone="neutral" :size="12" />
      <p>{{ COPY[scope].ended }}</p>
    </div>

    <div ref="scroller" class="chat-msgs" aria-live="polite" @scroll="onScroll">
      <div
        v-if="messages.length === 0 && status === 'ready'"
        class="chat-empty"
      >
        <p>Send a message to test the model on this {{ scope }}.</p>
        <div class="chat-suggest">
          <button
            v-for="text in SUGGESTIONS"
            :key="text"
            type="button"
            @click="send(text)"
          >
            {{ text }}
          </button>
        </div>
      </div>

      <template v-for="message in messages" :key="message.id">
        <div v-if="message.role === 'user'" class="chat-user">
          {{ message.content }}
        </div>
        <div v-else class="chat-ai">
          <details
            v-if="view(message).reasoning"
            class="chat-reason"
            :open="view(message).thinking || undefined"
          >
            <summary>
              <template v-if="view(message).thinking">Thinking…</template>
              <template v-else
                >Reasoning<template v-if="message.stats?.reasoning">
                  · {{ message.stats.reasoning.toFixed(1) }}s</template
                ></template
              >
            </summary>
            <div class="chat-reason-body">{{ view(message).reasoning }}</div>
          </details>
          <div
            v-if="view(message).answer"
            class="chat-text content"
            :class="{ 'is-streaming': message.streaming }"
            v-html="renderMarkdown(view(message).answer)"
          ></div>
          <p
            v-else-if="message.streaming && !view(message).reasoning"
            class="chat-wait"
          >
            Waiting for the first token…
          </p>
          <p v-if="message.error" class="chat-error">{{ message.error }}</p>
          <div v-if="message.stats" class="chat-stats">
            <span v-if="message.stats.stopped">Stopped</span>
            <span v-if="message.stats.ttft !== undefined"
              >TTFT {{ message.stats.ttft.toFixed(2) }}s</span
            >
            <span v-if="message.stats.tps">
              {{ message.stats.tps.toFixed(1) }} tok/s</span
            >
            <span v-if="message.stats.tokens"
              >{{ message.stats.tokens }} tokens</span
            >
          </div>
        </div>
      </template>
    </div>

    <form class="chat-composer" @submit.prevent="busy ? stop() : send()">
      <div class="chat-box">
        <textarea
          ref="input"
          v-model="draft"
          rows="1"
          aria-label="Message"
          :placeholder="PLACEHOLDERS[status]"
          :disabled="status !== 'ready'"
          @keydown.enter.exact.prevent="send()"
          @input="resize"
        ></textarea>
        <button
          type="submit"
          class="chat-send"
          :disabled="status !== 'ready' || (!busy && !draft.trim())"
          :aria-label="busy ? 'Stop' : 'Send'"
          :title="busy ? 'Stop' : 'Send'"
        >
          <svg v-if="busy" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
          </svg>
          <svg
            v-else
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
      <p v-if="status === 'ready'" class="chat-note">
        Enter to send, Shift+Enter for a new line. Messages go from your browser
        straight to this {{ scope }}.
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { Marked } from "marked";
import DOMPurify from "dompurify";
import { useToast } from "vue-toastification";
import StatusMark from "~/components/Common/StatusMark.vue";
import { escapeHtml } from "~/utils/htmlSanitization";
import type { StatusTone } from "~/composables/useStatus";
import type { LlmChatStatus } from "~/composables/jobs/useLlmEndpoint";
import {
  ChatRequestError,
  chatHistoryKey,
  splitReasoning,
  streamChat,
  trimHistory,
  type ChatTurn,
} from "~/utils/llmChat";

const props = defineProps<{
  /** Which URL this talks to: one job's own, or the deployment's. */
  scope: "job" | "deployment";
  /** Keeps the settings apart per job or deployment. */
  sessionKey: string;
  url: string;
  model: string;
  /** Headers to send: the health check's, plus the reader's API key. */
  headers: Record<string, string>;
  /** The key the reader entered, if any (v-model). */
  apiKey: string;
  opId: string;
  port: number;
  status: LlmChatStatus;
  error: string;
}>();
const emit = defineEmits<{
  viewLogs: [];
  retry: [];
  /** The first message was sent. */
  started: [];
  "update:apiKey": [key: string];
}>();

const TONES: Record<LlmChatStatus, StatusTone> = {
  ready: "live",
  starting: "warn",
  auth: "warn",
  error: "danger",
  ended: "neutral",
};
const LABELS: Record<LlmChatStatus, string> = {
  ready: "Online",
  starting: "Loading",
  auth: "Needs API key",
  error: "Unreachable",
  ended: "Stopped",
};
const PLACEHOLDERS: Record<LlmChatStatus, string> = {
  ready: "Message the model…",
  starting: "Waiting for the model to come online…",
  auth: "Enter the API key to chat",
  error: "The endpoint can't be reached",
  ended: "Not running",
};
const SUGGESTIONS = [
  "Say hello and tell me which model you are",
  "Write a haiku about idle GPUs",
  "Explain the KV cache in two sentences",
];
const LANGS = { curl: "curl", python: "Python", js: "JavaScript" } as const;
const COPY = {
  job: {
    code: "This calls this replica directly. For production traffic, use the deployment's endpoint.",
    ended:
      "This job has stopped. Your conversation is saved in this browser, but you can't send new messages.",
  },
  deployment: {
    code: "This calls the deployment's endpoint, the URL to use from your own app.",
    ended: "This deployment isn't running. Start it to chat with the model.",
  },
} as const;

// Roughly 6k tokens of history; the newest turns are kept.
const HISTORY_CHARS = 24_000;

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  /** Reasoning the server sent in its own field rather than inline. */
  reasoning: string;
  streaming?: boolean;
  error?: string;
  stats?: {
    ttft?: number;
    tps?: number;
    tokens?: number;
    /** Seconds spent reasoning before the answer began. */
    reasoning?: number;
    stopped?: boolean;
  };
};

// Kept in this browser per job or deployment, so it survives closing the
// panel and reloading the page. Clear deletes it.
const MAX_MESSAGES = 200;
const messages = useLocalStorage<Message[]>(
  chatHistoryKey(props.sessionKey),
  [],
);
// A reply cut off by a reload is finished as stopped.
for (const message of messages.value) {
  if (message.streaming) {
    message.streaming = false;
    message.stats = { ...message.stats, stopped: true };
  }
}
const draft = ref("");
const busy = ref(false);
let controller: AbortController | null = null;
let nextId = messages.value.reduce((next, m) => Math.max(next, m.id + 1), 0);

// Per job or deployment, for this browser session.
const settings = useSessionStorage(`nosana-chat:${props.sessionKey}`, {
  systemPrompt: "",
  temperature: 0.7,
  maxTokens: 1024,
});

const view = (message: Message) => {
  const parts = splitReasoning(message.content);
  return {
    answer: parts.answer,
    reasoning: [message.reasoning.trim(), parts.reasoning]
      .filter(Boolean)
      .join("\n\n"),
    thinking: !!message.streaming && !parts.answer,
  };
};

const markdown = new Marked({ gfm: true, breaks: true });
const renderMarkdown = (text: string) =>
  DOMPurify.sanitize(
    (markdown.parse(text, { async: false }) as string).replace(
      /<a /g,
      '<a target="_blank" rel="noopener noreferrer" ',
    ),
    { ADD_ATTR: ["target"] },
  );

// Follow the reply as it streams, unless the reader scrolled up to read.
const scroller = ref<HTMLElement | null>(null);
let pinned = true;
const onScroll = () => {
  const el = scroller.value;
  if (el) pinned = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
};
const follow = () =>
  nextTick(() => {
    const el = scroller.value;
    if (el && pinned) el.scrollTop = el.scrollHeight;
  });

const input = ref<HTMLTextAreaElement | null>(null);
const resize = () => {
  const el = input.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
};

const toTurn = (message: Message): ChatTurn => ({
  role: message.role,
  // Reasoning is not sent back: models are trained to see only answers.
  content:
    message.role === "assistant"
      ? splitReasoning(message.content).answer
      : message.content,
});

async function send(text?: string) {
  const prompt = (text ?? draft.value).trim();
  if (!prompt || busy.value || props.status !== "ready") return;

  if (messages.value.length === 0) emit("started");
  draft.value = "";
  nextTick(resize);
  const history = trimHistory(
    [
      ...messages.value.filter((m) => !m.error && m.content).map(toTurn),
      { role: "user", content: prompt },
    ],
    HISTORY_CHARS,
  );
  // Oldest first, to stay well inside the browser's storage quota.
  const overflow = messages.value.length + 2 - MAX_MESSAGES;
  if (overflow > 0) messages.value.splice(0, overflow);
  messages.value.push({ id: nextId++, role: "user", content: prompt, reasoning: "" });
  messages.value.push({
    id: nextId++,
    role: "assistant",
    content: "",
    reasoning: "",
    streaming: true,
  });
  const reply = messages.value[messages.value.length - 1]!;
  pinned = true;
  follow();

  busy.value = true;
  controller = new AbortController();
  const started = performance.now();
  let firstToken = 0;
  let firstAnswer = 0;
  let tokens = 0;
  const system = settings.value.systemPrompt.trim();

  try {
    await streamChat(
      props.url,
      {
        model: props.model,
        messages: system
          ? [{ role: "system", content: system }, ...history]
          : history,
        temperature: settings.value.temperature,
        max_tokens: settings.value.maxTokens,
      },
      (delta) => {
        if (!firstToken && (delta.content || delta.reasoning)) {
          firstToken = performance.now();
        }
        reply.content += delta.content;
        reply.reasoning += delta.reasoning;
        if (!firstAnswer && delta.content && view(reply).answer) {
          firstAnswer = performance.now();
        }
        if (delta.usage) tokens = delta.usage.completionTokens;
        follow();
      },
      controller.signal,
      props.headers,
    );
  } catch (error) {
    if (!controller.signal.aborted) {
      reply.error =
        error instanceof ChatRequestError
          ? error.message
          : "The reply stopped unexpectedly.";
      // The key was refused mid-conversation: check again, which asks for one.
      if (
        error instanceof ChatRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        emit("retry");
      }
    }
  } finally {
    const ended = performance.now();
    const seconds = (ended - firstToken) / 1000;
    reply.streaming = false;
    reply.stats = {
      stopped: controller?.signal.aborted,
      ttft: firstToken ? (firstToken - started) / 1000 : undefined,
      reasoning:
        firstToken && view(reply).reasoning
          ? ((firstAnswer || ended) - firstToken) / 1000
          : undefined,
      tokens: tokens || undefined,
      tps: tokens && firstToken && seconds > 0 ? tokens / seconds : undefined,
    };
    busy.value = false;
    controller = null;
    follow();
    nextTick(() => input.value?.focus());
  }
}

const stop = () => controller?.abort();

const clear = () => {
  stop();
  messages.value = [];
};

onBeforeUnmount(stop);

// The key box in the banner, and the one in Settings (applied on change, so
// each keystroke isn't a new request to the server).
const keyDraft = ref("");
const submitKey = () => {
  emit("update:apiKey", keyDraft.value.trim());
  keyDraft.value = "";
};
const keyModel = computed({
  get: () => props.apiKey,
  set: (key: string) => emit("update:apiKey", key.trim()),
});

const tray = ref<"settings" | "code" | null>(null);
const toggleTray = (name: "settings" | "code") => {
  tray.value = tray.value === name ? null : name;
};

const lang = ref<keyof typeof LANGS>("curl");
const usesKey = computed(() =>
  Object.keys(props.headers).some((name) => name.toLowerCase() === "authorization"),
);
const snippet = computed(() => {
  const base = props.url.replace(/\/+$/, "");
  const { systemPrompt, temperature, maxTokens } = settings.value;
  const turns: ChatTurn[] = [
    ...(systemPrompt.trim()
      ? [{ role: "system" as const, content: systemPrompt.trim() }]
      : []),
    { role: "user", content: "Hello!" },
  ];
  const json = JSON.stringify(
    { model: props.model, temperature, max_tokens: maxTokens, messages: turns },
    null,
    2,
  );
  const list = (indent: string) =>
    turns
      .map((t) => `${indent}{"role": "${t.role}", "content": ${JSON.stringify(t.content)}},`)
      .join("\n");

  // The key itself is never printed; the snippet reads it from the
  // environment instead.
  const extra = Object.entries(props.headers).filter(
    ([name]) => !["content-type", "authorization"].includes(name.toLowerCase()),
  );
  const auth = usesKey.value;
  const headerArg = (open: string, close: string) =>
    extra.length
      ? `,\n  ${open}${JSON.stringify(Object.fromEntries(extra))}${close}`
      : "";

  if (lang.value === "curl") {
    const lines =
      (auth ? `  -H "Authorization: Bearer $VLLM_API_KEY" \\\n` : "") +
      extra
        .map(([name, value]) => `  -H ${JSON.stringify(`${name}: ${value}`)} \\\n`)
        .join("");
    return `curl ${base}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
${lines}  -d '${json.replace(/'/g, "'\\''")}'`;
  }
  if (lang.value === "python") {
    return `${auth ? "import os\n" : ""}from openai import OpenAI

client = OpenAI(base_url="${base}/v1", api_key=${auth ? 'os.environ["VLLM_API_KEY"]' : '"unused"'}${headerArg("default_headers=", "")})
reply = client.chat.completions.create(
    model=${JSON.stringify(props.model)},
    temperature=${temperature},
    max_tokens=${maxTokens},
    messages=[
${list("        ")}
    ],
)
print(reply.choices[0].message.content)`;
  }
  return `import OpenAI from "openai";

const client = new OpenAI({ baseURL: "${base}/v1", apiKey: ${auth ? "process.env.VLLM_API_KEY" : '"unused"'}${headerArg("defaultHeaders: ", "")} });
const reply = await client.chat.completions.create({
  model: ${JSON.stringify(props.model)},
  temperature: ${temperature},
  max_tokens: ${maxTokens},
  messages: [
${list("    ")}
  ],
});
console.log(reply.choices[0].message.content);`;
});

// Keywords green, strings amber, as in the terminal-style blocks elsewhere.
const KEYWORDS = /("(?:[^"\\\n]|\\.)*")|\b(curl|from|import|const|new|await|print)\b/g;
const highlight = (code: string) => {
  let html = "";
  let last = 0;
  for (const match of code.matchAll(KEYWORDS)) {
    html += escapeHtml(code.slice(last, match.index));
    html += `<span class="${match[1] ? "tok-s" : "tok-k"}">${escapeHtml(match[0])}</span>`;
    last = match.index + match[0].length;
  }
  return html + escapeHtml(code.slice(last));
};

const toast = useToast();
const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(snippet.value);
    toast.success("Copied code");
  } catch {
    toast.error("Copy blocked by the browser");
  }
};
</script>

<style lang="scss" scoped>
// Small secondary text. The shared muted grey sits near 4:1 on white, too
// faint at these sizes, so light mode uses the darker grey; dark mode goes
// back to the shared value below.
$chat-muted: $grey-dark;

.chat {
  @include soft-panel;
  // Set here, not inherited: the page around it doesn't always follow the
  // theme (the job panel does, the deployment page doesn't).
  color: $text;
  display: flex;
  flex-direction: column;
  // Down to the panel's bottom padding, below its header and tabs.
  height: calc(100vh - 190px);
  min-height: 420px;
}

/* ---- Model bar ---- */
.chat-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 12px 10px 16px;
  border-bottom: 1px solid $border-soft;
}

.chat-model {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1;
  min-width: 0;
}

.chat-model-name {
  font-family: $family-monospace;
  font-weight: 600;
  font-size: 0.95rem;
  color: $text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-via {
  font-size: 0.8rem;
  color: $chat-muted;
  white-space: nowrap;
}

.chat-acts {
  display: flex;
  gap: 4px;

  .button {
    gap: 6px;

    svg {
      width: 14px;
      height: 14px;
    }
  }

  .button.is-on {
    background: $surface-sunken;
  }
}

/* ---- Trays ---- */
.chat-tray {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  background: $surface-sunken;
  border-bottom: 1px solid $border-soft;
}

.chat-settings {
  grid-template-columns: 1fr 200px;
  gap: 14px;
}

.chat-key .input {
  flex: 1 1 180px;
  max-width: 260px;
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
  color: $chat-muted;

  b {
    color: $text;
    font-weight: 600;
  }

  .textarea {
    font-size: 0.86rem;
    min-height: 0;
    resize: vertical;
  }

  input[type="range"] {
    accent-color: $secondary;
  }
}

.chat-code-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.chat-langs {
  display: flex;
  gap: 4px;

  button {
    border: 0;
    background: none;
    padding: 3px 10px;
    border-radius: 7px;
    font: inherit;
    font-size: 0.82rem;
    color: $chat-muted;
    cursor: pointer;

    &.is-active {
      background: $white;
      color: $text;
      box-shadow: 0 0 0 1px $border-soft;
    }
  }
}

.chat-code {
  margin: 0;
  padding: 12px 14px;
  border-radius: 10px;
  background: #0f1012;
  color: #e7e9ec;
  font-size: 0.8rem;
  line-height: 1.5;
  max-height: 260px;
  overflow: auto;

  :deep(.tok-k) {
    color: $secondary;
  }

  :deep(.tok-s) {
    color: #ffd479;
  }
}

.chat-note {
  font-size: 0.78rem;
  color: $chat-muted;
}

/* ---- Banners ---- */
.chat-banner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 14px;
  margin: 14px 16px 0;
  padding: 11px 14px;
  border-radius: 10px;
  font-size: 0.86rem;
  background: $surface-sunken;

  p {
    flex: 1;
    min-width: 200px;
  }

  strong {
    font-weight: 600;
    color: inherit;
  }

  &.is-warn {
    background: rgba($warning, 0.14);
  }

  &.is-danger {
    background: rgba($danger, 0.1);
  }
}

/* ---- Messages ---- */
.chat-msgs {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 18px 8px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.is-starting .chat-msgs,
.is-ended .chat-msgs,
.is-error .chat-msgs {
  opacity: 0.75;
}

.chat-empty {
  margin: auto 0 0;
  display: grid;
  gap: 10px;
  color: $chat-muted;
  font-size: 0.9rem;
}

.chat-suggest {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  button {
    border: 1px solid $border-soft;
    background: $white;
    color: $text;
    border-radius: 999px;
    padding: 5px 12px;
    font: inherit;
    font-size: 0.82rem;
    cursor: pointer;

    &:hover {
      background: $surface-hover;
    }
  }
}

.chat-user {
  align-self: flex-end;
  max-width: 78%;
  padding: 9px 14px;
  border-radius: 14px 14px 4px 14px;
  background: $surface-track;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.chat-ai {
  display: grid;
  gap: 8px;
  max-width: 92%;
}

.chat-text {
  overflow-wrap: anywhere;

  // A caret after the last word while the reply streams in.
  &.is-streaming > :deep(:last-child)::after {
    content: "▍";
    margin-left: 1px;
    color: $secondary;
    animation: chat-caret 1s steps(2) infinite;
  }

  :deep(pre) {
    font-size: 0.82rem;
    border-radius: 8px;
  }
}

.chat-reason {
  font-size: 0.86rem;
  color: $chat-muted;

  summary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px 2px 4px;
    border-radius: 7px;
    cursor: pointer;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }

    &::before {
      content: "›";
      font-size: 1.1em;
      line-height: 1;
      transition: transform 0.15s ease;
    }

    &:hover {
      background: $surface-hover;
    }
  }

  &[open] summary::before {
    transform: rotate(90deg);
  }
}

.chat-reason-body {
  margin-top: 6px;
  padding: 6px 12px;
  border-left: 2px solid $surface-track;
  white-space: pre-wrap;
}

@keyframes chat-caret {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-text.is-streaming > :deep(:last-child)::after {
    animation: none;
  }
}

.chat-wait {
  color: $chat-muted;
  font-size: 0.86rem;
}

.chat-error {
  color: $danger;
  font-size: 0.86rem;
}

.chat-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-family: $family-monospace;
  font-size: 0.8rem;
  color: $chat-muted;
  font-variant-numeric: tabular-nums;
}

/* ---- Composer ---- */
.chat-composer {
  display: grid;
  gap: 6px;
  padding: 10px 12px 12px;
}

.chat-box {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 6px 6px 6px 14px;
  border: 1px solid $border-soft;
  border-radius: 14px;
  background: $white;

  &:focus-within {
    border-color: $secondary;
    box-shadow: 0 0 0 3px rgba($secondary, 0.2);
  }

  textarea {
    flex: 1;
    border: 0;
    outline: 0;
    resize: none;
    background: transparent;
    font: inherit;
    color: $text;
    padding: 6px 0;
  }
}

.chat-send {
  flex: none;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 10px;
  background: $black;
  color: $white;
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.mono {
  font-family: $family-monospace;
}

html.dark-mode {
  .chat {
    color: $white;
  }

  // Bulma colours these from its own light theme, which the dark-mode class
  // doesn't switch.
  .chat-text {
    :deep(strong),
    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4) {
      color: inherit;
    }

    :deep(code) {
      background: rgba($white, 0.08);
      color: inherit;
    }

    :deep(pre) {
      background: rgba($white, 0.06);
      color: inherit;
    }
  }

  .chat-via,
  .chat-field,
  .chat-langs button,
  .chat-note,
  .chat-empty,
  .chat-reason,
  .chat-wait,
  .chat-stats {
    color: $text-muted;
  }

  .chat-bar,
  .chat-tray {
    border-color: rgba($white, 0.1);
  }

  .chat-model-name {
    color: $white;
  }

  .chat-tray,
  .chat-banner,
  .chat-user,
  .chat-acts .button.is-on {
    background: rgba($white, 0.06);
  }

  .chat-banner.is-warn {
    background: rgba($warning, 0.12);
  }

  .chat-banner.is-danger {
    background: rgba($danger, 0.14);
  }

  .chat-langs button.is-active {
    background: rgba($white, 0.1);
    color: $white;
    box-shadow: none;
  }

  .chat-suggest button,
  .chat-box {
    background: transparent;
    border-color: rgba($white, 0.14);
    color: $white;
  }

  .chat-box textarea,
  .chat-field b {
    color: $white;
  }

  .chat-send {
    background: $white;
    color: $black;
  }

  .chat-reason-body {
    border-left-color: rgba($white, 0.15);
  }

  .chat-reason summary:hover {
    background: rgba($white, 0.06);
  }
}

@include touch {
  .chat-settings {
    grid-template-columns: 1fr;
  }

  .chat-via,
  .chat-acts .button span {
    display: none;
  }
}
</style>
