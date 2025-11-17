import type { Deployment, Vault } from "@nosana/sdk";

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
  const vaultRef = ref<string>(vault.publicKey.toString());
  const createdAtRef = ref<string>(formatDate(vault.created_at));

  const updateBalance = async () => {
    balance.value.loading = true;
    const balanceData = await vault.getBalance();
    balance.value.NOS = balanceData.NOS;
    balance.value.SOL = balanceData.SOL;
    balance.value.loading = false;
  };

  const openTopupModal = () => {
    open(vault, "topup");
  }

  const openWithdrawModal = () => {
    open(vault, "withdraw");
  };

  onMounted(async () => {
    await updateBalance();
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