<template>
  <div class="pg-root">
    <div v-if="isAuthenticated" class="ask-nosa">
      <PlaygroundModelsChat variant="nosa" :models="models" :loading="loadingModels" />
    </div>

    <div v-else class="box has-text-centered p-6 mb-6">
      <span class="icon is-large has-text-grey-light">
        <FontAwesomeIcon :icon="faComments" size="2x" />
      </span>
      <h5 class="title is-5 mt-2 mb-2">Sign in to ask Nosa</h5>
      <p class="subtitle is-6 has-text-grey">
        Nosa works with your Nosana account. Log in with email or Google to chat with it.
      </p>
      <nuxt-link to="/account" class="button is-dark">Go to account</nuxt-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";

definePageMeta({ layout: "playground" });

const { isAuthenticated } = useSuperTokens();
const { models, loadingModels } = useLlmGateway();
</script>

<style scoped lang="scss">
// The layout hands the page the whole window.
.pg-root,
.ask-nosa {
  height: 100%;
  min-height: 0;
}

// Signed out: the card sits in the window's top band rather than stretching.
.box {
  margin: 1.5rem;
}
</style>
