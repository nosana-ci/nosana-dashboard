<template>
  <div class="api-keys-section">
    <div
      class="is-flex is-justify-content-space-between is-align-items-center mb-4"
    >
      <h3 class="title is-4 mb-0">API Keys</h3>
      <div class="is-flex is-align-items-center is-gap-1">
        <button @click="showCreateKeyModal = true" class="button is-dark">
          <span class="icon">
            <FontAwesomeIcon :icon="faPlus" />
          </span>
          <span>Create Key</span>
        </button>
      </div>
    </div>

    <div v-if="!hasLoadedOnce && loadingKeys" class="box data-card p-5">
      <progress class="progress is-small is-grey" max="100"></progress>
      <p class="has-text-centered has-text-grey">Loading API keys…</p>
    </div>

    <div
      v-else-if="apiKeys?.keys?.length === 0"
      class="box empty-card has-text-centered py-6 px-5"
    >
      <span class="empty-icon">
        <FontAwesomeIcon :icon="faKey" size="lg" />
      </span>
      <h4 class="title is-5 mb-2">No API keys yet</h4>
      <p class="subtitle is-6 mb-5">
        Create your first key to authenticate requests to the Nosana API.
      </p>
      <button @click="showCreateKeyModal = true" class="button is-dark">
        <span class="icon">
          <FontAwesomeIcon :icon="faPlus" />
        </span>
        <span>Create Key</span>
      </button>
    </div>

    <div v-else class="box data-card p-0">
      <div class="table-container">
        <table class="table dev-table is-fullwidth is-hoverable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Access</th>
              <th>Status</th>
              <th>Created</th>
              <th>Expires</th>
              <th class="has-text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in apiKeys.keys" :key="key.id">
              <td>
                <strong>{{ key.name }}</strong>
              </td>
              <td>
                <code class="is-family-monospace">{{ maskKey(key.key) }}</code>
              </td>
              <td class="has-text-grey">{{ accessLabel(key) }}</td>
              <td>
                <span
                  class="tag is-rounded is-light"
                  :class="{
                    'is-success': key.status === 'active',
                    'is-warning': key.status === 'disabled',
                    'is-danger': key.status === 'expired',
                  }"
                >
                  {{ key.status }}
                </span>
              </td>
              <td class="has-text-grey">{{ formatDate(key.createdAt) }}</td>
              <td class="has-text-grey">
                {{ key.expiresAt ? formatDate(key.expiresAt) : "Never" }}
              </td>
              <td>
                <div class="is-flex is-justify-content-flex-end is-gap-1">
                  <button
                    @click="viewKey(key)"
                    class="button is-small action-btn"
                    title="View key"
                  >
                    <span class="icon is-small">
                      <FontAwesomeIcon :icon="faEye" />
                    </span>
                  </button>
                  <button
                    @click="editKey(key)"
                    class="button is-small action-btn"
                    title="Edit key"
                  >
                    <span class="icon is-small">
                      <FontAwesomeIcon :icon="faEdit" />
                    </span>
                  </button>
                  <button
                    @click="deleteKey(key)"
                    class="button is-small action-btn is-danger-action"
                    title="Delete key"
                    :disabled="deletingKeyId === key.id"
                    :class="{ 'is-loading': deletingKeyId === key.id }"
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

    <ApiKeyCreateModal v-model="showCreateKeyModal" @created="onKeyCreated" />

    <!-- View Key Modal -->
    <div class="modal" :class="{ 'is-active': showViewKeyModal }">
      <div class="modal-background" @click="showViewKeyModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">API Key Details</p>
          <button class="delete" @click="showViewKeyModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div v-if="selectedKey">
            <div class="field">
              <label class="label">Key Name</label>
              <p class="control">
                <strong>{{ selectedKey.name }}</strong>
              </p>
            </div>

            <div class="field">
              <label class="label">API Key</label>
              <div class="control">
                <div class="is-flex">
                  <input
                    :value="maskKey(selectedKey.key)"
                    class="input is-family-monospace"
                    type="text"
                    readonly
                    style="flex: 1"
                  />
                  <button
                    @click="copyKey(selectedKey.key)"
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
                Keep this key secure!
              </p>
            </div>

            <div class="columns">
              <div class="column">
                <div class="field">
                  <label class="label">Status</label>
                  <span
                    class="tag"
                    :class="{
                      'is-success': selectedKey.status === 'active',
                      'is-warning': selectedKey.status === 'disabled',
                      'is-danger': selectedKey.status === 'expired',
                    }"
                  >
                    {{ selectedKey.status }}
                  </span>
                </div>
              </div>
              <div class="column">
                <div class="field">
                  <label class="label">Created</label>
                  <p>{{ formatDate(selectedKey.createdAt) }}</p>
                </div>
              </div>
            </div>

            <div class="columns">
              <div class="column">
                <div class="field">
                  <label class="label">Last Used</label>
                  <p>
                    {{
                      selectedKey.lastUsedAt
                        ? formatDate(selectedKey.lastUsedAt)
                        : "Never"
                    }}
                  </p>
                </div>
              </div>
              <div class="column">
                <div class="field">
                  <label class="label">Expires</label>
                  <p>
                    {{
                      selectedKey.expiresAt
                        ? formatDate(selectedKey.expiresAt)
                        : "Never"
                    }}
                  </p>
                </div>
              </div>
            </div>

            <ScopePicker
              :model-value="selectedKey.scopes ?? []"
              readonly
              unavailable-note="Not recorded for this key."
            />
          </div>
        </section>
        <footer class="modal-card-foot">
          <button @click="showViewKeyModal = false" class="button">
            Close
          </button>
        </footer>
      </div>
    </div>

    <!-- Edit Key Modal -->
    <div class="modal" :class="{ 'is-active': showEditKeyModal }">
      <div class="modal-background" @click="showEditKeyModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Edit API Key</p>
          <button class="delete" @click="showEditKeyModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div v-if="selectedKey">
            <div class="field">
              <label class="label">Key Name</label>
              <div class="control">
                <input
                  v-model="editKeyName"
                  class="input"
                  type="text"
                  placeholder="Key name"
                  maxlength="100"
                />
              </div>
            </div>

            <div class="field">
              <label class="label">Status</label>
              <div class="control">
                <div class="select is-fullwidth">
                  <select v-model="editKeyStatus">
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
              <p class="help">Disabled keys cannot be used for API access</p>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button
            @click="updateKey"
            class="button is-success"
            :disabled="!editKeyName || updatingKey"
            :class="{ 'is-loading': updatingKey }"
          >
            Update Key
          </button>
          <button @click="showEditKeyModal = false" class="button">
            Cancel
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from "vue-toastification";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import ScopePicker from "~/components/Account/ScopePicker.vue";
import ApiKeyCreateModal from "~/components/Account/ApiKeyCreateModal.vue";
import { maskKey, type ApiKey } from "~/composables/useApiKeys";
import {
  faPlus,
  faKey,
  faEye,
  faEdit,
  faTrash,
  faCopy,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

const config = useRuntimeConfig().public;
const { isAuthenticated, isLoading } = useSuperTokens();
const toast = useToast();

// State
const hasLoadedOnce = ref(false);
const showCreateKeyModal = ref(false);
const showViewKeyModal = ref(false);
const showEditKeyModal = ref(false);
const updatingKey = ref(false);
const deletingKeyId = ref<string | null>(null);
const selectedKey = ref<any>(null);
const editKeyName = ref("");
const editKeyStatus = ref("active");

const { scopeNames } = useScopeCatalogue();

// A key holding everything is the common case and reads better than "8 scopes".
const accessLabel = (key: { scopes?: string[] }) => {
  const held = key.scopes?.length ?? 0;
  if (!held) return "—";
  if (scopeNames.value.length && held >= scopeNames.value.length)
    return "Full access";
  return held === 1 ? "1 permission" : `${held} permissions`;
};

// Track if authenticated (to trigger refetch after login)
const wasAuthenticated = ref(isAuthenticated.value);

const { apiKeys, loadingKeys, refreshKeys } = useApiKeys();

// Mark first successful resolution to keep UI stable on later refreshes
watch(
  loadingKeys,
  (isPending) => {
    if (!isPending) {
      hasLoadedOnce.value = true;
    }
  },
  { immediate: true },
);

// A new key is shown straight away, since this is the moment to copy it.
const onKeyCreated = async (key: ApiKey) => {
  selectedKey.value = key;
  showViewKeyModal.value = true;
  await refreshKeys();
};

const viewKey = (keyData: any) => {
  selectedKey.value = keyData;
  showViewKeyModal.value = true;
};

const editKey = (keyData: any) => {
  selectedKey.value = keyData;
  editKeyName.value = keyData.name;
  editKeyStatus.value = keyData.status;
  showEditKeyModal.value = true;
};

const updateKey = async () => {
  if (!selectedKey.value || !editKeyName.value || !isAuthenticated.value)
    return;

  try {
    updatingKey.value = true;

    await $fetch(
      `${config.apiBase}/api-keys/${selectedKey.value.id}/update`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          name: editKeyName.value,
          status: editKeyStatus.value,
        },
      },
    );

    toast.success("API key updated successfully!");
    showEditKeyModal.value = false;

    await refreshKeys();
  } catch (error: any) {
    console.error("Error updating key:", error);
    toast.error(error.data?.message || "Failed to update API key");
  } finally {
    updatingKey.value = false;
  }
};

const deleteKey = async (keyData: any) => {
  if (
    !confirm(
      `Are you sure you want to delete the key "${keyData.name}"? The key will no longer work after deletion. This action cannot be undone.`,
    )
  ) {
    return;
  }

  if (!isAuthenticated.value) return;

  try {
    deletingKeyId.value = keyData.id;

    await $fetch(`${config.apiBase}/api-keys/${keyData.id}/delete`, {
      method: "POST",
      credentials: "include",
    });

    toast.success("API key deleted successfully!");

    await refreshKeys();
  } catch (error: any) {
    console.error("Error deleting key:", error);
    toast.error(error.data?.message || "Failed to delete API key");
  } finally {
    deletingKeyId.value = null;
  }
};

const copyKey = async (keyValue: string) => {
  try {
    await navigator.clipboard.writeText(keyValue);
    toast.success("Key copied to clipboard!");
  } catch (error) {
    console.error("Error copying key:", error);
    toast.error("Failed to copy key to clipboard");
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>


