import { useWallet } from "@nosana/solana-vue";
import { useDeploymentJob } from "~/composables/jobs/useDeploymentJob";
import { useNosPrice } from "~/composables/jobs/useNosPrice";
import { useModal } from "~/composables/jobs/useModal";
import { useDeploymentSshKeys } from "~/composables/useDeploymentSshKeys";

export function useDeploymentJobPage(
  deploymentId: string,
  jobId: string,
  liveState?: () => string | number | undefined,
) {
  const { connected, account } = useWallet();
  const { isAuthenticated: superTokensAuth, userData } = useSuperTokens();

  const { job, endpoints, loading, jobInfo } = useDeploymentJob(
    deploymentId,
    jobId,
    liveState,
  );
  const modal = useModal();
  const nosPrice = useNosPrice();
  const {
    sshPublicKeys,
    loading: sshKeysLoading,
    error: sshKeysError,
  } = useDeploymentSshKeys(
    deploymentId,
    () => connected.value || superTokensAuth.value,
  );

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
        activeAddress.value === job.value.project?.toString(),
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
    sshPublicKeys,
    sshKeysLoading,
    sshKeysError,
  } as const;
}
