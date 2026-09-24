<template>
  <div class="oauth-apps-section">
    <div
      class="is-flex is-justify-content-space-between is-align-items-center mb-4"
    >
      <h3 class="title is-4 mb-0">Nosana Connected Apps</h3>
      <div class="is-flex is-align-items-center is-gap-1">
        <button
          @click="openCreate"
          class="button is-dark"
          :disabled="!isAuthenticated || atLimit"
        >
          <span class="icon">
            <FontAwesomeIcon :icon="faPlus" />
          </span>
          <span>Create App</span>
        </button>
      </div>
    </div>

    <p class="subtitle is-6 has-text-grey mb-4">
      Add <strong>“Connect with Nosana”</strong> to your own apps, so people can
      sign in with their Nosana account.
      <a
        href="https://learn.nosana.com/connect"
        target="_blank"
        rel="noopener noreferrer"
        >Learn more</a
      >.
    </p>

    <div v-if="!hasLoadedOnce && loadingApps" class="box data-card p-5">
      <progress class="progress is-small is-grey" max="100"></progress>
      <p class="has-text-centered has-text-grey">Loading connected apps…</p>
    </div>

    <div
      v-else-if="appsData.apps.length === 0"
      class="box empty-card has-text-centered py-6 px-5"
    >
      <span class="empty-icon">
        <FontAwesomeIcon :icon="faPlug" size="lg" />
      </span>
      <h4 class="title is-5 mb-2">No connected apps yet</h4>
      <p class="subtitle is-6 mb-5">
        Create your first app to get a client ID for “Connect with Nosana”.
      </p>
      <button
        @click="openCreate"
        class="button is-dark"
        :disabled="!isAuthenticated || atLimit"
      >
        <span class="icon">
          <FontAwesomeIcon :icon="faPlus" />
        </span>
        <span>Create App</span>
      </button>
    </div>

    <div v-else class="box data-card p-0">
      <div class="table-container">
        <table class="table dev-table is-fullwidth is-hoverable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Client ID</th>
              <th>Permissions</th>
              <th>Type</th>
              <th class="has-text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="app in appsData.apps" :key="app.clientId">
              <td>
                <div class="is-flex is-align-items-center is-gap-1">
                  <img
                    v-if="app.logoUri"
                    :src="app.logoUri"
                    :alt="`${app.name} logo`"
                    class="oauth-app-logo"
                  />
                  <strong>{{ app.name }}</strong>
                </div>
              </td>
              <td>
                <code class="is-family-monospace">{{ app.clientId }}</code>
              </td>
              <td class="has-text-grey">{{ ceilingLabel(app) }}</td>
              <td>
                <span
                  class="tag is-rounded is-light"
                  :class="{ 'is-info': app.confidential }"
                >
                  {{ app.confidential ? "Server-side" : "Browser" }}
                </span>
              </td>
              <td>
                <div class="is-flex is-justify-content-flex-end is-gap-1">
                  <button
                    @click="viewApp(app)"
                    class="button is-small action-btn"
                    title="View app"
                  >
                    <span class="icon is-small">
                      <FontAwesomeIcon :icon="faEye" />
                    </span>
                  </button>
                  <button
                    @click="editApp(app)"
                    class="button is-small action-btn"
                    title="Edit permissions"
                  >
                    <span class="icon is-small">
                      <FontAwesomeIcon :icon="faEdit" />
                    </span>
                  </button>
                  <button
                    @click="removeApp(app)"
                    class="button is-small action-btn is-danger-action"
                    title="Delete app"
                    :disabled="deletingId === app.clientId"
                    :class="{ 'is-loading': deletingId === app.clientId }"
                  >
                    <span class="icon is-small">
                      <FontAwesomeIcon :icon="faTrash" />
                    </span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p v-if="atLimit" class="help has-text-warning">
      Limit of {{ appsData.limit }} apps reached.
    </p>

    <!-- Create App Modal -->
    <div class="modal" :class="{ 'is-active': showCreate }">
      <div class="modal-background" @click="showCreate = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Create Nosana Connected App</p>
          <button class="delete" @click="showCreate = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">App Name</label>
            <div class="control">
              <input
                v-model="form.name"
                class="input"
                type="text"
                placeholder="AnotherApp"
                maxlength="100"
              />
            </div>
          </div>

          <div class="field">
            <label class="label">Redirect URIs</label>
            <div
              v-for="(uri, i) in form.redirectUris"
              :key="i"
              class="is-flex mb-2"
              style="gap: 0.5rem"
            >
              <input
                v-model="form.redirectUris[i]"
                class="input"
                type="text"
                placeholder="https://anotherapp.com/auth/nosana/callback"
                style="flex: 1"
              />
              <button
                v-if="form.redirectUris.length > 1"
                type="button"
                class="button is-light"
                title="Remove"
                @click="removeUri(i)"
              >
                <span class="icon">
                  <FontAwesomeIcon :icon="faTrash" />
                </span>
              </button>
            </div>
            <button
              type="button"
              class="button is-small is-light"
              @click="addUri"
            >
              <span class="icon">
                <FontAwesomeIcon :icon="faPlus" />
              </span>
              <span>Add another</span>
            </button>
          </div>

          <div class="field">
            <label class="label"
              >Logo URL
              <span class="has-text-grey-light">(optional)</span></label
            >
            <div class="control">
              <input
                v-model="form.logoUri"
                class="input"
                type="text"
                placeholder="https://anotherapp.com/logo.png"
              />
            </div>
          </div>

          <div class="field">
            <label class="label">Where does your app run?</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="form.confidential">
                  <option :value="false">In the browser or on mobile</option>
                  <option :value="true">On a server with a backend</option>
                </select>
              </div>
            </div>
            <p class="help">
              Apps with a backend get a client secret to keep private on their
              server. Browser and mobile apps don’t need one.
            </p>
          </div>

          <ScopePicker
            v-model="form.scopes"
            :options="oauthGrantableScopes"
            help="What this app may ask users for. If it requests nothing specific, this is what the consent screen offers — apart from the credential-management permissions, which an app always has to request by name. Each user approves the request themselves."
            unavailable-note="Couldn't load the permission list, so this app will be created with the default ceiling."
          />
        </section>
        <footer class="modal-card-foot">
          <button
            @click="createApp"
            class="button is-success"
            :disabled="!canCreate"
            :class="{ 'is-loading': creating }"
          >
            Create App
          </button>
          <button @click="showCreate = false" class="button">Cancel</button>
        </footer>
      </div>
    </div>

    <!-- View App Modal -->
    <div class="modal" :class="{ 'is-active': showView }">
      <div class="modal-background" @click="showView = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">App Details</p>
          <button class="delete" @click="showView = false"></button>
        </header>
        <section class="modal-card-body">
          <div v-if="selectedApp">
            <div class="field">
              <label class="label">App Name</label>
              <p class="control">
                <strong>{{ selectedApp.name }}</strong>
              </p>
            </div>

            <div class="field">
              <label class="label">Type</label>
              <span
                class="tag"
                :class="selectedApp.confidential ? 'is-info' : 'is-light'"
              >
                {{ selectedApp.confidential ? "Server-side" : "Browser" }}
              </span>
            </div>

            <div class="field">
              <label class="label">Client ID</label>
              <div class="control">
                <div class="is-flex">
                  <input
                    :value="selectedApp.clientId"
                    class="input is-family-monospace"
                    type="text"
                    readonly
                    style="flex: 1"
                  />
                  <button
                    @click="copy(selectedApp.clientId)"
                    class="button is-light ml-2"
                    title="Copy to clipboard"
                  >
                    <span class="icon">
                      <FontAwesomeIcon :icon="faCopy" />
                    </span>
                  </button>
                </div>
              </div>
              <p class="help">
                Add sign-in with the
                <a
                  href="https://learn.nosana.com/connect"
                  target="_blank"
                  rel="noopener noreferrer"
                  >Nosana Kit</a
                >
                using this Client ID — it handles the rest for you.
              </p>
            </div>

            <div class="field">
              <label class="label">Redirect URIs</label>
              <div class="control">
                <input
                  v-for="uri in selectedApp.redirectUris"
                  :key="uri"
                  :value="uri"
                  class="input is-family-monospace mb-2"
                  type="text"
                  readonly
                />
              </div>
            </div>

            <ScopePicker
              :model-value="selectedApp.scopes ?? []"
              :options="oauthGrantableScopes"
              readonly
              unavailable-note="No permissions recorded."
            />

            <div class="field">
              <label class="label">Scope parameter</label>
              <div class="control">
                <div class="is-flex">
                  <input
                    :value="scopeParam(selectedApp)"
                    class="input is-family-monospace"
                    type="text"
                    readonly
                    style="flex: 1"
                  />
                  <button
                    @click="copy(scopeParam(selectedApp))"
                    class="button is-light ml-2"
                    title="Copy to clipboard"
                  >
                    <span class="icon">
                      <FontAwesomeIcon :icon="faCopy" />
                    </span>
                  </button>
                </div>
              </div>
              <p class="help">
                Put this in your authorize URL’s <code>scope</code> parameter.
                The permissions above are only a ceiling — your app is granted
                nothing it does not ask for, so an authorize URL with no
                <code>scope</code> yields a token that can’t call anything.
              </p>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button @click="showView = false" class="button">Close</button>
        </footer>
      </div>
    </div>

    <!-- Edit Modal — permissions only. Name, redirect URIs and app type are fixed
         once integrators are relying on them; the ceiling is the part worth changing. -->
    <div class="modal" :class="{ 'is-active': showEdit }">
      <div class="modal-background" @click="showEdit = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Edit Permissions</p>
          <button class="delete" @click="showEdit = false"></button>
        </header>
        <section class="modal-card-body">
          <div v-if="selectedApp">
            <p class="mb-4">
              What <strong>{{ selectedApp.name }}</strong> may ask users for.
            </p>

            <ScopePicker
              v-model="editScopes"
              :options="oauthGrantableScopes"
              help="Removing a permission stops the app asking for it from now on. Users who already granted it keep access until their token next refreshes."
              unavailable-note="Couldn't load the permission list, so permissions can't be edited right now."
            />
          </div>
        </section>
        <footer class="modal-card-foot">
          <button
            @click="updateApp"
            class="button is-success"
            :disabled="!editScopes.length || updating"
            :class="{ 'is-loading': updating }"
          >
            Save
          </button>
          <button @click="showEdit = false" class="button">Cancel</button>
        </footer>
      </div>
    </div>

    <!-- Created Modal (client_id + one-time secret) -->
    <div class="modal" :class="{ 'is-active': !!created }">
      <div class="modal-background" @click="created = null"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">App Created</p>
          <button class="delete" @click="created = null"></button>
        </header>
        <section class="modal-card-body">
          <div v-if="created">
            <div class="field">
              <label class="label">Client ID</label>
              <div class="control">
                <div class="is-flex">
                  <input
                    :value="created.clientId"
                    class="input is-family-monospace"
                    type="text"
                    readonly
                    style="flex: 1"
                  />
                  <button
                    @click="copy(created.clientId)"
                    class="button is-light ml-2"
                    title="Copy to clipboard"
                  >
                    <span class="icon">
                      <FontAwesomeIcon :icon="faCopy" />
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="created.clientSecret" class="field">
              <label class="label">Client Secret</label>
              <div class="control">
                <div class="is-flex">
                  <input
                    :value="created.clientSecret"
                    class="input is-family-monospace"
                    type="text"
                    readonly
                    style="flex: 1"
                  />
                  <button
                    @click="copy(created.clientSecret)"
                    class="button is-light ml-2"
                    title="Copy to clipboard"
                  >
                    <span class="icon">
                      <FontAwesomeIcon :icon="faCopy" />
                    </span>
                  </button>
                </div>
              </div>
              <p class="help has-text-warning">
                <FontAwesomeIcon :icon="faExclamationTriangle" class="mr-1" />
                Copy this now — it won’t be shown again.
              </p>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button @click="created = null" class="button is-success">Done</button>
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
  faPlug,
  faEye,
  faEdit,
  faTrash,
  faCopy,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import ScopePicker from "~/components/Account/ScopePicker.vue";

