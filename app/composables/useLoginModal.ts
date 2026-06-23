export type LoginMode = 'both' | 'google' | 'wallet';

interface LoginModalState {
  isOpen: boolean;
  mode: LoginMode;
  redirectPath?: string;
}

let onSuccessCb: (() => void) | null = null;

export function useLoginModal() {
  const modalState = useState<LoginModalState>('loginModal', () => ({
    isOpen: false,
    mode: 'both',
    redirectPath: undefined,
  }));

  const openModal = (
    mode: LoginMode = 'both',
    redirectPath?: string,
    onSuccess?: () => void,
  ) => {
    onSuccessCb = onSuccess ?? null;
    modalState.value = {
      isOpen: true,
      mode,
      redirectPath,
    };
  };

  const closeModal = () => {
    modalState.value = { ...modalState.value, isOpen: false };
    onSuccessCb = null;
  };

  const openGoogleModal = (redirectPath?: string, onSuccess?: () => void) => {
    openModal('google', redirectPath, onSuccess);
  };

  const openWalletModal = (redirectPath?: string, onSuccess?: () => void) => {
    openModal('wallet', redirectPath, onSuccess);
  };

  const openBothModal = (redirectPath?: string, onSuccess?: () => void) => {
    openModal('both', redirectPath, onSuccess);
  };

  const notifySuccess = () => {
    const cb = onSuccessCb;
    closeModal();
    cb?.();
  };

  return {
    modalState: readonly(modalState),
    openModal,
    closeModal,
    openGoogleModal,
    openWalletModal,
    openBothModal,
    notifySuccess,
  };
}
