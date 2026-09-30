<template>
  <section class="hero is-fullheight oauth-page">
    <div class="hero-body is-justify-content-center">
      <!-- Loading challenge / redirecting -->
      <div
        v-if="status === 'loading' || status === 'working'"
        class="box oauth-state is-flex is-flex-direction-column is-align-items-center"
      >
        <Loader />
        <p class="mt-3 has-text-grey">
          {{ status === 'working' ? 'Redirecting…' : 'Loading…' }}
        </p>
      </div>

      <!-- Error -->
      <div
        v-else-if="status === 'error'"
        class="box oauth-state is-flex is-flex-direction-column is-align-items-center"
      >
        <p class="has-text-danger has-text-weight-medium mb-4">{{ error }}</p>
        <NuxtLink to="/" class="button is-primary">Back to home</NuxtLink>
      </div>

      <!-- Consent: the same dialog shell as creating an API key. Bulma scopes the
           shell's spacing to `.modal`, so it sits in one, without a backdrop. -->
      <div v-else-if="status === 'consent' && info" class="modal is-active">
      <div class="modal-card is-app-modal oauth-card">
        <header class="modal-card-head">
          <div class="is-flex is-align-items-center is-gap-2 is-flex-grow-1">
            <img
              v-if="info.logoUri && !logoFailed"
              :src="info.logoUri"
              :alt="`${info.clientName} logo`"
              class="oauth-logo"
              @error="logoFailed = true"
            />
            <span v-else class="app-modal-icon oauth-logo-fallback" aria-hidden="true">
              {{ (info.clientName || '?').charAt(0).toUpperCase() }}
            </span>
            <div class="oauth-heading">
              <h1 class="modal-card-title title is-5 mb-0">
                {{ info.clientName || 'An application' }}
              </h1>
              <p class="has-text-grey is-size-7">
                {{ requestedScopes.length ? 'wants to access your Nosana account' : 'wants to verify your identity' }}
              </p>
            </div>
          </div>
        </header>

        <section class="modal-card-body">
          <!-- Exactly what is being granted. Anything absent here is not authorized, so
               this must never be padded out with a generic summary. -->
          <template v-if="requestedScopes.length">
            <label class="label">Access requested</label>
            <!-- The same one-choice-first control as creating an API key. The list
                 below stays visible at every level: it is what is being agreed to. -->
            <div class="seg-tabs is-fullwidth" role="group" aria-label="Access">
              <button
                v-for="option in accessOptions"
                :key="option.id"
                type="button"
                :class="{ 'is-active': access === option.id }"
                :aria-pressed="access === option.id"
                @click="setAccess(option.id)"
              >
                {{ option.label }}
              </button>
            </div>
            <p class="oauth-note my-3">
              <strong>{{ currentAccess.lead }}</strong>
              {{ info.clientName || 'This app' }} {{ currentAccess.detail }}
            </p>
            <ul class="oauth-scopes">
              <li v-for="item in requestedScopes" :key="item.scope">
                <ScopeCheck
                  :checked="selectedScopes.has(item.scope)"
                  :credits="spendsCredits(item.description)"
                  :readonly="access !== 'custom'"
                  @toggle="toggleScope(item.scope)"
                >
                  <span>{{ item.description }}</span>
                </ScopeCheck>
              </li>
            </ul>
            <p v-if="selectedScopes.size === 0" class="oauth-note mt-3">
              Nothing ticked: <strong>{{ info.clientName || 'this app' }}</strong> will only be able to confirm
              who you are, with no access to your deployments, jobs, credits or wallet.
            </p>
            <p v-else class="oauth-note is-size-7 mt-3">
              <FontAwesomeIcon v-if="canSpendCredits" :icon="faCoins" class="has-text-warning mr-1" />
              {{ canSpendCredits ? 'This app will be able to spend your credits.' : "This app can't spend your credits." }}
            </p>
          </template>

          <!-- No resource scopes: a sign-in-only grant, which authorizes no API access.
               Claiming account access here would be false. -->
          <p v-else class="oauth-note">
            This will let <strong>{{ info.clientName || 'this app' }}</strong> confirm who you are. It gets
            no access to your deployments, jobs, credits or wallet.
          </p>

          <div
            v-if="info.clientUri || info.policyUri || info.tosUri"
            class="is-flex mt-4 oauth-links"
          >
            <a v-if="info.clientUri" class="has-text-link" :href="info.clientUri" target="_blank" rel="noopener noreferrer">Website</a>
            <a v-if="info.tosUri" class="has-text-link" :href="info.tosUri" target="_blank" rel="noopener noreferrer">Terms</a>
            <a v-if="info.policyUri" class="has-text-link" :href="info.policyUri" target="_blank" rel="noopener noreferrer">Privacy</a>
          </div>
        </section>

        <footer class="modal-card-foot">
          <p class="has-text-grey is-size-7 modal-foot-summary">
            <template v-if="email">Signed in as {{ email }}</template>
          </p>
          <div class="buttons mb-0">
            <button class="button" @click="cancel">Cancel</button>
            <button class="button is-success" @click="authorize">Authorize</button>
          </div>
        </footer>
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
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { faCoins } from "@fortawesome/free-solid-svg-icons";
import Loader from "~/components/Loader.vue";
import ScopeCheck from "~/components/Account/ScopeCheck.vue";
import { useSuperTokens } from "~/composables/useSuperTokens";

