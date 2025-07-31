import { ref, watch } from 'vue'

// Global state for credit refresh events
const creditRefreshTrigger = ref(0)

export const useCreditRefresh = () => {
  const triggerCreditRefresh = () => {
    creditRefreshTrigger.value++
  }

  const onCreditRefresh = (callback: () => void) => {
    watch(creditRefreshTrigger, () => {
      callback()
    })
  }

  return {
    triggerCreditRefresh,
    onCreditRefresh,
    creditRefreshTrigger
  }
}