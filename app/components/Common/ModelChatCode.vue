<template>
  <div class="snippet">
    <header class="snippet-head">
      <h3 class="title is-6 mb-0">Use it in code</h3>
      <div class="seg-tabs" role="group" aria-label="Language">
        <button
          v-for="lang in languages"
          :key="lang.id"
          type="button"
          :class="{ 'is-active': active === lang.id }"
          :aria-pressed="active === lang.id"
          @click="active = lang.id"
        >
          {{ lang.label }}
        </button>
      </div>
    </header>
    <div class="snippet-code">
      <pre class="snippet-body"><code v-html="highlighted"></code></pre>
      <CopyButton class="snippet-copy" :text="snippet.code" label="Copy code" />
    </div>
    <footer v-if="$slots.footer || note || keyEnv" class="snippet-foot">
      <slot name="footer">
        <p>
          {{ note }}
          <template v-if="keyEnv">
            Set <span class="is-family-monospace">{{ keyEnv }}</span> to your key first.
          </template>
        </p>
      </slot>
    </footer>
  </div>
</template>

<script setup lang="ts">
import CopyButton from "~/components/Common/CopyButton.vue";
import { escapeHtml } from "~/utils/htmlSanitization";
import type { ChatSettings } from "~/utils/llmChat";

/**
 * The call the chat is making, as code to copy: curl, Python and Node. ModelChat
 * shows it in the tray under its bar, or in a panel the page provides.
 */
const props = defineProps<{
  /** The endpoint's base URL; `/v1/chat/completions` is appended. */
  url: string;
  model: string;
  /** Headers the endpoint needs, beyond content type and the key. */
  headers?: Record<string, string>;
  /** The environment variable the snippet reads the key from; none when no key is sent. */
  keyEnv?: string | null;
  settings: ChatSettings;
  note?: string;
}>();

type Language = "curl" | "python" | "node";

const languages: { id: Language; label: string }[] = [
  { id: "curl", label: "curl" },
  { id: "python", label: "Python" },
  { id: "node", label: "Node" },
];
const active = ref<Language>("curl");

const USER_MESSAGE = "Hello!";

