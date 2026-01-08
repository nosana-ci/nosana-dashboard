import type { Vault } from "@nosana/kit";
import { useKit } from "~/composables/useKit";

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

  const topup = async () => {
    if (!state.value.vault || state.value.modalType !== "topup" || !state.value.updateFn) return;

    try {
      state.value.loading = true;
      
      if (!nosana.value.wallet) {
        throw new Error("Wallet not connected. Please connect your wallet first.");
      }
      
      await state.value.vault.topup({
        NOS: state.value.nosAmount || undefined,
        SOL: state.value.solAmount || undefined,
      });
    } catch (error: any) {
      state.value.error = error.message || "Failed to top up vault";
    } finally {
      state.value.loading = false;
      state.value.updateFn();
      close();
    }
  };

  const withdraw = async () => {
    if (!state.value.vault || state.value.modalType !== "withdraw" || !state.value.updateFn) return;

    try {
      state.value.loading = true;
      
      if (!nosana.value.wallet) {
        throw new Error("Wallet not connected. Please connect your wallet first.");
      }
      
      await state.value.vault.withdraw();
    } catch (error: any) {
      state.value.error = error.message || "Failed to withdraw from vault";
    } finally {
      state.value.loading = false;
      state.value.updateFn();
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