// Authorization-server login + consent page for the client-manager OAuth 2.1
// provider (SuperTokens Unified Login). The provider redirects here with a
// `?loginChallenge` when a third-party app initiates "Login with Nosana"; once the
// user has a session and grants consent, we continue the flow so the provider
// issues the authorization code.
definePageMeta({ layout: false });

/** One permission the client is asking for, as `loginInfoGET` reports it. */
interface RequestedScope {
  scope: string;
  description: string;
}

interface ClientInfo {
  clientId: string;
  clientName: string;
  logoUri?: string;
  clientUri?: string;
  tosUri?: string;
  policyUri?: string;
  requestedScopes?: RequestedScope[];
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
const requestedScopes = computed<RequestedScope[]>(() => info.value?.requestedScopes ?? []);

// The resource scopes the user is granting. Everything requested starts ticked; the
// provider grants exactly this set (identity scopes always go through).
const selectedScopes = ref<Set<string>>(new Set());

type Access = "all" | "read" | "custom";

const ACCESS: { id: Access; label: string; lead: string; detail: string }[] = [
  {
    id: "all",
    label: "All requested",
    lead: "Everything it asked for.",
    detail: "can do all of the following on your behalf.",
  },
  {
    id: "read",
    label: "Read only",
    lead: "Look, don't touch.",
    detail: "can see the following but can't start or change anything.",
  },
  {
    id: "custom",
    label: "Custom",
    lead: "Pick exactly what to allow.",
    detail: "can do whatever you leave ticked.",
  },
];

const isRead = (scope: string) => scope.endsWith(":read");

// "Read only" is only a real choice when the request mixes reads with something else.
const accessOptions = computed(() => {
  const reads = requestedScopes.value.filter((item) => isRead(item.scope)).length;
  const mixed = reads > 0 && reads < requestedScopes.value.length;
  return ACCESS.filter((option) => option.id !== "read" || mixed);
});

const access = ref<Access>("all");
const currentAccess = computed(
  () => ACCESS.find((option) => option.id === access.value)!,
);

// Custom starts from whatever the previous choice held, so it can be trimmed.
function setAccess(level: Access) {
  access.value = level;
  if (level === "custom") return;
  selectedScopes.value = new Set(
    requestedScopes.value
      .map((item) => item.scope)
      .filter((scope) => level === "all" || isRead(scope)),
  );
}

function toggleScope(scope: string) {
  const next = new Set(selectedScopes.value);
  if (next.has(scope)) next.delete(scope);
  else next.add(scope);
  selectedScopes.value = next;
}

// The descriptions say so themselves; this only picks the icon.
const spendsCredits = (description: string) => /credits/i.test(description);

const canSpendCredits = computed(() =>
  requestedScopes.value.some(
    (item) => selectedScopes.value.has(item.scope) && spendsCredits(item.description),
  ),
);

function fail(message: string) {
  error.value = message;
  status.value = "error";
}

async function authorize() {
  if (!loginChallenge) return;
  status.value = "working";
  try {
    // `?scopes=` tells the provider which of the requested scopes were ticked. Sent only
    // when there was something to tick, so a sign-in-only request is unchanged.
    const scopes = [...selectedScopes.value].join(" ");
    const res = await getRedirectURLToContinueOAuthFlow({
      loginChallenge,
      ...(requestedScopes.value.length
        ? {
          options: {
            preAPIHook: async ({ url, requestInit }) => ({
              url: `${url}${url.includes("?") ? "&" : "?"}scopes=${encodeURIComponent(scopes)}`,
              requestInit,
            }),
          },
        }
        : {}),
    });
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
      selectedScopes.value = new Set((info.value.requestedScopes ?? []).map((item) => item.scope));
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

.oauth-state {
  width: 100%;
  max-width: 420px;
}

// Narrower than the app's dialog sizes: a consent screen is a short read.
.oauth-card {
  width: 520px;
}

.oauth-heading {
  min-width: 0;
}

.oauth-logo {
  flex: none;
  width: 42px;
  height: 42px;
  border-radius: 11px;
  object-fit: cover;
}

.oauth-logo-fallback {
  font-size: 1.25rem;
  font-weight: 700;
}

.oauth-note {
  color: $grey-dark;

  strong {
    color: $text;
  }
}

// One permission per row, in the same bordered list as the API key dialog.
.oauth-scopes {
  border: 1px solid $border;
  border-radius: 10px;
  padding: 0.4rem 0.45rem;

  // The whole row is the target, and a long description wraps beside its box.
  // !important because the component lays itself out with Bulma's helper classes.
  :deep(.scope-cell) {
    display: flex !important;
    align-items: flex-start !important;
    white-space: normal;
  }

  :deep(.scope-check) {
    margin-top: 0.15rem;
  }
}

.oauth-links {
  gap: 1rem;
  font-size: 0.85rem;
}

.dark-mode {
  .oauth-page {
    background: #121212;
  }

  .box.oauth-state {
    background: #1c1c1c;
    border-color: #2a2a2a;
  }

  .oauth-note {
    color: $text-muted;

    strong {
      color: $white;
    }
  }

  .oauth-scopes {
    border-color: rgba($white, 0.12);
  }
}
</style>
