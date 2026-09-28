<template>
  <div class="box p-0">
    <div class="snippet-head px-4 pt-3">
      <div class="tabs is-small is-boxed mb-0">
        <ul>
          <li
            v-for="lang in languages"
            :key="lang.id"
            :class="{ 'is-active': active === lang.id }"
          >
            <a @click="active = lang.id">{{ lang.label }}</a>
          </li>
        </ul>
      </div>
      <button class="button is-small snippet-copy" @click="copy">
        <span class="icon is-small">
          <FontAwesomeIcon :icon="copied ? faCheck : faCopy" />
        </span>
        <span>{{ copied ? "Copied" : "Copy" }}</span>
      </button>
    </div>
    <pre class="snippet-body"><code class="hljs" v-html="highlighted"></code></pre>
  </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faCopy, faCheck } from "@fortawesome/free-solid-svg-icons";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import python from "highlight.js/lib/languages/python";
import javascript from "highlight.js/lib/languages/javascript";

// Only the three languages the snippets use; the full bundle registers ~190.
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("python", python);
hljs.registerLanguage("javascript", javascript);

const props = withDefaults(
  defineProps<{
    baseUrl: string;
    model: string;
    mode?: "chat" | "embeddings";
    maxTokens?: number;
  }>(),
  { mode: "chat", maxTokens: 512 },
);

const languages = [
  { id: "curl", label: "curl", grammar: "bash" },
  { id: "python", label: "Python", grammar: "python" },
  { id: "node", label: "Node", grammar: "javascript" },
];
const active = ref("curl");
const copied = ref(false);

const chat = computed(() => ({
  curl: `curl ${props.baseUrl}/v1/chat/completions \\
  -H "Authorization: Bearer $NOSANA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${props.model}",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": ${props.maxTokens}
  }'`,
  python: `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["NOSANA_API_KEY"],
    base_url="${props.baseUrl}/v1",
)

completion = client.chat.completions.create(
    model="${props.model}",
    messages=[{"role": "user", "content": "Hello!"}],
    max_tokens=${props.maxTokens},
)
print(completion.choices[0].message.content)`,
  node: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.NOSANA_API_KEY,
  baseURL: "${props.baseUrl}/v1",
});

const completion = await client.chat.completions.create({
  model: "${props.model}",
  messages: [{ role: "user", content: "Hello!" }],
  max_tokens: ${props.maxTokens},
});
console.log(completion.choices[0].message.content);`,
}));

const embeddings = computed(() => ({
  curl: `curl ${props.baseUrl}/v1/embeddings \\
  -H "Authorization: Bearer $NOSANA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${props.model}",
    "input": "The quick brown fox"
  }'`,
  python: `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["NOSANA_API_KEY"],
    base_url="${props.baseUrl}/v1",
)

response = client.embeddings.create(
    model="${props.model}",
    input=["The quick brown fox"],
)
print(response.data[0].embedding[:8])`,
  node: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.NOSANA_API_KEY,
  baseURL: "${props.baseUrl}/v1",
});

const response = await client.embeddings.create({
  model: "${props.model}",
  input: ["The quick brown fox"],
});
console.log(response.data[0].embedding.slice(0, 8));`,
}));

const current = computed(
  () =>
    (props.mode === "embeddings" ? embeddings.value : chat.value)[
      active.value as "curl" | "python" | "node"
    ],
);

const highlighted = computed(() => {
  const grammar =
    languages.find((lang) => lang.id === active.value)?.grammar ?? "bash";
  return hljs.highlight(current.value, { language: grammar }).value;
});

const copy = async () => {
  await navigator.clipboard.writeText(current.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1600);
};
</script>

<style scoped lang="scss">
.snippet-head {
  position: relative;
}

.snippet-copy {
  position: absolute;
  right: 1rem;
  top: 0.65rem;
}

/* Bulma gives `pre` its own background and padding; the box behind it provides
   both, and the theme pads the code element. */
.snippet-body {
  margin: 0;
  padding: 0;
  background: transparent;
  font-size: 0.78rem;
  line-height: 1.5;
}
</style>
