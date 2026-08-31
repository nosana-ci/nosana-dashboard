<template>
  <div class="oauth-page">
    <div class="oauth-card">
      <div v-if="!error" class="oauth-loading">
        <Loader />
        <p>Signing you in…</p>
      </div>
      <div v-else class="oauth-error">
        <p class="oauth-error-text">{{ error }}</p>
        <NuxtLink to="/" class="button is-primary">Back to home</NuxtLink>
      </div>
    </div>
  </div>
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
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: #f9f9f9;
}

.oauth-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  padding: 2rem 1.75rem;
  text-align: center;
}

.oauth-loading,
.oauth-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  p {
    color: #666;
  }
}

.oauth-error-text {
  color: #d32f2f;
  font-weight: 500;
}

.dark-mode {
  .oauth-page {
    background: #121212;
  }

  .oauth-card {
    background: #1c1c1c;
    border-color: #2a2a2a;
  }

  .oauth-loading p {
    color: #aaa;
  }
}
</style>
