import type { Deployment, JobDefinition } from "@nosana/kit";
import { useToast } from "vue-toastification";
import { parseCronExpression } from "~/utils/parseCronExpression";

export interface DeploymentActionsDeps {
  deployment: Ref<Deployment | null>;
  hasAnyAuth: Ref<boolean>;
  isWalletMode: Ref<boolean>;
  deploymentStatus: ComputedRef<string | undefined>;
  hasActiveJobs: ComputedRef<boolean>;
  loadDeployment: (silent?: boolean) => Promise<void>;
  startFastPolling: (expectedStatus?: string) => void;
  stopJobPolling: () => void;
}

export function useDeploymentActions(deps: DeploymentActionsDeps) {
  const router = useRouter();
  const toast = useToast();

  // Action state
  const actionLoading = ref(false);

  // Modal visibility
  const showReplicasModal = ref(false);
  const showTimeoutModal = ref(false);
  const showScheduleModal = ref(false);
  const showRevisionModal = ref(false);
  const showRevisionDefinitionModal = ref(false);

  // Form state
  const newReplicaCount = ref<number | null>(null);
  const newTimeoutHours = ref<number | null>(null);
  const newSchedule = ref("");

  // Revision state
  const revisionJobDefinition = ref<JobDefinition | null>(null);
  const switchingRevision = ref<number | null>(null);
  const viewingRevision = ref<any>(null);

  // Action visibility
  const canStart = computed(() => {
    const status = deps.deploymentStatus.value;
    return status === "DRAFT" || status === "STOPPED" || status === "ERROR";
  });

  const canStop = computed(() => {
    const status = deps.deploymentStatus.value;
    return status === "RUNNING" || status === "STARTING";
  });

  const canArchive = computed(
    () =>
      deps.deploymentStatus.value !== "ARCHIVED" &&
      deps.deploymentStatus.value !== "RUNNING" &&
      deps.deploymentStatus.value !== "STOPPING" &&
      deps.deploymentStatus.value !== "DRAFT",
  );

  const hasAnyActions = computed(() => {
    const status = deps.deploymentStatus.value;
    const hasMainActions = canStart.value || canStop.value || canArchive.value;
    const hasConfigActions = status !== "ARCHIVED";
    return hasMainActions || hasConfigActions;
  });

  // Generic deployment action handler
  const executeDeploymentAction = async (
    action: () => Promise<void>,
    successMessage: string,
    shouldRedirect = false,
  ) => {
    if (!deps.deployment.value || !deps.hasAnyAuth.value) {
      toast.error("Please log in or connect wallet to perform this action");
      return;
    }

    try {
      actionLoading.value = true;
      await action();
      toast.success(successMessage);

      if (shouldRedirect) {
        setTimeout(() => router.push("/deployments"), 2000);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await deps.loadDeployment(true);
      }
    } catch (err: any) {
      console.error("Deployment action error:", err);
      toast.error(`Failed: ${err.message || err.toString()}`);
    } finally {
      if (!shouldRedirect) {
        actionLoading.value = false;
      }
    }
  };

  // Action methods
  const startDeployment = async () => {
    if (!deps.deployment.value) {
      toast.error("Deployment is not loaded yet");
      return;
    }

    // Check vault balance before starting deployment (wallet mode only)
    if (deps.isWalletMode.value && deps.deployment.value.vault) {
      try {
        const vaultBalance = await deps.deployment.value.vault.getBalance();
        const hasSol = vaultBalance.SOL > 0;
        const hasNos = vaultBalance.NOS > 0;

        if (!hasSol && !hasNos) {
          toast.error(
            "Vault has no balance. Please top up your vault with both SOL and NOS before starting the deployment.",
          );
          return;
        } else if (!hasSol) {
          toast.error(
            "Vault needs SOL for transaction fees. Please top up your vault with SOL before starting the deployment.",
          );
          return;
        } else if (!hasNos) {
          toast.error(
            "Vault needs NOS for job costs. Please top up your vault with NOS before starting the deployment.",
          );
          return;
        }
      } catch (error) {
        console.error("Error checking vault balance:", error);
        toast.error("Failed to check vault balance. Please try again.");
        return;
      }
    }

    await executeDeploymentAction(
      () => deps.deployment.value!.start(),
      "Deployment started successfully",
    );

    deps.startFastPolling("RUNNING");
  };

  const stopDeployment = async () => {
    if (!deps.deployment.value) {
      toast.error("Deployment is not loaded yet");
      return;
    }
    await executeDeploymentAction(
      () => deps.deployment.value!.stop(),
      "Deployment stopped successfully",
    );

    await deps.loadDeployment(true);

    if (!deps.hasActiveJobs.value) {
      deps.stopJobPolling();
    }

    deps.startFastPolling("STOPPED");
  };

  const archiveDeployment = async () => {
    if (
      !confirm(
        "Are you sure you want to archive this deployment? This action cannot be undone.",
      )
    ) {
      return;
    }
    if (!deps.deployment.value) {
      toast.error("Deployment is not loaded yet");
      return;
    }
    await executeDeploymentAction(
      () => deps.deployment.value!.archive(),
      "Deployment archived successfully",
      true,
    );
  };

  const withdrawVault = async () => {
    if (!deps.deployment.value) return;
    await executeDeploymentAction(
      () => (deps.deployment.value as any).vault.withdraw(),
      "Vault withdrawn to your wallet",
    );
  };

  const updateReplicas = async () => {
    if (!newReplicaCount.value || newReplicaCount.value < 1) {
      toast.error("Replica count must be at least 1");
      return;
    }

    const currentStatus = deps.deployment.value?.status?.toUpperCase();
    await executeDeploymentAction(
      () =>
        deps.deployment.value!.updateReplicaCount(
          newReplicaCount.value as number,
        ),
      `Replica count updated to ${newReplicaCount.value}`,
    );

    newReplicaCount.value = null;

    if (currentStatus === "RUNNING" || currentStatus === "STARTING") {
      deps.startFastPolling("RUNNING");
    }
  };

  const updateJobTimeout = async () => {
    if (!newTimeoutHours.value || newTimeoutHours.value < 0.0167) {
      toast.error("Timeout must be at least 1 minute (0.0167 hours)");
      return;
    }

    const currentStatus = deps.deployment.value?.status?.toUpperCase();
    await executeDeploymentAction(
      () =>
        deps.deployment.value!.updateTimeout(
          Math.round((newTimeoutHours.value as number) * 3600),
        ),
      `Job timeout updated to ${newTimeoutHours.value} hours`,
    );

    newTimeoutHours.value = null;

    if (currentStatus === "RUNNING" || currentStatus === "STARTING") {
      deps.startFastPolling("RUNNING");
    }
  };

  const updateSchedule = async () => {
    if (!newSchedule.value || !isValidCronExpression(newSchedule.value)) {
      toast.error("Please enter a valid cron expression");
      return;
    }

    if (!deps.deployment.value || !deps.hasAnyAuth.value) {
      toast.error("Please log in or connect wallet to perform this action");
      return;
    }

    const currentStatus = deps.deployment.value?.status?.toUpperCase();
    try {
      actionLoading.value = true;
      await deps.deployment.value.updateSchedule(newSchedule.value);

      toast.success(
        `Schedule updated to: ${newSchedule.value} (${parseCronExpression(newSchedule.value)})`,
      );

      await new Promise((resolve) => setTimeout(resolve, 500));
      await deps.loadDeployment(true);

      if (currentStatus === "RUNNING" || currentStatus === "STARTING") {
        deps.startFastPolling("RUNNING");
      }

      newSchedule.value = "";
    } catch (error: any) {
      console.error("Update schedule error:", error);
      const errorMessage =
        error.data?.message || error.message || "Failed to update schedule";
      toast.error(`Error updating schedule: ${errorMessage}`);
    } finally {
      actionLoading.value = false;
    }
  };

  const createRevision = async (canSaveRevision: (msg: string) => boolean) => {
    if (!revisionJobDefinition.value) {
      toast.error("Please provide a valid job definition");
      return;
    }

    if (
      !canSaveRevision(
        "Cannot create revision: Please fix the errors in the job definition",
      )
    ) {
      return;
    }

    if (!deps.deployment.value || !deps.hasAnyAuth.value) {
      toast.error("Please log in or connect wallet to perform this action");
      return;
    }

    try {
      actionLoading.value = true;
      await deps.deployment.value.createRevision(revisionJobDefinition.value);

      toast.success("New revision created successfully!");
      showRevisionModal.value = false;

      await new Promise((resolve) => setTimeout(resolve, 500));
      await deps.loadDeployment(true);
    } catch (error: any) {
      console.error("Create revision error:", error);
      const errorMessage =
        error.data?.message || error.message || "Failed to create revision";
      toast.error(`Error creating revision: ${errorMessage}`);
    } finally {
      actionLoading.value = false;
    }
  };

  const switchToRevision = async (revisionNumber: number) => {
    if (!deps.deployment.value || !deps.hasAnyAuth.value) {
      toast.error("Please log in or connect wallet to perform this action");
      return;
    }

    try {
      switchingRevision.value = revisionNumber;
      await deps.deployment.value.updateActiveRevision(revisionNumber);

      toast.success(`Switched to revision ${revisionNumber} successfully!`);

      await deps.loadDeployment(true);
    } catch (error: any) {
      console.error("Switch revision error:", error);
      const errorMessage =
        error.data?.message || error.message || "Failed to switch revision";
      toast.error(`Error switching revision: ${errorMessage}`);
    } finally {
      switchingRevision.value = null;
    }
  };

  const viewRevisionDefinition = (revision: any) => {
    viewingRevision.value = revision;
    showRevisionDefinitionModal.value = true;
  };

  // Cron validation
  const isValidCronExpression = (cron: string): boolean => {
    if (!cron) return false;

    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) return false;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      if (part === "*") continue;

      if (part.startsWith("*/")) {
        const stepValue = parseInt(part.slice(2));
        if (isNaN(stepValue) || stepValue <= 0) return false;
        continue;
      }

      if (part.includes("-") || part.includes(",")) continue;

      const num = parseInt(part);
      if (isNaN(num)) return false;

      switch (i) {
        case 0:
          if (num < 0 || num > 59) return false;
          break;
        case 1:
          if (num < 0 || num > 23) return false;
          break;
        case 2:
          if (num < 1 || num > 31) return false;
          break;
        case 3:
          if (num < 1 || num > 12) return false;
          break;
        case 4:
          if (num < 0 || num > 7) return false;
          break;
      }
    }

    return true;
  };

  return {
    // State
    actionLoading,

    // Modal visibility
    showReplicasModal,
    showTimeoutModal,
    showScheduleModal,
    showRevisionModal,
    showRevisionDefinitionModal,

    // Form state
    newReplicaCount,
    newTimeoutHours,
    newSchedule,

    // Revision state
    revisionJobDefinition,
    switchingRevision,
    viewingRevision,

    // Visibility
    canStart,
    canStop,
    canArchive,
    hasAnyActions,

    // Actions
    executeDeploymentAction,
    startDeployment,
    stopDeployment,
    archiveDeployment,
    withdrawVault,
    updateReplicas,
    updateJobTimeout,
    updateSchedule,
    createRevision,
    switchToRevision,
    viewRevisionDefinition,
    isValidCronExpression,
  };
}
