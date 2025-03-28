import { useWallet } from "solana-wallets-vue";

import { useJob } from "./useJob";
import { useNosPrice } from "./useNosPrice";
import { useExtendModal } from "./useExtendModal";

export function useJobPage(id: string) {
  const { connected, publicKey } = useWallet();

  const { job, endpoints, loading } = useJob(id);
  const modal = useExtendModal();
  const nosPrice = useNosPrice();

  // Check if user is job poster
  const isJobPoster: ComputedRef<boolean> = computed(() => {
    return connected.value &&
      job.value &&
      publicKey.value?.toString() === job.value.project.toString()
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
  };
}
