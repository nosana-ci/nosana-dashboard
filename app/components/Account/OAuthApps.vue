<template>
  <div class="oauth-apps-section">
    <div class="section-header">
      <div class="section-heading">
        <h2>Nosana Connected Apps</h2>
        <p>
          Let other apps add <strong>“Connect with Nosana”</strong>. Each app
          gets an OAuth client that can act on a user’s behalf after they sign
          in and approve it.
        </p>
      </div>
      <div class="oauth-create">
        <button
          class="button is-dark"
          :disabled="!isAuthenticated || atLimit"
          @click="openCreate"
        >
          <FontAwesomeIcon :icon="faPlus" />&nbsp;Create app
        </button>
        <p v-if="atLimit" class="oauth-limit-hint">
          Limit of {{ appsData.limit }} apps reached.
        </p>
      </div>
    </div>

    <div v-if="loadingApps && !hasLoadedOnce" class="oauth-empty">Loading…</div>
    <div v-else-if="!appsData.apps.length" class="oauth-empty">
      No connected apps yet. Create one to get a client ID.
    </div>

    <div v-else class="oauth-list">
      <div v-for="app in appsData.apps" :key="app.clientId" class="oauth-card">
        <div class="oauth-card-head">
          <img
            v-if="app.logoUri"
            :src="app.logoUri"
            :alt="`${app.name} logo`"
            class="oauth-app-logo"
          />
          <div class="oauth-app-title">
            <div class="oauth-app-name">{{ app.name }}</div>
            <span
              class="tag"
              :class="app.confidential ? 'is-info' : 'is-light'"
            >
              {{ app.confidential ? "Confidential" : "Public · PKCE" }}
            </span>
          </div>
          <button
            class="button is-small is-danger is-light"
            :class="{ 'is-loading': deletingId === app.clientId }"
            @click="removeApp(app)"
          >
            <FontAwesomeIcon :icon="faTrash" />
          </button>
        </div>

        <div class="oauth-field">
          <label>Client ID</label>
          <div class="oauth-copy-row">
            <code>{{ app.clientId }}</code>
            <button class="button is-small" @click="copy(app.clientId)">
              <FontAwesomeIcon :icon="faCopy" />
            </button>
          </div>
        </div>

        <div class="oauth-field">
          <label>Redirect URIs</label>
          <code v-for="uri in app.redirectUris" :key="uri" class="oauth-uri">{{
            uri
          }}</code>
        </div>

        <div class="oauth-field">
          <label>Connect link</label>
          <div class="oauth-copy-row">
            <code>{{ connectUrl(app) }}</code>
            <button class="button is-small" @click="copy(connectUrl(app))">
              <FontAwesomeIcon :icon="faCopy" />
            </button>
          </div>
          <p class="oauth-hint">
            Point the app’s “Connect with Nosana” button here.
            <template v-if="!app.confidential"
              >Public apps append their PKCE
              <code>code_challenge</code>.</template
            >
          </p>
        </div>
      </div>
    </div>

    <!-- Create modal -->
    <div v-if="showCreate" class="modal is-active">
      <div class="modal-background" @click="showCreate = false" />
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Create Nosana Connected App</p>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">App name</label>
            <input
              v-model="form.name"
              class="input"
              placeholder="AnotherApp"
              maxlength="100"
            />
          </div>
          <div class="field">
            <label class="label">Redirect URIs</label>
            <div
              v-for="(uri, i) in form.redirectUris"
              :key="i"
              class="oauth-uri-row"
            >
              <input
                v-model="form.redirectUris[i]"
                class="input"
                placeholder="https://anotherapp.com/auth/nosana/callback"
              />
              <button
                v-if="form.redirectUris.length > 1"
                type="button"
                class="button oauth-uri-remove"
                title="Remove"
                @click="removeUri(i)"
              >
                <FontAwesomeIcon :icon="faTrash" />
              </button>
            </div>
            <button
              type="button"
              class="button is-small is-light oauth-add-uri"
              @click="addUri"
            >
              <FontAwesomeIcon :icon="faPlus" />&nbsp;Add another
            </button>
          </div>
          <div class="field">
            <label class="label"
              >Logo URL <span class="oauth-optional">(optional)</span></label
            >
            <input
              v-model="form.logoUri"
              class="input"
              placeholder="https://anotherapp.com/logo.png"
            />
          </div>
          <div class="field oauth-toggle-field">
            <label class="oauth-switch">
              <input v-model="form.confidential" type="checkbox" />
              <span class="oauth-slider" />
            </label>
            <span class="oauth-toggle-text">
              Server-side app
              <span
                class="oauth-info has-tooltip-arrow has-tooltip-multiline has-tooltip-top"
                data-tooltip="Gets a client secret and skips PKCE — use for apps with a backend that can keep a secret. Leave off for browser or mobile apps."
              >
                <FontAwesomeIcon :icon="faInfoCircle" />
              </span>
            </span>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button
            class="button is-dark"
            :class="{ 'is-loading': creating }"
            :disabled="!canCreate"
            @click="createApp"
          >
            Create app
          </button>
          <button class="button" @click="showCreate = false">Cancel</button>
        </footer>
      </div>
    </div>

    <!-- Created modal (client_id + one-time secret) -->
    <div v-if="created" class="modal is-active">
      <div class="modal-background" @click="created = null" />
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">App created</p>
        </header>
        <section class="modal-card-body">
          <div class="oauth-field">
            <label>Client ID</label>
            <div class="oauth-copy-row">
              <code>{{ created.clientId }}</code>
              <button class="button is-small" @click="copy(created.clientId)">
                <FontAwesomeIcon :icon="faCopy" />
              </button>
            </div>
          </div>
          <div v-if="created.clientSecret" class="oauth-field">
            <label>Client secret</label>
            <div class="oauth-copy-row">
              <code>{{ created.clientSecret }}</code>
              <button
                class="button is-small"
                @click="copy(created.clientSecret)"
              >
                <FontAwesomeIcon :icon="faCopy" />
              </button>
            </div>
            <p class="help oauth-warn">
              <FontAwesomeIcon :icon="faExclamationTriangle" />&nbsp;Copy this
              now — it won’t be shown again.
            </p>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-dark" @click="created = null">Done</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from "vue-toastification";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  faPlus,
  faTrash,
  faCopy,
  faExclamationTriangle,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

