<template>
  <div class="oauth-redirect">
    <div class="oauth-redirect-card">
      <Loader v-if="!error" />
      <p v-if="!error">Connecting to Nosana…</p>
      <div v-else class="oauth-redirect-error">
        <p class="oauth-redirect-error-text">{{ error }}</p>
        <NuxtLink to="/" class="button is-primary">Back to home</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Loader from "~/components/Loader.vue";

// Public entry point for third-party "Connect with Nosana" links:
//   https://deploy.nosana.com/oauth?client_id=…[&redirect_uri=…&state=…&code_challenge=…]
// It builds the real OAuth 2.1 authorize request and forwards the browser to it, so
// integrators only ever share a single client_id link. The authorization server
// validates redirect_uri against the app's registered URIs, so an unregistered one is
// rejected there.
definePageMeta({ layout: false });

const route = useRoute();
const config = useRuntimeConfig().public;
const error = ref<string | null>(null);

onMounted(async () => {
  const clientId = route.query.client_id as string | undefined;
  if (!clientId) {
    error.value = "Missing client_id.";
    return;
  }

  const params = new URLSearchParams();
  params.set("client_id", clientId);
  params.set("response_type", "code");
  params.set("scope", (route.query.scope as string) || "openid offline_access");

  // Optional pass-throughs. redirect_uri, when given, must match one registered for
  // the client (enforced by the authorization server).
  const passthrough = ["redirect_uri", "state", "code_challenge", "code_challenge_method"] as const;
  for (const key of passthrough) {
    const value = route.query[key];
    if (typeof value === "string" && value) params.set(key, value);
  }

  window.location.replace(`${config.apiBase}/auth/oauth/auth?${params.toString()}`);
});
</script>

<style lang="scss" scoped>
.oauth-redirect {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
}

.oauth-redirect-card {
  text-align: center;

  p {
    margin-top: 1rem;
    color: #666;
  }
}

.oauth-redirect-error-text {
  color: #d32f2f;
  font-weight: 500;
  margin-bottom: 1rem;
}

.dark-mode {
  .oauth-redirect {
    background: #121212;
  }
  .oauth-redirect-card p {
    color: #aaa;
  }
}
</style>
