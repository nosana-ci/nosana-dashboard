import type { Deployment, Vault } from "@nosana/kit";

import { useVaultModal } from "~/composables/useVaultModal";
import { formatDate } from "~/utils/formatDate";

interface VaultBalance {
  NOS: number;
  SOL: number;
  loading: boolean;
}

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

  const balance = ref<VaultBalance>({ NOS: 0, SOL: 0, loading: false });
  
  // Vault has address property, use it directly
  const vaultAddress = vault.address || '';
  const vaultRef = ref<string>(vaultAddress);
  
  // Handle created_at - access it safely with type assertion for runtime values
  const createdAtValue = (vault as Vault & { created_at?: Date | string }).created_at;
  const createdAtRef = ref<string>(createdAtValue ? formatDate(createdAtValue) : '');

  const updateBalance = async () => {
    if (!vault || typeof vault.getBalance !== 'function') {
      return;
    }
    
    balance.value.loading = true;
    try {
    const balanceData = await vault.getBalance();
    balance.value.NOS = balanceData.NOS;
    balance.value.SOL = balanceData.SOL;
    } catch (error) {
      console.warn('Failed to fetch vault balance:', error);
    } finally {
    balance.value.loading = false;
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