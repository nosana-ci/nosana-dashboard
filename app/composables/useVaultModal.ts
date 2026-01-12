import type { Vault } from "@nosana/kit";
import { useKit } from "~/composables/useKit";
import { useNosanaWallet } from "~/composables/useNosanaWallet";
import { getVaultBalance, setVaultBalance } from "~/composables/useDeploymentVault";

interface VaultModalState {
  modalType: null | "topup" | "withdraw";
  vault: Vault | null;
  updateFn: (() => void) | null;
  error: string | null;
  nosAmount: number;
  solAmount: number;
  loading: boolean;
}

const state = ref<VaultModalState>({
  modalType: null,
  vault: null,
  updateFn: null,
  error: null,
  nosAmount: 0,
  solAmount: 0,
  loading: false,
});

export function useVaultModal() {
  const { nosana } = useKit();
  const { refreshAllBalances } = useNosanaWallet();

  const open = (vault: Vault, type: "topup" | "withdraw", updateFn: () => void) => {
    state.value.vault = vault;
    state.value.modalType = type;
    state.value.nosAmount = 0;
    state.value.solAmount = 0;
    state.value.updateFn = updateFn;
  };

  const close = () => {
    state.value.vault = null;
    state.value.modalType = null;
    state.value.error = null;
    state.value.updateFn = null;
  };

  // Poll vault balance until it changes from baseline
  const pollVaultBalance = async (vault: Vault, baseline: { NOS: number; SOL: number }, updateFn: () => void) => {
    const maxAttempts = 20; // 30 seconds max (20 * 1.5s)
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) return;
      attempts++;

      try {
        const current = await vault.getBalance();
        if (current.NOS !== baseline.NOS || current.SOL !== baseline.SOL) {
          // Balance changed - update shared state directly (UI will react automatically)
          setVaultBalance(vault, current);
          return;
        }
      } catch (e) {
        // Ignore errors, keep polling
      }

      // Continue polling
      setTimeout(poll, 1500);
    };

    // Start polling after a short delay
    setTimeout(poll, 1000);
  };

  const topup = async () => {
    if (!state.value.vault || state.value.modalType !== "topup") return;

    const vault = state.value.vault;
    const updateFn = state.value.updateFn || (() => {});

    // Get baseline from shared state (no fetch needed)
    const baseline = getVaultBalance(vault);

    try {
      state.value.loading = true;
      
      if (!nosana.value.wallet) {
        throw new Error("Wallet not connected. Please connect your wallet first.");
      }
      
      await vault.topup({
        NOS: state.value.nosAmount || undefined,
        SOL: state.value.solAmount || undefined,
      });

      // Refresh wallet balance after 1 second
      setTimeout(() => refreshAllBalances(), 1000);

      // Start polling vault balance - will call updateFn when balance changes
      pollVaultBalance(vault, baseline, updateFn);
    } catch (error: any) {
      state.value.error = error.message || "Failed to top up vault";
    } finally {
      state.value.loading = false;
      close();
    }
  };

  const withdraw = async () => {
    if (!state.value.vault || state.value.modalType !== "withdraw") return;

    const vault = state.value.vault;
    const updateFn = state.value.updateFn || (() => {});

    // Get baseline from shared state (no fetch needed)
    const baseline = getVaultBalance(vault);

    try {
      state.value.loading = true;
      
      if (!nosana.value.wallet) {
        throw new Error("Wallet not connected. Please connect your wallet first.");
      }
      
      await vault.withdraw();

      // Refresh wallet balance after 1 second
      setTimeout(() => refreshAllBalances(), 1000);

      // Start polling vault balance - will call updateFn when balance changes
      pollVaultBalance(vault, baseline, updateFn);
    } catch (error: any) {
      state.value.error = error.message || "Failed to withdraw from vault";
    } finally {
      state.value.loading = false;
      close();
    }
  };

  return {
    state: readonly(state),
    open,
    close,
    topup,
    withdraw,
    setNosAmount: (amount: number) => {
      state.value.nosAmount = amount;
    },
    setSolAmount: (amount: number) => {
      state.value.solAmount = amount;
    },
  };
}
