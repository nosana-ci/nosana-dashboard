<template>
  <section class="hero is-fullheight oauth-page">
    <div class="hero-body is-justify-content-center">
      <div class="box has-text-centered oauth-card">
        <div
          v-if="!error"
          class="is-flex is-flex-direction-column is-align-items-center"
        >
          <Loader />
          <p class="mt-3 has-text-grey">Signing you in…</p>
        </div>
        <div
          v-else
          class="is-flex is-flex-direction-column is-align-items-center"
        >
          <p class="has-text-danger has-text-weight-medium mb-4">{{ error }}</p>
          <NuxtLink to="/" class="button is-primary">Back to home</NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import Session from "supertokens-web-js/recipe/session";
import Loader from "~/components/Loader.vue";

// SuperTokens redirects here (`{websiteBasePath}/try-refresh`) mid OAuth flow when a
// session exists but its access token needs refreshing. We refresh, then hand off to
// the consent page (`/st-auth`), which shows the authorize card and continues.
definePageMeta({ layout: false });

const route = useRoute();
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const loginChallenge = (route.query.loginChallenge ?? route.query.login_challenge) as
      | string
      | undefined;

    if (!loginChallenge) {
      await navigateTo("/");
      return;
    }

    // Best-effort refresh; the consent page re-checks the session either way.
    try {
      await Session.attemptRefreshingSession();
    } catch {
      // No refreshable session — the consent page will route to login.
    }

    await navigateTo({ path: "/st-auth", query: { loginChallenge } });
  } catch (err: unknown) {
    console.error("OAuth try-refresh error:", err);
    error.value = "Something went wrong during authorization.";
  }
});
</script>

<style lang="scss" scoped>
.oauth-page {
  background: #f9f9f9;
}

.oauth-card {
  width: 100%;
  max-width: 420px;
}

.dark-mode {
  .oauth-page {
    background: #121212;
  }

  .box.oauth-card {
    background: #1c1c1c;
    border-color: #2a2a2a;
  }
}
</style>
