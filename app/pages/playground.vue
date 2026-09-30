<template>
  <div>
    <TopBar
      :title="'Playground'"
      :subtitle="'Chat with models running on Nosana'"
      ref="topBar"
      v-model="showSettingsModal"
    />

    <div
      v-if="isAuthenticated"
      class="playground"
      :class="{ 'has-details': docked }"
    >
      <div class="playground-chat">
        <LlmPlayground
          :models="models"
          :loading="loadingModels"
          v-model="playgroundModel"
          :code-url="inferenceBase"
          :dock-to="docked ? DOCK : null"
        >
          <template v-if="isWide" #actions>
            <button
              type="button"
              class="button is-small is-quiet"
              :class="{ 'is-on': showDetails }"
              :aria-pressed="showDetails"
              :title="showDetails ? 'Hide model details and code' : 'Show model details and code'"
              aria-label="Model details and code"
              @click="showDetails = !showDetails"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M15 4v16" />
              </svg>
            </button>
          </template>
        </LlmPlayground>
      </div>

      <!-- v-show, not v-if: the chat docks its settings and code in here, so the
           panels have to exist before the chat looks for them. -->
      <aside v-show="docked" class="playground-side">
        <section v-if="selectedModel" class="section-card model-card">
          <h3 class="title is-5 mb-1">
            {{ modelName(selectedModel) }}
          </h3>
          <p class="model-id model-muted is-family-monospace is-size-7">
            {{ selectedModel.id }}
          </p>
          <!-- The catalog fills the description with the name, which says nothing new. -->
          <p
            v-if="selectedModel.description && selectedModel.description !== selectedModel.name"
            class="model-muted mt-2"
          >
            {{ selectedModel.description }}
          </p>
          <dl class="model-facts mt-3">
            <div
              v-for="fact in modelFacts"
              :key="fact.label"
              class="is-flex is-justify-content-space-between is-align-items-baseline is-gap-2 py-2"
            >
              <dt class="model-muted">{{ fact.label }}</dt>
              <dd class="is-family-monospace has-text-weight-semibold">
                {{ fact.value }}
              </dd>
            </div>
          </dl>
        </section>

        <section class="section-card settings-card">
          <h3 class="title is-6 mb-0">Settings</h3>
          <div id="playground-settings"></div>
        </section>

        <section id="playground-code" class="section-card playground-code"></section>
      </aside>
    </div>

    <div v-else class="box has-text-centered p-6 mb-6">
      <span class="icon is-large has-text-grey-light">
        <FontAwesomeIcon :icon="faComments" size="2x" />
      </span>
      <h5 class="title is-5 mt-2 mb-2">Sign in to use the playground</h5>
      <p class="subtitle is-6 has-text-grey">
        The playground is tied to a Nosana account. Log in with email or Google
        to chat with the models.
      </p>
      <nuxt-link to="/account" class="button is-dark">Go to account</nuxt-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";
import {
  pricePerMillion,
  formatUsd,
  formatTokenCount,
  modelName,
} from "~/composables/useLlmGateway";

const { isAuthenticated } = useSuperTokens();
const showSettingsModal = ref(false);
const route = useRoute();
const router = useRouter();

const { inferenceBase, models, loadingModels } = useLlmGateway();

const playgroundModel = ref((route.query.model as string) ?? "");

const selectedModel = computed(
  () => models.value.find((entry) => entry.id === playgroundModel.value) ?? null,
);

const modelFacts = computed(() => {
  const model = selectedModel.value;
  if (!model) return [];
  return [
    { label: "Context window", value: formatTokenCount(model.context_length) },
    { label: "Max output", value: formatTokenCount(model.max_output_tokens) },
    {
      label: "Input, per 1M tokens",
      value: formatUsd(pricePerMillion(model.pricing.prompt)),
    },
    {
      label: "Output, per 1M tokens",
      value: formatUsd(pricePerMillion(model.pricing.completion)),
    },
  ];
});

// With room for a side column, the chat's settings and code are docked there
// beside the model's details. Without it — a narrow window, or the column closed,
// a choice that is remembered — they are the trays under the chat's own bar, as
// on a deployment's chat.
const DOCK = { settings: "#playground-settings", code: "#playground-code" };
const isWide = useMediaQuery("(min-width: 1216px)");
const showDetails = useLocalStorage("playground-details", true);
const docked = computed(() => isWide.value && showDetails.value);

// Keep the model in the URL so a playground link can be shared.
watch(playgroundModel, (model) => {
  if (model) router.replace({ query: { ...route.query, model } });
});
</script>

<style scoped lang="scss">
// What the layout puts above and below the workspace: the top bar, the section's
// padding and the footer. Taking it off the viewport fits the page to the window.
$chrome: 190px;
$chrome-touch: 150px;

.playground {
  display: grid;
  gap: 1.25rem;
}

// On its own, the chat takes the window.
.playground-chat {
  height: calc(100dvh - #{$chrome-touch});
  min-height: 420px;
}

.playground-side {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
  min-height: 0;
  // On a short window the column scrolls rather than squeezing the code away.
  overflow-y: auto;
}

// The code takes what the cards above leave.
.playground-code {
  flex: 1 0 220px;
  display: flex;
  flex-direction: column;
}

.model-card {
  flex: none;
  padding: 1rem 1.15rem 0.35rem;

  .title {
    color: inherit;
  }
}

.settings-card {
  flex: none;
  display: grid;
  gap: 0.75rem;
  padding: 1rem 1.15rem 1.15rem;

  .title {
    color: inherit;
  }
}

.model-id {
  overflow-wrap: anywhere;
}

// The theme's muted text; Bulma's grey helper is too dim on the dark card.
.model-muted {
  color: $text-muted;
}

// Bulma's helpers lay the rows out; the hairline between them is the one thing
// it has no class for.
.model-facts div {
  border-top: 1px solid $border-soft;
}

html.dark-mode .model-facts div {
  border-top-color: rgba($white, 0.1);
}

// Side by side, both columns share the window's height.
// Keep the breakpoint in step with `isWide` above.
@include from($widescreen) {
  .playground {
    height: calc(100dvh - #{$chrome});
    min-height: 480px;
  }

  .playground.has-details {
    grid-template-columns: minmax(0, 1fr) 400px;
  }

  .playground-chat {
    height: auto;
    min-height: 0;
  }
}
</style>