interface OAuthApp {
  clientId: string;
  name: string;
  redirectUris: string[];
  logoUri?: string;
  confidential: boolean;
  clientSecret?: string;
  scopes?: string[];
}

const config = useRuntimeConfig().public;
const { isAuthenticated } = useSuperTokens();
const toast = useToast();

const hasLoadedOnce = ref(false);
const showCreate = ref(false);
const showView = ref(false);
const showEdit = ref(false);
const creating = ref(false);
const updating = ref(false);
const created = ref<OAuthApp | null>(null);
const deletingId = ref<string | null>(null);
const selectedApp = ref<OAuthApp | null>(null);
const editScopes = ref<string[]>([]);
const form = ref({
  name: "",
  redirectUris: [""] as string[],
  logoUri: "",
  confidential: false,
  scopes: [] as string[],
});

// An app can only ever hold the OAuth-grantable subset — `inference:use` is API-key-only,
// and asking for it is a 400. The backend flags which those are so this list never has to
// hard-code the exclusion.
const { oauthGrantableScopes } = useScopeCatalogue();

/** The `scope` value an integrator puts in their authorize URL: identity plus the ceiling. */
const scopeParam = (app: OAuthApp) =>
  ["openid", "offline_access", ...(app.scopes ?? [])].join(" ");

