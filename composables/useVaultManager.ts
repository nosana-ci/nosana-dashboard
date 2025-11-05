import { ref, computed, watch, readonly } from 'vue'
import { useSDK } from '~/composables/useSDK'
import { useWallet } from 'solana-wallets-vue'
import { useToast } from 'vue-toastification'

export interface Vault {
  public_key: string
  balance?: {
    SOL: number
    NOS: number
  }
}

export const useVaultManager = () => {
  const { nosana } = useSDK()
  const { connected, publicKey } = useWallet()
  const toast = useToast()
  
  // Auth state - using auto-imported useAuth
  const { status, token } = useAuth()

  // State
  const vaults = ref<Vault[]>([])
  const selectedVault = ref<Vault | null>(null)
  const loading = ref(false)
  const creating = ref(false)

  // Computed
  const isWalletMode = computed(() => {
    return connected.value && publicKey.value && !token.value
  })

  const canManageVaults = computed(() => {
    return isWalletMode.value && !loading.value
  })

  // Methods
  const loadVaults = async (): Promise<void> => {
    if (!isWalletMode.value) return

    loading.value = true
    try {
      const vaultList = await nosana.value.deployments.vaults.list()
      vaults.value = (vaultList || [])
        .filter(vault => vault && vault.public_key) // Filter out invalid vault objects
        .map(vault => ({
          public_key: vault.public_key,
          balance: vault.balance || { SOL: 0, NOS: 0 }
        }))
    } catch (error) {
      console.error('Failed to load vaults:', error)
      vaults.value = []
    } finally {
      loading.value = false
    }
  }

  const createVault = async (): Promise<Vault | null> => {
    if (!isWalletMode.value) return null

    creating.value = true
    try {
      const newVaultData = await nosana.value.deployments.vaults.create()
      
      // Validate vault data
      if (!newVaultData || !newVaultData.public_key) {
        throw new Error('Invalid vault data received')
      }
      
      // Reload vaults to get the new one
      await loadVaults()
      
      // Find and select the newly created vault
      const newVault = vaults.value.find(v => v.public_key === newVaultData.public_key)
      if (newVault) {
        selectedVault.value = newVault
        toast.success('Vault created successfully')
        return newVault
      }
      
      throw new Error('Created vault not found in list')
    } catch (error) {
      console.error('Failed to create vault:', error)
      toast.error('Failed to create vault')
      return null
    } finally {
      creating.value = false
    }
  }

  const selectVault = (vault: Vault): void => {
    selectedVault.value = vault
  }

  const clearSelection = (): void => {
    selectedVault.value = null
  }

  const refreshVaultBalance = async (vault: Vault): Promise<void> => {
    // Note: Direct vault balance checking requires access through deployment
    // For now, we'll keep the default values until we have a deployment context
    try {
      // This would require finding a deployment that uses this vault
      // vault.balance = await deployment.vault.getBalance()
    } catch (error) {
      console.warn('Could not refresh vault balance:', error)
    }
  }

  // Auto-load vaults when wallet mode is detected
  watch(isWalletMode, async (newValue) => {
    if (newValue) {
      await loadVaults()
    } else {
      vaults.value = []
      selectedVault.value = null
    }
  }, { immediate: true })

  return {
    // State
    vaults: readonly(vaults),
    selectedVault: readonly(selectedVault),
    loading: readonly(loading),
    creating: readonly(creating),
    
    // Computed
    isWalletMode,
    canManageVaults,
    
    // Methods
    loadVaults,
    createVault,
    selectVault,
    clearSelection,
    refreshVaultBalance
  }
}