<template>
  <div class="pg-root">
    <div
      v-if="isAuthenticated && nosaEnabled"
      class="seg-tabs pg-tabs-row"
      role="group"
      aria-label="Playground"
    >
      <button
        v-for="option in TABS"
        :key="option.id"
        type="button"
        :class="{ 'is-active': tab === option.id }"
        :aria-pressed="tab === option.id"
        @click="tab = option.id"
      >
        {{ option.label }}
      </button>
    </div>

    <div v-if="isAuthenticated && tab === 'nosa'" class="playground">
      <div class="playground-chat">
        <NosaChat />
      </div>
    </div>

    <div v-else-if="isAuthenticated" class="playground">
      <PlaygroundModelsChat
        v-model="playgroundModel"
        :models="models"
        :loading="loadingModels"
        :code-url="inferenceBase"
      />
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

definePageMeta({ layout: "playground" });
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";

const { isAuthenticated } = useSuperTokens();
const route = useRoute();
const router = useRouter();

// Nosa only appears where the dashboard is configured with its URL.
const { enabled: nosaEnabled } = useNosa();

const { inferenceBase, models, loadingModels } = useLlmGateway();

const playgroundModel = ref((route.query.model as string) ?? "");

const TABS = [
  { id: "models", label: "Models" },
  { id: "nosa", label: "Nosa" },
] as const;
const tab = computed({
  get: () => (nosaEnabled && route.query.tab === "nosa" ? "nosa" : "models"),
  set: (value) => router.replace({ query: { ...route.query, tab: value === "nosa" ? "nosa" : undefined } }),
});

// Keep the model in the URL so a playground link can be shared.
watch(playgroundModel, (model) => {
  if (model) router.replace({ query: { ...route.query, model } });
});
</script>

<style scoped lang="scss">
// The layout hands the page the whole window. The root is a column: the Nosa
// switch, when there is one, takes its own height and the workspace the rest,
// whatever the window's size.
.pg-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.pg-tabs-row {
  flex: none;
  margin: 0.75rem 1rem 0;
}

.playground {
  flex: 1;
  min-height: 0;
}

.playground-chat {
  height: 100%;
}

// Signed out: the card sits in the window's top band rather than stretching.
.box {
  margin: 1.5rem;
}
</style>
