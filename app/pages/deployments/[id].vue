<template>
  <div>
    <NuxtPage v-if="$route.params.jobaddress" />
    <template v-else>
      <TopBar
        title="Deployment Overview"
        subtitle="Find information about and manage your deployment here."
      />

      <Loader v-if="loading" />
      <div v-else-if="error" class="box">
        <div class="notification is-danger">
          <p>{{ error }}</p>
        </div>
      </div>

      <div v-else-if="deployment">
        <!-- Unified Card -->
        <div class="box is-borderless">
          <!-- Header Section -->
          <DeploymentHeader
            :deployment="deployment"
            :activeTab="activeTab"
            :availableTabs="availableTabs"
            :actionLoading="actionLoading"
            :canStart="canStart"
            :canStop="canStop"
            :canArchive="canArchive"
            :hasAnyActions="hasAnyActions"
            :hasVault="hasVault"
            :deploymentVault="deploymentVault"
            @switchTab="switchTab"
            @action="switchAction"
            @navigateBack="router.push('/deployments')"
          />

          <!-- Tab Content -->
          <div class="p-5">
            <!-- Overview Tab -->
            <div v-if="activeTab === 'overview'">
              <DeploymentErrorBanner
                :hasErrorInLastEvent="hasErrorInLastEvent"
                @viewEvents="switchTab('events')"
              />

              <DeploymentEndpoints
                :endpoints="deploymentEndpoints"
                :isActiveOrStarting="
                  deployment.status === 'RUNNING' ||
                  deployment.status === 'STARTING'
                "
              />

              <DeploymentJobActivity
                :deploymentId="deployment.id"
                :deploymentStatus="deployment.status"
                :activeJobs="activeJobs"
                :allHistoricalJobs="allHistoricalJobs"
                :historicalJobs="historicalJobs"
                :historicalJobsTotalPages="historicalJobsTotalPages"
                :historicalJobsPage="historicalJobsPage"
                :totalJobs="totalJobs"
                :jobActivityTab="jobActivityTab"
                :getJobStateNumber="getJobStateNumber"
                :getJobDuration="getJobDuration"
                @update:jobActivityTab="jobActivityTab = $event"
                @update:historicalJobsPage="historicalJobsPage = $event"
              />

              <DeploymentDetails
                :deployment="deployment"
                :hasVault="hasVault"
                :deploymentVault="deploymentVault"
                :deploymentSchedule="deploymentSchedule"
                :testgridMarkets="testgridMarkets || []"
              />
            </div>

            <!-- Events Tab -->
            <div v-if="activeTab === 'events'">
              <DeploymentUpcomingTasks
                :tasks="tasks"
                :tasksLoading="tasksLoading"
                @refresh="loadTasks()"
              />

              <DeploymentEventHistory :events="deploymentEvents" />
            </div>

            <!-- Logs Tab -->
            <div v-if="activeTab === 'logs'">
              <DeploymentJobLogs
                :deploymentId="deployment.id"
                :allJobsForLogs="allJobsForLogs"
                :allJobs="allJobs"
                :logsJobsPage="logsJobsPage"
                :logsJobsTotalPages="logsJobsTotalPages"
                :activeLogsJobId="activeLogsJobId"
                :completedJobResults="completedJobResults"
                :loadingJobResults="loadingJobResults"
                :getJobStateNumber="getJobStateNumber"
                :isActiveJob="isActiveJob"
                :isCompletedJob="isCompletedJob"
                :getJobData="getJobData"
                @update:logsJobsPage="logsJobsPage = $event"
                @selectJob="selectJobForLogs($event, true)"
              />
            </div>

            <!-- Configuration Tab -->
            <div v-if="activeTab === 'configuration'">
              <DeploymentJobDefinitionEditor
                ref="jobDefEditorComponent"
                :jobDefinitionModel="jobDefinitionModel"
                :loadingJobDefinition="loadingJobDefinition"
                :hasDefinitionChanged="hasDefinitionChanged"
                @update:jobDefinitionModel="jobDefinitionModel = $event"
                @reset="resetDefinition"
                @makeRevision="makeRevision"
              />

              <DeploymentRevisions
                :revisions="sortedRevisions"
                :activeRevision="deployment.active_revision"
                :switchingRevision="switchingRevision"
                :actionLoading="actionLoading"
                @switchToRevision="switchToRevision"
                @viewRevision="viewRevisionDefinition"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Modals -->
      <template v-if="deployment">
        <DeploymentReplicasModal
          v-model="showReplicasModal"
          v-model:replicaCount="newReplicaCount"
          :currentReplicas="deployment.replicas"
          :actionLoading="actionLoading"
          @confirm="updateReplicas()"
        />

        <DeploymentTimeoutModal
          v-model="showTimeoutModal"
          v-model:timeoutHours="newTimeoutHours"
          :currentTimeoutDisplay="(deployment.timeout / 60).toFixed(2)"
          :actionLoading="actionLoading"
          @confirm="updateJobTimeout()"
        />

        <DeploymentScheduleModal
          v-model="showScheduleModal"
          v-model:schedule="newSchedule"
          :currentSchedule="deploymentSchedule"
          :actionLoading="actionLoading"
          :isValidCronExpression="isValidCronExpression"
          @confirm="updateSchedule()"
        />

        <DeploymentRevisionModal
          v-model="showRevisionModal"
          v-model:definition="revisionJobDefinition"
          ref="revisionModalComponent"
          :actionLoading="actionLoading"
          @confirm="createRevision(canSaveRevision)"
        />

        <DeploymentRevisionViewModal
          v-model="showRevisionDefinitionModal"
          :revision="viewingRevision"
        />
      </template>
    </template>
  </div>
  <VaultModal />
