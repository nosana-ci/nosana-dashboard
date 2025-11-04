/**
 * Global composable for managing modal scroll lock
 * Prevents background scrolling when modals are open
 */

const modalStack = ref<string[]>([])

export const useModalScrollLock = () => {
  const lockScroll = (modalId: string) => {
    // Add modal to stack if not already present
    if (!modalStack.value.includes(modalId)) {
      modalStack.value.push(modalId)
    }
    
    // Lock body scroll if this is the first modal
    if (modalStack.value.length === 1) {
      if (process.client) {
        document.body.style.overflow = 'hidden'
      }
    }
  }

  const unlockScroll = (modalId: string) => {
    // Remove modal from stack
    const index = modalStack.value.indexOf(modalId)
    if (index > -1) {
      modalStack.value.splice(index, 1)
    }
    
    // Unlock body scroll if no modals are open
    if (modalStack.value.length === 0) {
      if (process.client) {
        document.body.style.overflow = ''
      }
    }
  }

  const isScrollLocked = computed(() => modalStack.value.length > 0)

  return {
    lockScroll,
    unlockScroll,
    isScrollLocked,
    modalCount: computed(() => modalStack.value.length)
  }
}