interface OAuthApp {
  clientId: string;
  name: string;
  redirectUris: string[];
  logoUri?: string;
  confidential: boolean;
  clientSecret?: string;
}

const config = useRuntimeConfig().public;
const { isAuthenticated } = useSuperTokens();
const toast = useToast();

const hasLoadedOnce = ref(false);
const showCreate = ref(false);
const creating = ref(false);
const created = ref<OAuthApp | null>(null);
const deletingId = ref<string | null>(null);
const form = ref({
  name: "",
  redirectUris: [""] as string[],
  logoUri: "",
  confidential: false,
});

const {
  data: appsData,
  pending: loadingApps,
  refresh,
} = useMyAsyncData(
  "oauth-apps",
  async () => {
    if (!isAuthenticated.value)
      return { apps: [] as OAuthApp[], total: 0, limit: 3 };
    return await $fetch<{ apps: OAuthApp[]; total: number; limit: number }>(
      `${config.apiBase}/oauth-apps`,
      { credentials: "include" },
    );
  },
  {
    default: () => ({ apps: [] as OAuthApp[], total: 0, limit: 999 }),
    watch: [isAuthenticated],
  },
);

const atLimit = computed(() => appsData.value.total >= appsData.value.limit);

watch(
  loadingApps,
  (pending) => {
    if (!pending) hasLoadedOnce.value = true;
  },
  { immediate: true },
);

const canCreate = computed(
  () => !!form.value.name.trim() && cleanUris().length > 0 && !creating.value,
);

function cleanUris(): string[] {
  return form.value.redirectUris.map((s) => s.trim()).filter(Boolean);
}

function addUri() {
  form.value.redirectUris.push("");
}

function removeUri(index: number) {
  form.value.redirectUris.splice(index, 1);
}

function openCreate() {
  form.value = {
    name: "",
    redirectUris: [""],
    logoUri: "",
    confidential: false,
  };
  showCreate.value = true;
}

async function createApp() {
  if (!canCreate.value || !isAuthenticated.value) return;
  try {
    creating.value = true;
    const body: Record<string, unknown> = {
      name: form.value.name.trim(),
      redirectUris: cleanUris(),
      confidential: form.value.confidential,
    };
    if (form.value.logoUri.trim()) body.logoUri = form.value.logoUri.trim();

    const response = await $fetch<OAuthApp>(`${config.apiBase}/oauth-apps`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body,
    });

    showCreate.value = false;
    created.value = response;
    toast.success("OAuth app created");
    await refresh();
  } catch (error: unknown) {
    const e = error as { data?: { message?: string } };
    toast.error(e.data?.message || "Failed to create OAuth app");
  } finally {
    creating.value = false;
  }
}

