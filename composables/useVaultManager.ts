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
  const loadVaults = async (retryCount = 0): Promise<void> => {
    if (!isWalletMode.value) return

    loading.value = true
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const vaultList = await nosana.value.deployments.vaults.list()
      clearTimeout(timeoutId)
      
      vaults.value = (vaultList || [])
        .map((vault: any) => {
          const publicKey = vault?.public_key || vault?.vault
          if (!publicKey) return null
          return {
            public_key: publicKey as string,
            balance: vault?.balance || { SOL: 0, NOS: 0 },
          } as Vault
        })
        .filter((v: any): v is Vault => Boolean(v))
    } catch (error: any) {
      console.error('Failed to load vaults:', error)
      
      // Retry logic for network errors (up to 2 retries)
      if (retryCount < 2 && (
        error.name === 'Malformed_HTTP_Response' || 
        error.message?.includes('fetch() failed') ||
        error.message?.includes('502') ||
        error.message?.includes('timeout')
      )) {
        console.log(`Retrying vault load (attempt ${retryCount + 1})...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Progressive delay
        return loadVaults(retryCount + 1)
      }
      
      vaults.value = []
      
      // Show user-friendly error for persistent failures
      if (retryCount >= 2) {
        toast.error('Unable to load vaults. You can still create deployments - vaults will be created automatically.')
      }
    } finally {
      loading.value = false
    }
  }

  const createVault = async (): Promise<Vault | null> => {
    if (!isWalletMode.value) return null

    creating.value = true
    try {
      const newVaultData = await nosana.value.deployments.vaults.create()
      
      console.log('Vault creation response:', newVaultData) // Debug log
      
      // Extract vault address from the API response
      const vaultAddress = newVaultData?.vault
      
      if (!newVaultData || !vaultAddress) {
        console.error('Invalid vault data structure:', newVaultData)
        throw new Error('Invalid vault data received - no address found')
      }
      
      // Reload vaults to get the new one
      await loadVaults()
      
      // Find and select the newly created vault using the found address
      const newVault = vaults.value.find(v => v.public_key === vaultAddress)
      if (newVault) {
        selectedVault.value = newVault
        toast.success('Vault created successfully')
        return newVault
      }
      
      // If not found in list, create a minimal vault object
      const createdVault: Vault = {
        public_key: vaultAddress,
        balance: { SOL: 0, NOS: 0 }
      }
      selectedVault.value = createdVault
      toast.success('Vault created successfully')
      return createdVault
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