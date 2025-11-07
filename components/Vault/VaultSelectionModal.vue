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
                      ({{ formatOptionBalance(vault.public_key, vault.balance?.SOL, vault.balance?.NOS) }})
                    </option>
                  </select>
                </div>
                <div class="icon is-small is-right dropdown-arrow">
                  <i class="fas fa-angle-down" aria-hidden="true"></i>
                </div>
              </div>
            </div>

            <!-- Selected Vault Details -->
            <div v-if="previewVault" class="mt-4">
              <!-- Vault Address -->
              <div class="field">
                <label class="label is-size-7 mb-2">Selected Vault</label>
                <p class="is-size-7 has-text-grey-dark has-text-weight-medium mb-3" style="word-break: break-all;">
                  {{ previewVault.public_key }}
                </p>
              </div>

              <!-- Balance Info and Actions Row -->
              <div class="columns is-gapless mb-3">
                <div class="column">
                  <div class="is-size-7">
                    <span class="has-text-grey">Balance:</span>
                    <template v-if="loadingBalance">
                      <span class="icon is-small ml-1"><i class="fas fa-spinner fa-spin"></i></span>
                      <span class="ml-1 has-text-grey">Loading…</span>
                    </template>
                    <template v-else>
                      <div class="mt-1">
                        <span class="has-text-weight-medium">{{ (solBalance ?? 0).toFixed(3) }} SOL</span>
                        <span class="ml-3 has-text-weight-medium">{{ (nosBalance ?? 0).toFixed(3) }} NOS</span>
                      </div>
                    </template>
                  </div>
                </div>
                <button class="button is-light is-small is-flex is-align-self-center ml-auto" @click="fetchBalances">
                  Refresh
                </button>
              </div>

              <!-- Amount Inputs -->
              <div class="field">
                <label class="label is-size-7 mb-2">SOL Amount</label>
                <div class="field has-addons">
                  <div class="control is-expanded">
                    <input 
                      class="input is-small" 
                      type="number" 
                      min="0" 
                      step="0.000001" 
                      v-model="solAmount" 
                      placeholder="0.000000" 
                    />
                  </div>
                  <div class="control">
                    <button 
                      class="button is-small is-light" 
                      @click="setMaxSolFromVault" 
                      :disabled="loadingBalance"
                    >
                      Max
                    </button>
                  </div>
                </div>
              </div>
              
              <div class="field">
                <label class="label is-size-7 mb-2">NOS Amount</label>
                <div class="field has-addons">
                  <div class="control is-expanded">
                    <input 
                      class="input is-small" 
                      type="number" 
                      min="0" 
                      step="0.000001" 
                      v-model="nosAmount" 
                      placeholder="0.000000" 
                    />
                  </div>
                  <div class="control">
                    <button 
                      class="button is-small is-light" 
                      @click="setMaxNosFromVault" 
                      :disabled="loadingBalance"
                    >
                      Max
                    </button>
                  </div>
                </div>
              </div>

              <!-- Action Buttons Row -->
              <div class="field is-grouped">
                <div class="control">
                  <button 
                    class="button is-secondary" 
                    :class="{ 'is-loading': isToppingUp }" 
                    :disabled="isToppingUp || (!solAmount && !nosAmount)" 
                    @click="topupBoth"
                  >
                    Top up
                  </button>
                </div>
                <div class="control">
                  <button 
                    class="button is-light" 
                    :class="{ 'is-loading': isWithdrawing }" 
                    :disabled="isWithdrawing || (!solAmount && !nosAmount)" 
                    @click="withdrawVault"
                  >
                    Withdraw
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <footer class="modal-card-foot">
        <button 
          class="button is-primary" 
          :disabled="!selectedVault"
          @click="confirmSelection"
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
import type { Vault } from '@/composables/useVaultManager'
import WalletIcon from '@/components/WalletIcon.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { useSDK } from '~/composables/useSDK'
import { useToast } from 'vue-toastification'
import { useWallet } from 'solana-wallets-vue'
import { SystemProgram, Transaction, PublicKey } from '@solana/web3.js'
import { getAssociatedTokenAddress, getAccount, createAssociatedTokenAccountInstruction, createTransferInstruction } from '@solana/spl-token'

interface Props {
  isActive: boolean
  vaults: Vault[]
  selectedVault: Vault | null
  loading: boolean
  creating: boolean
  deploymentId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', vault: Vault): void
  (e: 'create-vault'): void
  (e: 'select-vault', vault: Vault): void
}>()

// Local state for dropdown
const localSelectedVault = ref<string>('')

// Unified amount inputs
const solAmount = ref<string>('')
const nosAmount = ref<string>('')
const isToppingUp = ref(false)
const isWithdrawing = ref(false)
const loadingBalance = ref(false)
const solBalance = ref<number | null>(null)
const nosBalance = ref<number | null>(null)
const vaultBalanceMap = ref<Record<string, { SOL: number; NOS: number }>>({})

const { nosana } = useSDK()
const toast = useToast()
const { publicKey: walletPublicKey, connected, sendTransaction } = useWallet()
const { token } = useAuth()
const config = useRuntimeConfig()

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
      fetchBalances()
    }
  }
}