</template>

<script setup lang="ts">
import type { JobDefinition } from "@nosana/kit";
import { useVaultModal } from "~/composables/useVaultModal";
import { updateVaultBalance } from "~/composables/useDeploymentVault";
import { useWallet } from "@nosana/solana-vue";
import { useSuperTokens } from "~/composables/useSuperTokens";
import { useDeploymentDetail } from "~/composables/useDeploymentDetail";
import { useDeploymentJobs } from "~/composables/useDeploymentJobs";
import { useDeploymentActions } from "~/composables/useDeploymentActions";
import { useDeploymentPolling } from "~/composables/useDeploymentPolling";
import { useDeploymentJobDefinition } from "~/composables/useDeploymentJobDefinition";
import VaultModal from "~/components/Vault/Modal/VaultModal.vue";

// --- Auth setup ---
const route = useRoute();
const router = useRouter();
const { open: openVaultModal, state: vaultModalState } = useVaultModal();
const { isAuthenticated: superTokensAuth } = useSuperTokens();
const { connected, account } = useWallet();

const isAuthenticated = computed(() => superTokensAuth.value);
const isWalletMode = computed(
  () => connected.value && account.value?.address && !superTokensAuth.value,
);
const hasAnyAuth = computed(() => isAuthenticated.value || isWalletMode.value);

// --- Tab state ---
const activeTab = ref("overview");
const availableTabs = computed(() => {
  return ["overview", "logs", "events", "configuration"];
});

// Initialize activeTab from URL query parameter
const initialTab = route.query.tab?.toString();
if (
  initialTab &&
  ["overview", "logs", "events", "configuration"].includes(initialTab)
) {
  activeTab.value = initialTab;
}

// --- Composables ---
const detail = useDeploymentDetail({
  hasAnyAuth,
  isWalletMode,
  activeTab,
});

const {
  deployment,
  loading,
  error,
  deploymentJobs,
  deploymentEventsData,
  deploymentRevisions,
  tasks,
  tasksLoading,
  jobStates,
  allJobsData,
  jobStateStringToNumber,
  deploymentStatus,
  hasVault,
  deploymentVault,
  deploymentSchedule,
  hasActiveJobs,
  loadDeployment,
  loadJobs,
  loadEvents,
  loadTasks,
} = detail;

const jobs = useDeploymentJobs({
  deployment,
  deploymentJobs,
  deploymentEventsData,
  jobStates,
  allJobsData,
  jobStateStringToNumber,
});

const {
  historicalJobsPage,
  logsJobsPage,
  activeLogsJobId,
  userSelectedJob,
  jobActivityTab,
  completedJobResults,
  loadingJobResults,
  getJobDuration,
  getJobStateNumber,
  activeJobs,
  allHistoricalJobs,
  historicalJobs,
  historicalJobsTotalPages,
  totalJobs,
  allJobsForLogs,
  allJobs,
  logsJobsTotalPages,
  isActiveJob,
  isCompletedJob,
  getJobData,
  selectJobForLogs,
  deploymentEndpoints,
  deploymentEvents,
  hasErrorInLastEvent,
} = jobs;

const polling = useDeploymentPolling({
  deployment,
  activeTab,
  hasActiveJobs,
  loadDeployment,
  loadJobs,
  loadEvents,
  loadTasks,
});

const {
  pollingTimeout,
  stopAllPolling,
  startUnifiedPolling,
  startFastPolling,
  stopJobPolling,
} = polling;

