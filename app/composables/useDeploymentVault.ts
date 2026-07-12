import type { Deployment, Vault } from "@nosana/kit";

import { useVaultModal } from "~/composables/useVaultModal";
import { formatDate } from "~/utils/formatDate";

interface VaultBalance {
  NOS: number;
  SOL: number;
  loading: boolean;
}

// Shared balance state keyed by vault address - allows multiple components to share the same balance
const vaultBalances = reactive<Record<string, VaultBalance>>({});

// Get current balance from shared state (no fetch)
export const getVaultBalance = (vault: Vault): { NOS: number; SOL: number } => {
  const address = vault.address || '';
  const balance = vaultBalances[address];
  return balance ? { NOS: balance.NOS, SOL: balance.SOL } : { NOS: 0, SOL: 0 };
};

// Update vault balance directly in shared state (no fetch)
export const setVaultBalance = (vault: Vault, balance: { NOS: number; SOL: number }) => {
  const address = vault.address || '';
  if (!vaultBalances[address]) {
    vaultBalances[address] = { NOS: 0, SOL: 0, loading: false };
  }
  vaultBalances[address].NOS = balance.NOS;
  vaultBalances[address].SOL = balance.SOL;
};

// Exported function to update vault balance from anywhere
// If balance is provided, uses it directly (no fetch). Otherwise fetches from vault.
export const updateVaultBalance = async (vault: Vault, balance?: { NOS: number; SOL: number }) => {
  const address = vault.address || '';
  if (!vaultBalances[address]) {
    vaultBalances[address] = { NOS: 0, SOL: 0, loading: false };
  }
  
  if (balance) {
    // Use provided balance (no fetch needed)
    vaultBalances[address].NOS = balance.NOS;
    vaultBalances[address].SOL = balance.SOL;
    return;
  }
  
  // Fetch balance
  vaultBalances[address].loading = true;
  try {
    const balanceData = await vault.getBalance();
    vaultBalances[address].NOS = balanceData.NOS;
    vaultBalances[address].SOL = balanceData.SOL;
  } catch (error) {
    // Silently fail
  } finally {
    vaultBalances[address].loading = false;
  }
};

export interface UseDeploymentVault {
  vault: Ref<string>;
  created_at: Ref<string>;
  balance: Ref<VaultBalance>;
  topup: () => void;
  withdraw: () => void;
  updateBalance: () => Promise<void>;
}

export function useDeploymentVault(deployment: Deployment): UseDeploymentVault;
export function useDeploymentVault(vault: Vault): UseDeploymentVault;

export function useDeploymentVault(deploymentOrVault: Deployment | Vault): UseDeploymentVault {
  const vault: Vault = "vault" in deploymentOrVault ? deploymentOrVault.vault : deploymentOrVault;

  const { open } = useVaultModal();
  
  // Initialize shared balance for this vault if not exists
  const vaultAddress = vault.address || '';
  if (!vaultBalances[vaultAddress]) {
    vaultBalances[vaultAddress] = { NOS: 0, SOL: 0, loading: false };
  }
  
  // Create a computed ref that reads from shared state - use toRef for proper reactivity
  const balance = toRef(vaultBalances, vaultAddress);
  
  const vaultRef = ref<string>(vaultAddress);
  
  // Handle created_at - access it safely with type assertion for runtime values
  const createdAtValue = (vault as Vault & { created_at?: Date | string }).created_at;
  const createdAtRef = ref<string>(createdAtValue ? formatDate(createdAtValue) : '');

  const updateBalance = async () => {
    if (!vault || typeof vault.getBalance !== 'function') {
      return;
    }
    
    const balanceRef = vaultBalances[vaultAddress];
    if (!balanceRef) return;
    
    balanceRef.loading = true;
    try {
      const balanceData = await vault.getBalance();
      balanceRef.NOS = balanceData.NOS;
      balanceRef.SOL = balanceData.SOL;
    } catch (error) {
      // Silently fail
    } finally {
      balanceRef.loading = false;
    }
  };

  const openTopupModal = () => {
    open(vault, "topup", updateBalance);
  }

  const openWithdrawModal = () => {
    open(vault, "withdraw", updateBalance);
  };

  onMounted(() => {
    updateBalance();
  });


  return {
    balance,
    vault: vaultRef,
    created_at: createdAtRef,
    topup: openTopupModal,
    withdraw: openWithdrawModal,
    updateBalance,
  };
}