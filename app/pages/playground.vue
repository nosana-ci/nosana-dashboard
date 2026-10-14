<template>
  <div>
    <TopBar :title="'Playground'" :subtitle="'Chat with models running on Nosana'" />

    <div v-if="isAuthenticated" class="playground">
      <PlaygroundModelsChat
        v-model="playgroundModel"
        :models="models"
        :loading="loadingModels"
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
import { useLocalStorage } from "@vueuse/core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faComments } from "@fortawesome/free-solid-svg-icons";

const { isAuthenticated } = useSuperTokens();
const { models, loadingModels } = useLlmGateway();

// The chosen model is remembered in this browser.
const playgroundModel = useLocalStorage("playground-model", "");
</script>

<style scoped lang="scss">
// What the layout puts above and below the playground: the top bar, the section's
// padding and the footer. Taking it off the viewport fits the playground to the window.
.playground {
  height: calc(100dvh - 190px);
  min-height: 480px;
}
</style>