const actions = useDeploymentActions({
  deployment,
  hasAnyAuth,
  isWalletMode,
  deploymentStatus,
  hasActiveJobs,
  loadDeployment,
  startFastPolling,
  stopJobPolling,
});

const {
  actionLoading,
  showReplicasModal,
  showTimeoutModal,
  showScheduleModal,
  showRevisionModal,
  showRevisionDefinitionModal,
  newReplicaCount,
  newTimeoutHours,
  newSchedule,
  revisionJobDefinition,
  switchingRevision,
  viewingRevision,
  canStart,
  canStop,
  canArchive,
  hasAnyActions,
  startDeployment,
  stopDeployment,
  archiveDeployment,
  updateReplicas,
  updateJobTimeout,
  updateSchedule,
  createRevision,
  switchToRevision,
  viewRevisionDefinition,
  isValidCronExpression,
} = actions;

const jobDef = useDeploymentJobDefinition({
  deployment,
  deploymentRevisions,
  actionLoading,
  loadDeployment,
});

const {
  jobDefinitionModel,
  loadingJobDefinition,
  canSaveRevision,
  loadJobDefinition,
  hasDefinitionChanged,
  resetDefinition,
  makeRevision,
} = jobDef;

// Wire up the circular dependency: loadDeployment needs loadJobDefinition
detail.setLoadJobDefinition(loadJobDefinition);

// --- Remaining page-level state ---
const { data: testgridMarkets } = useAPI("/api/markets", { default: () => [] });

// Component refs for editor validation wiring
const jobDefEditorComponent = ref<any>(null);
const revisionModalComponent = ref<any>(null);

// Wire editor refs from child components to job definition composable
watch(
  () => jobDefEditorComponent.value?.editorRef,
  (editorRef: any) => {
    if (editorRef) {
      jobDef.currentJobDefEditor.value = editorRef;
    }
  },
);

watch(
  () => revisionModalComponent.value?.editorRef,
  (editorRef: any) => {
    if (editorRef) {
      jobDef.revisionJobDefEditor.value = editorRef;
    }
  },
);

// Available actions for URL-based modal opening
const availableActions = [
  "create-revision",
  "update-replicas",
  "update-timeout",
  "update-schedule",
  "topup",
  "withdraw",
];

// Initialize action from URL query parameter
const initialAction = route.query.action?.toString();
if (initialAction && availableActions.includes(initialAction)) {
  if (initialAction === "create-revision") showRevisionModal.value = true;
  else if (initialAction === "update-replicas") showReplicasModal.value = true;
  else if (initialAction === "update-timeout") showTimeoutModal.value = true;
  else if (initialAction === "update-schedule") showScheduleModal.value = true;
}

// --- Formatters ---
const sortedRevisions = computed(() => {
  return deploymentRevisions.value || [];
});

// --- Auto-start DRAFT deployments ---
const autostartTriggered = ref(false);
watch(
  () => deployment.value?.status,
  async (status) => {
    if (
      status === "DRAFT" &&
      !autostartTriggered.value &&
      hasAnyAuth.value &&
      !actionLoading.value &&
      !isWalletMode.value
    ) {
      autostartTriggered.value = true;
      try {
        await startDeployment();
      } catch (e) {
        // ignore; actions already handle toasts
      }
    }
  },
  { immediate: true },
);

// --- Auth timeout cleanup ---
let authTimeout: NodeJS.Timeout | null = null;

onUnmounted(() => {
  if (authTimeout) {
    clearTimeout(authTimeout);
    authTimeout = null;
  }
});

onBeforeRouteLeave(() => {
  stopAllPolling();
});

// --- Watchers ---

// Auto-select most recently posted job for logs display
watch(
  () => [activeTab.value, allJobs.value],
  async ([newTab, jobsList]) => {
    if (
      newTab === "logs" &&
      jobsList &&
      Array.isArray(jobsList) &&
      jobsList.length > 0
    ) {
      if (!userSelectedJob.value) {
        if (
          !activeLogsJobId.value ||
          !jobsList.some((j) => j.job === activeLogsJobId.value)
        ) {
          const sorted = [...jobsList].sort((a, b) => {
            const aTime = (a as any).created_at
              ? new Date((a as any).created_at).getTime()
              : 0;
            const bTime = (b as any).created_at
              ? new Date((b as any).created_at).getTime()
              : 0;
            return bTime - aTime;
          });
          const mostRecent = sorted[0];
          if (mostRecent) {
            await selectJobForLogs(mostRecent);
          }
        }
      }
    }
  },
  { immediate: true },
);

