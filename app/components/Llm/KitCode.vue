<template>
  <div class="box p-0 kit-code">
    <header class="kit-head">
      <h3 class="title is-6 mb-0">Nosana Kit</h3>
      <span class="kit-install is-family-monospace">npm install @nosana/kit</span>
    </header>
    <div class="kit-body">
      <pre><code v-html="highlighted"></code></pre>
      <CopyButton class="kit-copy" :text="snippet" label="Copy code" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import CopyButton from "~/components/Common/CopyButton.vue";
import { highlightSnippet } from "~/utils/highlightSnippet";

/** The same API key, used from code to manage deployments through the Kit. */
const config = useRuntimeConfig().public;
const network = computed(() => (config.network === "devnet" ? "DEVNET" : "MAINNET"));

const snippet = computed(() =>
  [
    'import { createNosanaClient, NosanaNetwork } from "@nosana/kit";',
    "",
    `const client = createNosanaClient(NosanaNetwork.${network.value}, {`,
    "  api: { apiKey: process.env.NOSANA_API_KEY },",
    "});",
    "",
    "// Your deployments and your credit balance.",
    "const { deployments } = await client.api.deployments.list();",
    "for (const deployment of deployments) {",
    "  console.log(deployment.name, deployment.status);",
    "}",
    "console.log(await client.api.credits.balance());",
  ].join("\n"),
);

// Coloured as the inference snippet beside it is, the key in green.
const highlighted = computed(() => highlightSnippet(snippet.value, ["NOSANA_API_KEY"]));
</script>

<style scoped lang="scss">
.kit-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
  // As tall as the inference card's header beside it, which its language tabs set.
  min-height: 51px;
  padding: 10px 12px 10px 16px;
  border-bottom: 1px solid $border-soft;

  .title {
    margin-right: auto;
    color: inherit;
  }
}

.kit-install {
  font-size: 0.78rem;
  color: $grey;
}

// Holds the copy button over the code's corner.
.kit-body {
  position: relative;

  pre {
    margin: 0;
    padding: 0;
    background: $surface-sunken;
    font-size: 0.78rem;
    line-height: 1.6;
    white-space: pre-wrap;
    color: $grey-darker;
  }

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

  :deep(.tok-k) {
    color: #5b64c9;
  }

  :deep(.tok-f) {
    color: #1a7f93;
  }

  :deep(.tok-c) {
    color: $grey-light;
  }
}

.kit-copy {
  position: absolute;
  top: 8px;
  right: 8px;
}

html.dark-mode {
  .kit-head {
    border-bottom-color: rgba($white, 0.1);
  }

  .kit-install {
    color: $text-muted;
  }

  .kit-body pre {
    background: rgba($black, 0.18);
    color: $text-muted;

    :deep(mark) {
      color: $secondary;
    }

    :deep(.tok-s) {
      color: $grey-lighter;
    }

    :deep(.tok-k) {
      color: #9aa7f0;
    }

    :deep(.tok-f) {
      color: #7fd7e6;
    }

    :deep(.tok-c) {
      color: $grey;
    }
  }
}
</style>
