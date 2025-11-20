import { useWallet } from "solana-wallets-vue";

import { useJob } from "./useJob";
import { useNosPrice } from "./useNosPrice";
import { useModal } from "./useModal";

export function useJobPage(id: string) {
  const { connected, publicKey } = useWallet();
  const { status, data: userData } = useAuth();

  const { job, endpoints, loading, jobInfo } = useJob(id);
  const modal = useModal();
  const nosPrice = useNosPrice();

  // Get the active address - either generated address (for credit users) or wallet address
  const activeAddress = computed(() => {
    if (status.value === 'authenticated' && userData.value?.generatedAddress) {
      return userData.value.generatedAddress;
    }
    if (connected.value && publicKey.value) {
      return publicKey.value.toString();
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
