export function useExtendModal() {
  const extendModal = ref(false);

  const openExtendModal = () => {
    extendModal.value = true;
  };

  const closeExtendModal = () => {
    extendModal.value = false;
  };

  const toggleExtendModal = () => {
    extendModal.value = !extendModal.value;
  };

  return {
    extendModal,
    openExtendModal,
    closeExtendModal,
    toggleExtendModal,
  };
}

export type UseModal = ReturnType<typeof useExtendModal>;
