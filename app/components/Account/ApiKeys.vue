<template>
  <div class="api-keys-section">
    <div class="is-flex is-justify-content-space-between is-align-items-center mb-4">
      <h3 class="title is-4 mb-0">API Keys</h3>
      <button 
        @click="showCreateKeyModal = true" 
        class="button is-dark"
      >
        <span class="icon">
          <FontAwesomeIcon :icon="faPlus" />
        </span>
        <span>Create Key</span>
      </button>
    </div>
    
    <div v-if="!hasLoadedOnce && loadingKeys" class="box">
      <progress class="progress is-small is-grey" max="100"></progress>
      <p class="has-text-centered">Loading API keys...</p>
    </div>
    
    <div v-else-if="apiKeys?.keys?.length === 0" class="box has-text-centered">
      <div class="content">
        <span class="icon is-large has-text-grey-light">
          <FontAwesomeIcon :icon="faKey" size="2x" />
        </span>
        <h5 class="title is-5">No API Keys</h5>
        <p class="subtitle">Create your first API key to access the Nosana API.</p>
        <button 
          @click="showCreateKeyModal = true" 
          class="button is-dark"
        >
          <span class="icon">
            <FontAwesomeIcon :icon="faPlus" />
          </span>
          <span>Create Key</span>
        </button>
      </div>
    </div>
    
    <div v-else class="box">
      <div class="table-container">
        <table class="table is-fullwidth is-hoverable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Key</th>
              <th>Status</th>
              <th>Created</th>
              <th>Expires</th>
              <th>Actions</th>
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
              <td>
                <span 
                  class="tag" 
                  :class="{
                    'is-success': key.status === 'active',
                    'is-warning': key.status === 'disabled',
                    'is-danger': key.status === 'expired'
                  }"
                >
                  {{ key.status }}
                </span>
              </td>
              <td>{{ formatDate(key.createdAt) }}</td>
              <td>{{ key.expiresAt ? formatDate(key.expiresAt) : 'Never' }}</td>
              <td>
                <div class="field is-grouped">
                  <p class="control">
                    <button 
                      @click="viewKey(key)" 
                      class="button is-small is-light"
                      title="View Key"
                    >
                      <span class="icon is-small">
                        <FontAwesomeIcon :icon="faEye" />
                      </span>
                    </button>
                  </p>
                  <p class="control">
                    <button 
                      @click="editKey(key)" 
                      class="button is-small is-light"
                      title="Edit Key"
                    >
                      <span class="icon is-small">
                        <FontAwesomeIcon :icon="faEdit" />
                      </span>
                    </button>
                  </p>
                  <p class="control">
                    <button 
                      @click="deleteKey(key)" 
                      class="button is-small is-light has-text-danger"
                      title="Delete Key"
                      :disabled="deletingKeyId === key.id"
                      :class="{ 'is-loading': deletingKeyId === key.id }"
                    >
                      <span class="icon is-small">
                        <FontAwesomeIcon :icon="faTrash" />
                      </span>
                    </button>
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Key Modal -->
    <div class="modal" :class="{ 'is-active': showCreateKeyModal }">
      <div class="modal-background" @click="showCreateKeyModal = false"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Create API Key</p>
          <button class="delete" @click="showCreateKeyModal = false"></button>
        </header>
        <section class="modal-card-body">
          <div class="field">
            <label class="label">Key Name</label>
            <div class="control">
              <input 
                v-model="newKeyName" 
                class="input" 
                type="text" 
                placeholder="e.g., My App Key"
                maxlength="100"
              >
            </div>
            <p class="help">A descriptive name to identify this key</p>
          </div>
          
          <div class="field">
            <label class="label">Expiration</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="newKeyExpiration">
                  <option value="">Never expires</option>
                  <option :value="7 * 24 * 60 * 60">7 days</option>
                  <option :value="30 * 24 * 60 * 60">30 days</option>
                  <option :value="90 * 24 * 60 * 60">90 days</option>
                  <option :value="365 * 24 * 60 * 60">1 year</option>
                </select>
              </div>
            </div>
            <p class="help">When should this key expire?</p>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button 
            @click="createKey" 
            class="button is-dark"
            :disabled="!newKeyName || creatingKey"
            :class="{ 'is-loading': creatingKey }"
          >
            Create Key
          </button>
          <button @click="showCreateKeyModal = false" class="button">Cancel</button>
        </footer>
      </div>
    </div>

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
                    style="flex: 1;"
                  >
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
                      'is-danger': selectedKey.status === 'expired'
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
                  <p>{{ selectedKey.lastUsedAt ? formatDate(selectedKey.lastUsedAt) : 'Never' }}</p>
                </div>
              </div>
              <div class="column">
                <div class="field">
                  <label class="label">Expires</label>
                  <p>{{ selectedKey.expiresAt ? formatDate(selectedKey.expiresAt) : 'Never' }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button @click="showViewKeyModal = false" class="button">Close</button>
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
                >
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
            class="button is-dark"
            :disabled="!editKeyName || updatingKey"
            :class="{ 'is-loading': updatingKey }"
          >
            Update Key
          </button>
          <button @click="showEditKeyModal = false" class="button">Cancel</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from "vue-toastification";
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { 
  faPlus, 
  faKey, 
  faEye, 
  faEdit, 
  faTrash, 
  faCopy, 
  faExclamationTriangle 
} from '@fortawesome/free-solid-svg-icons';


const config = useRuntimeConfig().public;
const { isAuthenticated, isLoading } = useSuperTokens();
const toast = useToast();

// State
const hasLoadedOnce = ref(false)
const showCreateKeyModal = ref(false);
const showViewKeyModal = ref(false);
const showEditKeyModal = ref(false);
const newKeyName = ref('');
const newKeyExpiration = ref('');
const creatingKey = ref(false);
const updatingKey = ref(false);
const deletingKeyId = ref<string | null>(null);
const selectedKey = ref<any>(null);
const editKeyName = ref('');
const editKeyStatus = ref('active');

// Track if authenticated (to trigger refetch after login)
const wasAuthenticated = ref(isAuthenticated.value);

const {
  data: apiKeys,
  pending: loadingKeys,
  refresh: refreshKeys
} = useMyAsyncData('api-keys', async () => {
  if (!isAuthenticated.value) {
    return { keys: [], total: 0 };
  }
  
  return await $fetch(`${config.client_manager_url}/api-keys`, {
    credentials: 'include'
  });
}, {
  default: () => ({ keys: [], total: 0 }),
  watch: [isAuthenticated]
});

// Mark first successful resolution to keep UI stable on later refreshes
watch(loadingKeys, (isPending) => {
  if (!isPending) {
    hasLoadedOnce.value = true
  }
}, { immediate: true })

const createKey = async () => {
  if (!newKeyName.value || !isAuthenticated.value) return;
  
  try {
    creatingKey.value = true;
    const payload: any = { name: newKeyName.value };
    if (newKeyExpiration.value) {
      payload.expiresIn = parseInt(newKeyExpiration.value);
    }
    
    const response = await $fetch(`${config.client_manager_url}/api-keys`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload
    });
    
    toast.success('API key created successfully!');
    
    selectedKey.value = response;
    showCreateKeyModal.value = false;
    showViewKeyModal.value = true;
    
    newKeyName.value = '';
    newKeyExpiration.value = '';
    await refreshKeys();
    
  } catch (error: any) {
    console.error('Error creating key:', error);
    toast.error(error.data?.message || 'Failed to create API key');
  } finally {
    creatingKey.value = false;
  }
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
  if (!selectedKey.value || !editKeyName.value || !isAuthenticated.value) return;
  
  try {
    updatingKey.value = true;
    
    await $fetch(`${config.client_manager_url}/api-keys/${selectedKey.value.id}/update`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        name: editKeyName.value,
        status: editKeyStatus.value
      }
    });
    
    toast.success('API key updated successfully!');
    showEditKeyModal.value = false;
    
    await refreshKeys();
    
  } catch (error: any) {
    console.error('Error updating key:', error);
    toast.error(error.data?.message || 'Failed to update API key');
  } finally {
    updatingKey.value = false;
  }
};

