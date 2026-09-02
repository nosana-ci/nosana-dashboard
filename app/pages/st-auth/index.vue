<template>
  <section class="hero is-fullheight oauth-page">
    <div class="hero-body is-justify-content-center">
      <div class="box has-text-centered oauth-card">
        <!-- Loading challenge / redirecting -->
        <div
          v-if="status === 'loading' || status === 'working'"
          class="is-flex is-flex-direction-column is-align-items-center"
        >
          <Loader />
          <p class="mt-3 has-text-grey">
            {{ status === 'working' ? 'Redirecting…' : 'Loading…' }}
          </p>
        </div>

        <!-- Error -->
        <div
          v-else-if="status === 'error'"
          class="is-flex is-flex-direction-column is-align-items-center"
        >
          <p class="has-text-danger has-text-weight-medium mb-4">{{ error }}</p>
          <NuxtLink to="/" class="button is-primary">Back to home</NuxtLink>
        </div>

        <!-- Consent -->
        <div v-else-if="status === 'consent' && info">
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

          <h1 class="title is-5 has-text-weight-normal mb-2">
            <strong>{{ info.clientName || 'An application' }}</strong> wants to access your Nosana account
          </h1>

          <p v-if="email" class="subtitle is-6 has-text-grey mb-4">Signed in as {{ email }}</p>

          <div class="notification is-light oauth-scope">
            This will let <strong>{{ info.clientName || 'this app' }}</strong> access and manage your
            Nosana account on your behalf — including deployments, jobs, and credits.
          </div>

          <div
            v-if="info.clientUri || info.policyUri || info.tosUri"
            class="is-flex is-justify-content-center mb-5 oauth-links"
          >
            <a v-if="info.clientUri" class="has-text-link" :href="info.clientUri" target="_blank" rel="noopener noreferrer">Website</a>
            <a v-if="info.tosUri" class="has-text-link" :href="info.tosUri" target="_blank" rel="noopener noreferrer">Terms</a>
            <a v-if="info.policyUri" class="has-text-link" :href="info.policyUri" target="_blank" rel="noopener noreferrer">Privacy</a>
          </div>

          <div class="columns is-mobile">
            <div class="column">
              <button class="button is-fullwidth" @click="cancel">Cancel</button>
            </div>
            <div class="column">
              <button class="button is-primary is-fullwidth" @click="authorize">Authorize</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
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
  background: #f9f9f9;
}

.oauth-card {
  width: 100%;
  max-width: 420px;
}

.oauth-links {
  gap: 1rem;
  font-size: 0.85rem;
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

.dark-mode {
  .oauth-page {
    background: #121212;
  }

  .box.oauth-card {
    background: #1c1c1c;
    border-color: #2a2a2a;
  }

  .notification.oauth-scope {
    background: #242424;
    color: #bbb;
  }
}
</style>
