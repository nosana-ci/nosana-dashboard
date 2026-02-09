import { useWallet } from "@nosana/solana-vue";

import { useJob } from "./useJob";
import { useNosPrice } from "./useNosPrice";
import { useModal } from "./useModal";

export function useJobPage(id: string) {
  const { connected, account } = useWallet();
  const { isAuthenticated: superTokensAuth, userData } = useSuperTokens();

  const { job, endpoints, loading, jobInfo } = useJob(id);
  const modal = useModal();
  const nosPrice = useNosPrice();

  // Get the active address - either generated address (for credit users) or wallet address
  const activeAddress = computed(() => {
    if (superTokensAuth.value && userData.value?.generatedAddress) {
      return userData.value.generatedAddress;
    }
    if (connected.value && account.value?.address) {
      return account.value.address;
    }
    return null;
  });

  // Check if user is job poster
  const isJobPoster: ComputedRef<boolean> = computed(() => {
    return activeAddress.value &&
      job.value &&
      activeAddress.value === job.value.project.toString()
      ? true
      : false;
  });

  return {
    job,
    endpoints,
    modal,
    nosPrice,
    isJobPoster,
    loading,
    jobInfo,
  };
}
