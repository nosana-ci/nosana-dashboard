import { useWallet } from "@nosana/solana-vue";
import { useDeploymentJob } from "~/composables/jobs/useDeploymentJob";
import { useNosPrice } from "~/composables/jobs/useNosPrice";
import { useModal } from "~/composables/jobs/useModal";

export function useDeploymentJobPage(deploymentId: string, jobId: string) {
  const { connected, account } = useWallet();
  const { isAuthenticated: superTokensAuth, userData } = useSuperTokens();

  const { job, endpoints, loading, jobInfo } = useDeploymentJob(deploymentId, jobId);
  const modal = useModal();
  const nosPrice = useNosPrice();

  const activeAddress = computed(() => {
    if (superTokensAuth.value && userData.value?.generatedAddress) {
      return userData.value.generatedAddress as string;
    }
    if (connected.value && account.value?.address) {
      return account.value.address;
    }
    return null;
  });

  const isJobPoster: ComputedRef<boolean> = computed(() => {
    return Boolean(
      activeAddress.value &&
      job.value &&
      activeAddress.value === job.value.project?.toString()
    );
  });

  return {
    job,
    endpoints,
    modal,
    nosPrice,
    isJobPoster,
    loading,
    jobInfo,
  } as const;
}


