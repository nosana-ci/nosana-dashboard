import { ref } from 'vue';

export type LoginMode = 'both' | 'google' | 'wallet';

interface LoginModalState {
  isOpen: boolean;
  mode: LoginMode;
  redirectPath?: string;
}

const modalState = ref<LoginModalState>({
  isOpen: false,
  mode: 'both',
  redirectPath: undefined
});

export function useLoginModal() {
  const openModal = (mode: LoginMode = 'both', redirectPath?: string) => {
    modalState.value = {
      isOpen: true,
      mode,
      redirectPath: redirectPath
    };
  };

  const closeModal = () => {
    modalState.value.isOpen = false;
  };

  const openGoogleModal = (redirectPath?: string) => {
    openModal('google', redirectPath);
  };

  const openWalletModal = (redirectPath?: string) => {
    openModal('wallet', redirectPath);
  };

  const openBothModal = (redirectPath?: string) => {
    openModal('both', redirectPath);
  };

  return {
    modalState: readonly(modalState),
    openModal,
    closeModal,
    openGoogleModal,
    openWalletModal,
    openBothModal
  };
}