const confirmSelection = () => {
  if (!localSelectedVault.value) return
  const vault = props.vaults.find(v => v.public_key === localSelectedVault.value)
  if (vault) emit('confirm', vault)
}

const isWalletMode = computed(() => connected.value && walletPublicKey.value && !token.value)
const showWithdrawButton = computed(() => Boolean(localSelectedVault.value) && isWalletMode.value)

const withdrawVault = async () => {
  if (!localSelectedVault.value || !isWalletMode.value) return
  isWithdrawing.value = true
  try {
    // Use SDK wrapper (withdraws full balance)
    const deployments = await nosana.value.deployments.list()
    const match = deployments.find((d: any) => d?.vault?.publicKey?.toString?.() === localSelectedVault.value)
    if (!match) {
      throw new Error('No linked deployment found for this vault')
    }
    await (match as any).vault.withdraw()
    toast.success('Vault withdrawn to your wallet')
    await fetchBalances()
  } catch (e: any) {
    const msg = e?.data?.message || e?.data?.error || e?.message || 'Withdraw failed'
    toast.error(msg)
  } finally {
    isWithdrawing.value = false
  }
}

const fetchBalances = async () => {
  const address = localSelectedVault.value
  if (!address) return
  loadingBalance.value = true
  try {
    const lamports = await nosana.value.solana.getSolBalance(address)
    solBalance.value = (lamports || 0) / 1e9
    const nos = await nosana.value.solana.getNosBalance(address)
    nosBalance.value = (nos?.uiAmount as number) || 0
    vaultBalanceMap.value[address] = {
      SOL: solBalance.value || 0,
      NOS: nosBalance.value || 0,
    }
  } catch (e) {
    // ignore
  } finally {
    loadingBalance.value = false
  }
}

const fetchAllBalances = async () => {
  if (!props.vaults?.length) return
  for (const v of props.vaults) {
    try {
      const lamports = await nosana.value.solana.getSolBalance(v.public_key)
      const nos = await nosana.value.solana.getNosBalance(v.public_key)
      vaultBalanceMap.value[v.public_key] = {
        SOL: (lamports || 0) / 1e9,
        NOS: (nos?.uiAmount as number) || 0,
      }
    } catch (e) {
      // ignore per-vault
    }
  }
}


watch(() => props.isActive, (isActive) => {
  if (isActive) {
    if (localSelectedVault.value) fetchBalances()
    fetchAllBalances()
  }
})

const formatOptionBalance = (pubkey: string, fallbackSol?: number, fallbackNos?: number) => {
  const b = vaultBalanceMap.value[pubkey] || { SOL: fallbackSol || 0, NOS: fallbackNos || 0 }
  return `${b.SOL.toFixed(3)} SOL • ${b.NOS.toFixed(3)} NOS`
}

const topupBoth = async () => {
  if (!localSelectedVault.value) {
    toast.error('Select a vault first')
    return
  }
  const solNum = parseFloat(solAmount.value || '0')
  const nosNum = parseFloat(nosAmount.value || '0')
  if ((!solNum || solNum <= 0) && (!nosNum || nosNum <= 0)) {
    toast.error('Enter an amount in SOL and/or NOS')
    return
  }
  if (!walletPublicKey.value) {
    toast.error('Connect wallet')
    return
  }
  isToppingUp.value = true
  try {
    const connection = nosana.value.solana.connection!
    const owner = new PublicKey(walletPublicKey.value.toString())
    const dest = new PublicKey(localSelectedVault.value)
    const tx = new Transaction()

    // Add SOL transfer if needed
    if (solNum && solNum > 0) {
      const lamports = Math.round(solNum * 1e9)
      tx.add(SystemProgram.transfer({ fromPubkey: owner, toPubkey: dest, lamports }))
    }

    // Add NOS transfer if needed
    if (nosNum && nosNum > 0) {
      const mint = new PublicKey(nosana.value.solana.config.nos_address)
      const srcAta = await getAssociatedTokenAddress(mint, owner)
      const dstAta = await getAssociatedTokenAddress(mint, dest)
      // ensure destination ATA exists
      try {
        await getAccount(connection, dstAta)
      } catch {
        tx.add(createAssociatedTokenAccountInstruction(owner, dstAta, dest, mint))
      }
      const supply = await connection.getTokenSupply(mint)
      const decimals = supply.value.decimals || 9
      const rawAmount = BigInt(Math.round(nosNum * Math.pow(10, decimals)))
      tx.add(createTransferInstruction(srcAta, dstAta, owner, Number(rawAmount) as any))
    }

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
    tx.recentBlockhash = blockhash
    tx.feePayer = owner
    const sig = await sendTransaction(tx, connection)
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
    toast.success('Top up successful')
    solAmount.value = ''
    nosAmount.value = ''
    await fetchBalances()
  } catch (e: any) {
    toast.error(e?.message || 'Top up failed')
  } finally {
    isToppingUp.value = false
  }
}

// Max helpers
const setMaxSolFromVault = () => { if (typeof solBalance.value === 'number') solAmount.value = (solBalance.value || 0).toFixed(6) }
const setMaxNosFromVault = () => { if (typeof nosBalance.value === 'number') nosAmount.value = (nosBalance.value || 0).toFixed(6) }
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