async function removeApp(app: OAuthApp) {
  if (
    !confirm(
      `Delete “${app.name}”? Any integration using it will stop working. This cannot be undone.`,
    )
  )
    return;
  if (!isAuthenticated.value) return;
  try {
    deletingId.value = app.clientId;
    await $fetch(`${config.apiBase}/oauth-apps/${app.clientId}/delete`, {
      method: "POST",
      credentials: "include",
    });
    toast.success("OAuth app deleted");
    await refresh();
  } catch (error: unknown) {
    const e = error as { data?: { message?: string } };
    toast.error(e.data?.message || "Failed to delete OAuth app");
  } finally {
    deletingId.value = null;
  }
}

// The public "Connect with Nosana" entry point. The /oauth page builds the real
// authorize request, so integrators only ever share this single client_id link.
function connectUrl(app: OAuthApp): string {
  const origin = import.meta.client ? window.location.origin : "";
  return `${origin}/oauth?client_id=${app.clientId}`;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  } catch {
    toast.error("Could not copy");
  }
}
</script>

<style lang="scss" scoped>
.oauth-apps-section {
  margin-top: 2.5rem;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;

  h2 {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .section-heading p {
    color: #666;
    font-size: 0.9rem;
    margin-top: 0.25rem;
    max-width: 42rem;
  }
}

.oauth-empty {
  color: #888;
  font-size: 0.9rem;
  padding: 1rem 0;
  text-align: center;
}

.oauth-create {
  text-align: right;
  flex-shrink: 0;
}

.oauth-limit-hint {
  color: #b7791f;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.oauth-list {
  display: grid;
  gap: 1rem;
}

.oauth-card {
  border: 1px solid #ececec;
  border-radius: 12px;
  padding: 1rem 1.25rem;
}

.oauth-card-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;

  .oauth-app-title {
    flex: 1;
  }

  .oauth-app-name {
    font-weight: 600;
  }
}

.oauth-app-logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
}

.oauth-field {
  margin-bottom: 0.6rem;

  label {
    display: block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #999;
    margin-bottom: 0.2rem;
  }
}

.oauth-copy-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  code {
    flex: 1;
    overflow-x: auto;
    white-space: nowrap;
    padding: 0.35rem 0.5rem;
    background: #f6f6f6;
    border-radius: 6px;
    font-size: 0.8rem;
  }
}

.oauth-uri {
  display: block;
  padding: 0.35rem 0.5rem;
  background: #f6f6f6;
  border-radius: 6px;
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
  overflow-x: auto;
  white-space: nowrap;
}

.oauth-hint {
  color: #999;
  font-size: 0.75rem;
  margin-top: 0.3rem;

  code {
    background: #f0f0f0;
    padding: 0.05rem 0.25rem;
    border-radius: 4px;
    font-size: 0.72rem;
  }
}

.oauth-optional {
  color: #aaa;
  font-weight: 400;
}

.oauth-warn {
  color: #b7791f;
}

.modal-card {
  width: 92%;
  max-width: 600px;
}

.oauth-uri-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;

  .input {
    flex: 1;
  }
}

.oauth-add-uri {
  margin-top: 0.1rem;
}

.oauth-toggle-field {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.oauth-switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
  flex-shrink: 0;

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .oauth-slider {
    position: absolute;
    inset: 0;
    cursor: pointer;
    background: #d3d3d3;
    border-radius: 999px;
    transition: 0.2s;

    &::before {
      content: "";
      position: absolute;
      height: 18px;
      width: 18px;
      left: 3px;
      top: 3px;
      background: #fff;
      border-radius: 50%;
      transition: 0.2s;
    }
  }

  input:checked + .oauth-slider {
    background: #10e80c;
  }

  input:checked + .oauth-slider::before {
    transform: translateX(18px);
  }
}

.oauth-toggle-text {
  font-size: 0.95rem;
}

.oauth-info {
  color: #aaa;
  cursor: help;
  margin-left: 0.15rem;
}

.dark-mode {
  .section-header .section-heading p,
  .oauth-empty {
    color: #aaa;
  }
  .oauth-card {
    border-color: #2a2a2a;
  }
  .oauth-copy-row code,
  .oauth-uri,
  .oauth-hint code {
    background: #242424;
  }
}
</style>