/** The code, plus the parts of it the reader has to supply, for highlighting. */
const snippet = computed(() => {
  const base = props.url.replace(/\/+$/, "");
  const model = props.model || "model-id";
  const { temperature, maxTokens } = props.settings;
  const system = props.settings.systemPrompt.trim();
  const key = props.keyEnv;
  const extra = Object.entries(props.headers ?? {}).filter(
    ([name]) => !["content-type", "authorization"].includes(name.toLowerCase()),
  );

  // The messages as each language writes them, one per line.
  const jsonTurn = (role: string, content: string) =>
    `{"role": "${role}", "content": ${JSON.stringify(content)}}`;
  const jsTurn = (role: string, content: string) =>
    `{ role: "${role}", content: ${JSON.stringify(content)} }`;
  const turns = (write: typeof jsonTurn, indent: string) =>
    [...(system ? [write("system", system)] : []), write("user", USER_MESSAGE)].join(
      `,\n${indent}`,
    );

  if (active.value === "curl") {
    const headerLines =
      (key ? `  -H "Authorization: Bearer $${key}" \\\n` : "") +
      extra
        .map(([name, value]) => `  -H ${JSON.stringify(`${name}: ${value}`)} \\\n`)
        .join("");
    const body = `{
    "model": ${JSON.stringify(model)},
    "temperature": ${temperature},
    "max_tokens": ${maxTokens},
    "messages": [
      ${turns(jsonTurn, "      ")}
    ]
  }`;
    return {
      code: `curl ${base}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
${headerLines}  -d '${body.replace(/'/g, "'\\''")}'`,
      endpoint: `${base}/v1/chat/completions`,
      message: jsonTurn("user", USER_MESSAGE),
      model,
    };
  }

  if (active.value === "python") {
    const headerArg = extra.length
      ? `\n    default_headers=${JSON.stringify(Object.fromEntries(extra))},`
      : "";
    return {
      code: `${key ? "import os\n" : ""}from openai import OpenAI

client = OpenAI(
    api_key=${key ? `os.environ["${key}"]` : '"unused"'},
    base_url="${base}/v1",${headerArg}
)

completion = client.chat.completions.create(
    model=${JSON.stringify(model)},
    temperature=${temperature},
    max_tokens=${maxTokens},
    messages=[
        ${turns(jsonTurn, "        ")},
    ],
)
print(completion.choices[0].message.content)`,
      endpoint: `${base}/v1`,
      message: jsonTurn("user", USER_MESSAGE),
      model,
    };
  }

  const headerArg = extra.length
    ? `\n  defaultHeaders: ${JSON.stringify(Object.fromEntries(extra))},`
    : "";
  return {
    code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: ${key ? `process.env.${key}` : '"unused"'},
  baseURL: "${base}/v1",${headerArg}
});

const completion = await client.chat.completions.create({
  model: ${JSON.stringify(model)},
  temperature: ${temperature},
  max_tokens: ${maxTokens},
  messages: [
    ${turns(jsTurn, "    ")},
  ],
});
console.log(completion.choices[0].message.content);`,
    endpoint: `${base}/v1`,
    message: jsTurn("user", USER_MESSAGE),
    model,
  };
});

// Green is kept for what the reader has to supply: the key, the endpoint, the
// model and the message. Around those, strings and numbers are a shade brighter
// than the rest, so the code reads as code without competing.
const highlighted = computed(() => {
  const { code, endpoint, message, model } = snippet.value;
  const values = [props.keyEnv, endpoint, model, message]
    .filter((value): value is string => !!value)
    .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  // Most of the values sit inside a string, so strings are painted a second time.
  const paint = (
    text: string,
    pattern: RegExp,
    wrap: (match: RegExpMatchArray) => string,
  ) => {
    let html = "";
    let last = 0;
    for (const match of text.matchAll(pattern)) {
      html += escapeHtml(text.slice(last, match.index)) + wrap(match);
      last = match.index + match[0].length;
    }
    return html + escapeHtml(text.slice(last));
  };
  const mark = (text: string) =>
    paint(text, new RegExp(values, "g"), (m) => `<mark>${escapeHtml(m[0])}</mark>`);

  return paint(
    code,
    new RegExp(`(${values})|("(?:[^"\\\\\\n]|\\\\.)*")|\\b\\d+(?:\\.\\d+)?\\b`, "g"),
    (m) => {
      if (m[1]) return mark(m[0]);
      if (m[2]) return `<span class="tok-s">${mark(m[0])}</span>`;
      return `<span class="tok-s">${m[0]}</span>`;
    },
  );
});
</script>

<style scoped lang="scss">
.snippet {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.snippet-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
  padding: 10px 12px 10px 16px;
  border-bottom: 1px solid $border-soft;

  .title {
    margin-right: auto;
    color: inherit;
    white-space: nowrap;
  }
}

// Holds the copy button over the code's corner while the code scrolls under it.
.snippet-code {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
}

.snippet-copy {
  position: absolute;
  top: 8px;
  right: 8px;
}

/* Bulma gives `pre` its own background and padding. Lines wrap rather than
   scroll sideways, since the column this sits in is narrow. */
.snippet-body {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  background: $surface-sunken;
  font-size: 0.78rem;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: $grey;

  // Bulma pads and tints `code`; the `pre` around it already has the surface.
  code {
    display: block;
    // Room on the right for the copy button.
    padding: 14px 44px 14px 16px;
    background: none;
    color: inherit;
    font-size: inherit;
  }

  :deep(mark) {
    background: none;
    color: $secondary-text;
  }

  :deep(.tok-s) {
    color: $grey-darker;
  }
}

.snippet-foot {
  padding: 10px 12px 10px 16px;
  border-top: 1px solid $border-soft;
  font-size: 0.82rem;
  color: $grey-dark;
}

html.dark-mode {
  .snippet-head,
  .snippet-foot {
    border-color: rgba($white, 0.1);
  }

  .snippet-foot {
    color: $text-muted;
  }

  .snippet-body {
    background: rgba($black, 0.18);
    color: $text-muted;

    :deep(mark) {
      color: $secondary;
    }

    :deep(.tok-s) {
      color: $grey-lighter;
    }
  }
}
</style>
