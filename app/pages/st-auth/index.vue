<template>
  <div class="oauth-page">
    <div class="oauth-card">
      <!-- Loading challenge / redirecting -->
      <div v-if="status === 'loading' || status === 'working'" class="oauth-loading">
        <Loader />
        <p>{{ status === 'working' ? 'Redirecting…' : 'Loading…' }}</p>
      </div>

      <!-- Error -->
      <div v-else-if="status === 'error'" class="oauth-error">
        <p class="oauth-error-text">{{ error }}</p>
        <NuxtLink to="/" class="button is-primary">Back to home</NuxtLink>
      </div>

      <!-- Consent -->
      <div v-else-if="status === 'consent' && info" class="oauth-consent">
        <img
          v-if="info.logoUri && !logoFailed"
          :src="info.logoUri"
          :alt="`${info.clientName} logo`"
          class="oauth-logo"
          @error="logoFailed = true"
        />
        <div v-else class="oauth-logo oauth-logo-fallback" aria-hidden="true">
          {{ (info.clientName || '?').charAt(0).toUpperCase() }}
        </div>

        <h1 class="oauth-title">
          <strong>{{ info.clientName || 'An application' }}</strong> wants to access your Nosana account
        </h1>

        <p v-if="email" class="oauth-subtitle">Signed in as {{ email }}</p>

        <p class="oauth-scope">
          This will let <strong>{{ info.clientName || 'this app' }}</strong> access and manage your
          Nosana account on your behalf — including deployments, jobs, and credits.
        </p>

        <div v-if="info.clientUri || info.policyUri || info.tosUri" class="oauth-links">
          <a v-if="info.clientUri" :href="info.clientUri" target="_blank" rel="noopener noreferrer">Website</a>
          <a v-if="info.tosUri" :href="info.tosUri" target="_blank" rel="noopener noreferrer">Terms</a>
          <a v-if="info.policyUri" :href="info.policyUri" target="_blank" rel="noopener noreferrer">Privacy</a>
        </div>

        <div class="oauth-actions">
          <button class="button" @click="cancel">Cancel</button>
          <button class="button is-primary" @click="authorize">Authorize</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Session from "supertokens-web-js/recipe/session";
import {
  getLoginChallengeInfo,
  getRedirectURLToContinueOAuthFlow,
} from "supertokens-web-js/recipe/oauth2provider";
import Loader from "~/components/Loader.vue";
import { useSuperTokens } from "~/composables/useSuperTokens";

// Authorization-server login + consent page for the client-manager OAuth 2.1
// provider (SuperTokens Unified Login). The provider redirects here with a
// `?loginChallenge` when a third-party app initiates "Login with Nosana"; once the
// user has a session and grants consent, we continue the flow so the provider
// issues the authorization code.
definePageMeta({ layout: false });

interface ClientInfo {
  clientId: string;
  clientName: string;
  logoUri?: string;
  clientUri?: string;
  tosUri?: string;
  policyUri?: string;
}

const route = useRoute();
const { userData, checkSession } = useSuperTokens();

const status = ref<"loading" | "consent" | "working" | "error">("loading");
const error = ref<string | null>(null);
const info = ref<ClientInfo | null>(null);
const logoFailed = ref(false);

const loginChallenge = (route.query.loginChallenge ?? route.query.login_challenge) as
  | string
  | undefined;

const email = computed(() => userData.value?.email ?? null);

function fail(message: string) {
  error.value = message;
  status.value = "error";
}

async function authorize() {
  if (!loginChallenge) return;
  status.value = "working";
  try {
    const res = await getRedirectURLToContinueOAuthFlow({ loginChallenge });
    if (res.status === "OK") {
      window.location.href = res.frontendRedirectTo;
      return;
    }
    fail("Could not continue sign in. Please try again.");
  } catch (err: unknown) {
    console.error("OAuth continue error:", err);
    const e = err as { isSuperTokensGeneralError?: boolean; message?: string };
    fail(e?.isSuperTokensGeneralError ? (e.message ?? "Authorization failed.") : "Something went wrong.");
  }
}

// Denying simply abandons the flow: the third-party app receives no code.
function cancel() {
  void navigateTo("/");
}

onMounted(async () => {
  try {
    // No challenge means this isn't an OAuth login (e.g. the post-logout fallback
    // lands here) — send the user to the normal app.
    if (!loginChallenge) {
      await navigateTo("/");
      return;
    }

    // Reuse the existing Nosana login. If there's no session, route through the
    // login page and return here once authenticated.
    const hasSession = await Session.doesSessionExist();
    if (!hasSession) {
      await navigateTo({ path: "/", query: { redirect: route.fullPath } });
      return;
    }

    // Make sure we have the user's profile (email) for the consent screen.
    if (!userData.value) {
      await checkSession();
    }

    const res = await getLoginChallengeInfo({ loginChallenge });
    if (res.status === "OK") {
      info.value = res.info as ClientInfo;
      status.value = "consent";
      return;
    }
    fail("Could not load the authorization request.");
  } catch (err: unknown) {
    console.error("OAuth login-info error:", err);
    const e = err as { isSuperTokensGeneralError?: boolean; message?: string };
    fail(e?.isSuperTokensGeneralError ? (e.message ?? "Authorization failed.") : "Something went wrong.");
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

.oauth-logo {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  object-fit: cover;
  margin: 0 auto 1rem;
  display: block;
  background: #f2f2f2;
}

.oauth-logo-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  font-weight: 700;
  color: #555;
}

.oauth-title {
  font-size: 1.15rem;
  font-weight: 400;
  line-height: 1.4;
  margin: 0 0 0.5rem;
}

.oauth-subtitle {
  color: #888;
  font-size: 0.9rem;
  margin: 0 0 1.25rem;
}

.oauth-scope {
  color: #555;
  font-size: 0.9rem;
  line-height: 1.5;
  background: #f6f6f6;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  margin: 0 0 1.25rem;
}

.oauth-links {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1.5rem;
  font-size: 0.85rem;

  a {
    color: #4a7cff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.oauth-actions {
  display: flex;
  gap: 0.75rem;

  .button {
    flex: 1;
  }
}

.dark-mode {
  .oauth-page {
    background: #121212;
  }

  .oauth-card {
    background: #1c1c1c;
    border-color: #2a2a2a;
  }

  .oauth-title {
    color: #eee;
  }

  .oauth-scope {
    background: #242424;
    color: #bbb;
  }

  .oauth-loading p {
    color: #aaa;
  }
}
</style>