const deleteKey = async (keyData: any) => {
  if (!confirm(`Are you sure you want to delete the key "${keyData.name}"? The key will no longer work after deletion. This action cannot be undone.`)) {
    return;
  }
  
  if (!isAuthenticated.value) return;
  
  try {
    deletingKeyId.value = keyData.id;
    
    await $fetch(`${config.client_manager_url}/api-keys/${keyData.id}/delete`, {
      method: 'POST',
      credentials: 'include'
    });
    
    toast.success('API key deleted successfully!');
    
    await refreshKeys();
    
  } catch (error: any) {
    console.error('Error deleting key:', error);
    toast.error(error.data?.message || 'Failed to delete API key');
  } finally {
    deletingKeyId.value = null;
  }
};

const copyKey = async (keyValue: string) => {
  try {
    await navigator.clipboard.writeText(keyValue);
    toast.success('Key copied to clipboard!');
  } catch (error) {
    console.error('Error copying key:', error);
    toast.error('Failed to copy key to clipboard');
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const maskKey = (key: string) => {
  if (!key) return '';
  if (key.length <= 8) return key;
  
  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  const masked = '•'.repeat(Math.min(key.length - 8, 20));
  
  return `${start}${masked}${end}`;
};
</script>

<style scoped>

.table-container {
  max-height: 400px;
  overflow-y: auto;
}

.modal-card {
  max-width: 600px;
  width: 90%;
}

.is-family-monospace {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9rem;
}

@media screen and (max-width: 768px) {
  .table-container {
    overflow-x: auto;
  }
  
  .table {
    font-size: 0.85rem;
  }
  
  .table td, .table th {
    padding: 0.5rem;
  }
}
</style>