const ceilingLabel = (app: OAuthApp) => {
  const held = app.scopes?.length ?? 0;
  if (!held) return "—";
  if (oauthGrantableScopes.value.length && held >= oauthGrantableScopes.value.length)
    return "All available";
  return held === 1 ? "1 permission" : `${held} permissions`;
};

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
    scopes: oauthGrantableScopes.value.map((entry) => entry.scope),
  };
  showCreate.value = true;
}

function viewApp(app: OAuthApp) {
  selectedApp.value = app;
  showView.value = true;
}

function editApp(app: OAuthApp) {
  selectedApp.value = app;
  editScopes.value = [...(app.scopes ?? [])];
  showEdit.value = true;
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
    // Omitted when the catalogue never loaded: the backend then falls back to the
    // caller's own grantable scopes, which is how creation behaved before this picker.
    if (form.value.scopes.length) body.scopes = [...form.value.scopes];

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

async function updateApp() {
  if (!selectedApp.value || !editScopes.value.length || !isAuthenticated.value)
    return;

  // Narrowing stops the app asking for a permission from now on, but does not revoke
  // tokens users already hold — those lapse on their next refresh. Worth a confirmation,
  // since nothing here can tell you what is currently relying on it.
  const removed = (selectedApp.value.scopes ?? []).filter(
    (scope: string) => !editScopes.value.includes(scope),
  );
  if (
    removed.length &&
    !confirm(
      `Remove ${removed.join(", ")} from “${selectedApp.value.name}”? It can no longer ask users for those. Anyone who already granted them keeps access until their token refreshes.`,
    )
  )
    return;

  try {
    updating.value = true;
    // Only the scopes: updateApp carries every other field over from the stored client.
    await $fetch(
      `${config.apiBase}/oauth-apps/${selectedApp.value.clientId}/update`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: { scopes: [...editScopes.value] },
      },
    );

    toast.success("Permissions updated");
    showEdit.value = false;
    await refresh();
  } catch (error: unknown) {
    const e = error as { data?: { message?: string } };
    toast.error(e.data?.message || "Failed to update permissions");
  } finally {
    updating.value = false;
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

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  } catch {
    toast.error("Could not copy");
  }
}
</script>

