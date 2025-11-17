import type { Vault } from "@nosana/sdk";

interface VaultModalState {
  modalType: null | "topup" | "withdraw";
  vault: Vault | null;
  error: string | null;
  nosAmount: number;
  solAmount: number;
  loading: boolean;
}

const state = ref<VaultModalState>({
  modalType: null,
  vault: null,
  error: null,
  nosAmount: 0,
  solAmount: 0,
  loading: false,
});

export function useVaultModal() {
  const open = (vault: Vault, type: "topup" | "withdraw") => {
    state.value.vault = vault;
    state.value.modalType = type;
    state.value.nosAmount = 0;
    state.value.solAmount = 0;
  };

  const close = () => {
    state.value.vault = null;
    state.value.modalType = null;
    state.value.error = null;
  };


  const topup = async () => {
    if (!state.value.vault || state.value.modalType !== "topup") return;

    try {
      state.value.loading = true;
      await state.value.vault.topup({
        NOS: state.value.nosAmount || undefined,
        SOL: state.value.solAmount || undefined,
      });
      close();
    } catch (error) {
      state.value.error = "Failed to top up vault";
      console.error("Failed to top up vault:", error);
    } finally {
      state.value.loading = false;
    }
  };

  const withdraw = async () => {
    if (!state.value.vault || state.value.modalType !== "withdraw") return;

    try {
      state.value.loading = true;
      await state.value.vault.withdraw();
      close();
    } catch (error) {
      state.value.error = "Failed to withdraw from vault";
      console.error("Failed to withdraw from vault:", error);
    } finally {
      state.value.loading = false;
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
