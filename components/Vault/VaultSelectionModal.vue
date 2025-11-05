<template>
  <div class="modal" :class="{ 'is-active': isActive }">
    <div class="modal-background" @click="$emit('close')"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Select Vault</p>
        <button class="delete" @click="$emit('close')" aria-label="close"></button>
      </header>
      
      <section class="modal-card-body">
        <div class="content">
          <p class="subtitle is-6 has-text-grey-dark mb-5">
            Choose an existing vault or create a new one for your deployment.
          </p>

          <!-- Create New Vault Button -->
          <div class="field mb-4 has-text-centered">
            <button 
              class="button is-primary"
              @click="handleCreateVault"
              :class="{ 'is-loading': creating }"
              :disabled="creating"
            >
              <span class="icon">
                <FontAwesomeIcon :icon="faPlus" />
              </span>
              <span>Create New Vault</span>
            </button>
          </div>

          <!-- Divider -->
          <div v-if="!loading && vaults.length > 0" class="divider-section">
            <hr>
            <span class="divider-text">or choose existing</span>
          </div>

          <!-- Existing Vaults Loading -->
          <div v-if="loading" class="has-text-centered py-4">
            <span class="icon is-small">
              <i class="fas fa-spinner fa-spin"></i>
            </span>
            <span class="ml-2">Loading vaults...</span>
          </div>

          <!-- No Vaults Found -->
          <div v-else-if="vaults.length === 0" class="has-text-centered py-4">
            <p class="has-text-grey">No existing vaults found</p>
          </div>

          <!-- Existing Vaults Dropdown -->
          <div v-else>
            <div class="field">
              <label class="label">Select existing vault:</label>
              <div class="control has-icons-right">
                <div class="select is-fullwidth">
                  <select 
                    v-model="localSelectedVault" 
                    @change="handleVaultChange"
                    class="vault-select"
                  >
                    <option value="">Choose an existing vault...</option>
                    <option 
                      v-for="vault in vaults" 
                      :key="vault.public_key"
                      :value="vault.public_key"
                    >
                      {{ vault.public_key ? `${vault.public_key.slice(0, 8)}...${vault.public_key.slice(-8)}` : 'Unknown Vault' }} 
                      ({{ vault.balance?.SOL?.toFixed(3) || '0' }} SOL)
                    </option>
                  </select>
                </div>
                <div class="icon is-small is-right dropdown-arrow">
                  <i class="fas fa-angle-down" aria-hidden="true"></i>
                </div>
              </div>
            </div>

            <!-- Simple Selected Vault Info -->
            <div v-if="previewVault" class="selected-vault-info">
              <p class="has-text-grey is-size-7">
                <span class="has-text-weight-medium">Selected:</span> 
                {{ previewVault.public_key }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer class="modal-card-foot">
        <button 
          class="button is-primary" 
          :disabled="!selectedVault"
          @click="$emit('confirm', selectedVault)"
        >
          Use Selected Vault
        </button>
        <button class="button" @click="$emit('close')">Cancel</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Vault } from '~/composables/useVaultManager'
import WalletIcon from '@/components/WalletIcon.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

interface Props {
  isActive: boolean
  vaults: Vault[]
  selectedVault: Vault | null
  loading: boolean
  creating: boolean
}

interface Emits {
  close: []
  confirm: [vault: Vault]
  'create-vault': []
  'select-vault': [vault: Vault]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state for dropdown
const localSelectedVault = ref<string>('')

// Computed property for vault preview
const previewVault = computed(() => {
  if (!localSelectedVault.value) return null
  return props.vaults.find(v => v.public_key === localSelectedVault.value)
})

// Watch for external selectedVault changes
watch(() => props.selectedVault, (newVault) => {
  localSelectedVault.value = newVault?.public_key || ''
}, { immediate: true })

// Reset dropdown when modal closes
watch(() => props.isActive, (isActive) => {
  if (!isActive) {
    localSelectedVault.value = props.selectedVault?.public_key || ''
  }
})

const handleCreateVault = () => {
  emit('create-vault')
}

const handleVaultChange = () => {
  if (localSelectedVault.value) {
    const vault = props.vaults.find(v => v.public_key === localSelectedVault.value)
    if (vault) {
      emit('select-vault', vault)
    }
  }
}
</script>

<style scoped>
.divider-section {
  position: relative;
  margin: 1.5rem 0;
}

.divider-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 0 0.75rem;
  color: #9ca3af;
  font-size: 0.875rem;
}

.selected-vault-info {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.selected-vault-info p {
  word-break: break-all;
}

.vault-select {
  background-color: white;
  color: #363636;
  border: 1px solid #dbdbdb;
}

.vault-select:focus {
  border-color: #3273dc;
  box-shadow: 0 0 0 0.125em rgba(50, 115, 220, 0.25);
}

.dropdown-arrow {
  color: #3273dc;
  pointer-events: none;
}

.select:not(.is-multiple):not(.is-loading)::after {
  display: none;
}

</style>