// Debounced authentication watcher
watch(
  hasAnyAuth,
  (authed) => {
    if (authTimeout) {
      clearTimeout(authTimeout);
    }

    if (authed) {
      if (
        error.value === "Please log in or connect wallet to view deployments"
      ) {
        error.value = null;
      }
      if (!deployment.value) {
        loadDeployment();
      }
      return;
    }

    authTimeout = setTimeout(() => {
      if (!hasAnyAuth.value) {
        if (!deployment.value) {
          error.value = "Please log in or connect wallet to view deployments";
        }
      }
    }, 2000);
  },
  { immediate: true },
);

// Watch deployment status to manage polling
const prevDeploymentStatus = ref<string | null>(null);

watch(
  () => deployment.value?.status,
  (newStatus) => {
    if (!newStatus) return;

    const status = newStatus.toUpperCase();
    const prev = prevDeploymentStatus.value;

    if (status === "RUNNING" && prev !== "RUNNING") {
      const expectedStatus =
        prev && prev !== "STARTING" && prev !== "RUNNING"
          ? "RUNNING"
          : undefined;
      startFastPolling(expectedStatus);
    } else if (
      (status === "STARTING" || status === "RUNNING") &&
      !pollingTimeout.value
    ) {
      startUnifiedPolling();
    }

    if (
      ["STOPPED", "ARCHIVED", "ERROR"].includes(status) &&
      !hasActiveJobs.value
    ) {
      stopAllPolling();
    }

    prevDeploymentStatus.value = status;
  },
  { immediate: true },
);

// --- Tab & action URL sync ---
const switchTab = (tab: string) => {
  activeTab.value = tab;
  if (tab === "logs") {
    logsJobsPage.value = 1;
  }
  if (tab === "events") {
    loadEvents(true);
    loadTasks(true);
  }
  router.replace({
    query: {
      ...route.query,
      tab: tab === "overview" ? undefined : tab,
    },
  });
};

const switchAction = (action: string) => {
  if (action === "start") {
    startDeployment();
    return;
  }
  if (action === "stop") {
    stopDeployment();
    return;
  }
  if (action === "archive") {
    archiveDeployment();
    return;
  }
  if (action === "create-revision") showRevisionModal.value = true;
  else if (action === "update-replicas") showReplicasModal.value = true;
  else if (action === "update-timeout") showTimeoutModal.value = true;
  else if (action === "update-schedule") showScheduleModal.value = true;
  else if (action === "topup" && deploymentVault.value) {
    openVaultModal(deploymentVault.value, "topup", () =>
      updateVaultBalance(deploymentVault.value!),
    );
  } else if (action === "withdraw" && deploymentVault.value) {
    openVaultModal(deploymentVault.value, "withdraw", () =>
      updateVaultBalance(deploymentVault.value!),
    );
  }

  router.replace({
    query: {
      ...route.query,
      action,
    },
  });
};

const clearAction = () => {
  if (route.query.action) {
    const { action, ...query } = route.query;
    router.replace({ query });
  }
};

// --- Modal watchers ---
watch(
  [() => showRevisionModal.value, () => jobDefinitionModel.value],
  ([isOpen, definition]) => {
    if (isOpen && definition && !revisionJobDefinition.value) {
      revisionJobDefinition.value = JSON.parse(JSON.stringify(definition));
    }
    if (!isOpen) {
      revisionJobDefinition.value = null;
      if (route.query.action === "create-revision") {
        clearAction();
      }
    }
  },
);

watch(showReplicasModal, (isOpen) => {
  if (!isOpen && route.query.action === "update-replicas") clearAction();
});

watch(showTimeoutModal, (isOpen) => {
  if (!isOpen && route.query.action === "update-timeout") clearAction();
});

watch(showScheduleModal, (isOpen) => {
  if (!isOpen && route.query.action === "update-schedule") clearAction();
});

watch(
  deploymentVault,
  (vault) => {
    const action = route.query.action?.toString();
    if (
      vault &&
      (action === "topup" || action === "withdraw") &&
      !vaultModalState.value.modalType
    ) {
      openVaultModal(vault, action, () => updateVaultBalance(vault));
    }
  },
  { immediate: true },
);

watch(
  () => vaultModalState.value.modalType,
  (modalType) => {
    if (
      !modalType &&
      (route.query.action === "topup" || route.query.action === "withdraw")
    ) {
      clearAction();
    }
  },
);

// Head
useHead({
  title: computed(() =>
    deployment.value
      ? `${deployment.value.name} - Deployment`
      : "Loading Deployment",
  ),
});
</script>

<style lang="scss" scoped></style>
