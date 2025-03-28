<template>
  <div class="p-1 py-4 has-background-white-bis">
    <div>
      <p class="block">
        <a
          v-if="ipfsGateway && artifacts"
          class="button"
          :href="`${ipfsGateway}${String(artifacts).trim()}`"
        >
          Download artifacts
        </a>
      </p>
      <p class="block">
        Download with CLI:<br />
        <code>npx @nosana/cli download {{ artifacts }}</code>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSDK } from "~/composables/useSDK";

const { nosana } = useSDK();

const artifacts = ref(null);
const ipfsGateway = ref(nosana.value ? nosana.value.ipfs.config.gateway : null);
</script>
