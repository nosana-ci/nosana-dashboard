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
        <div class="deployment-detail">
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
            @switchTab="switchTab"
            @action="switchAction"
            @rename="updateName"
            @navigateBack="router.push('/deployments')"
          />

          <!-- Tab Content -->
          <div class="p-5">
            <!-- Overview Tab. Kept mounted (v-show) rather than v-if so the
                 per-job system-usage stream in Job activity survives tab
                 switches instead of reconnecting each time. -->
            <div v-show="activeTab === 'overview'" class="tab-pane">
              <DeploymentErrorBanner
                :hasErrorInLastEvent="hasErrorInLastEvent"
                @viewEvents="switchTab('events')"
              />

              <DeploymentDetails
                :deployment="deployment"
                :hasVault="hasVault && isWalletMode"
                :deploymentVault="deploymentVault"
                :deploymentSchedule="deploymentSchedule"
                :testgridMarkets="testgridMarkets || []"
              />

              <div class="overview-cols">
                <div class="ov-main">
                  <DeploymentEndpoints
                    :endpoints="deploymentEndpoints"
                    :activeJobs="deployment.active_jobs ?? 0"
                  />

                  <DeploymentJobActivity
                    :deploymentId="deployment.id"
                    :deploymentStatus="deployment.status"
                    :jobActivityTab="jobActivityTab"
                    :activeJobs="activeJobsPaged"
                    :activeLoading="activeLoading"
                    :activeHasPrev="activeHasPrev"
                    :activeHasNext="activeHasNext"
                    :historyJobs="historyJobs"
                    :historyLoading="historyLoading"
                    :historyHasPrev="historyHasPrev"
                    :historyHasNext="historyHasNext"
                    :getJobStateNumber="getJobStateNumber"
                    :getJobDuration="getJobDuration"
                    @update:jobActivityTab="jobActivityTab = $event"
                    @active:prev="activePrev"
                    @active:next="activeNext"
                    @history:prev="historyPrev"
                    @history:next="historyNext"
                  />
                </div>

                <div class="ov-side">
                  <DeploymentActivitySummary
                    :events="deploymentEvents"
                    :tasks="tasks"
                    @viewAll="switchTab('events')"
                  />
                </div>
              </div>
            </div>

            <!-- Events Tab -->
            <div v-if="activeTab === 'events'" class="tab-pane">
              <DeploymentUpcomingTasks
                :tasks="tasks"
                :tasksLoading="tasksLoading"
                @refresh="loadTasks()"
              />

              <DeploymentEventHistory :events="deploymentEvents" />
            </div>

            <!-- Logs Tab -->
            <div v-if="activeTab === 'logs'">
              <DeploymentLogCollector
                :deploymentId="deployment.id"
                :jobs="deploymentJobs"
                :market="deployment.market"
              />
            </div>

            <!-- Configuration Tab -->
            <div v-if="activeTab === 'configuration'" class="tab-pane">
              <DeploymentJobDefinitionEditor
                ref="jobDefEditorComponent"
                :jobDefinitionModel="jobDefinitionModel"
                :loadingJobDefinition="loadingJobDefinition"
                :hasDefinitionChanged="hasDefinitionChanged"
                @update:jobDefinitionModel="jobDefinitionModel = $event"
                @reset="resetDefinition"
                @makeRevision="makeRevision"
                @createRevision="switchAction('create-revision')"
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
</template>

<script setup lang="ts">
import type { JobDefinition } from "@nosana/kit";
import type { DeploymentEventItem } from "@nosana/api";
import { useWallet } from "@nosana/solana-vue";
import { useSuperTokens } from "~/composables/useSuperTokens";
import { useDeploymentDetail } from "~/composables/useDeploymentDetail";
import { useDeploymentJobs } from "~/composables/useDeploymentJobs";
import { useDeploymentActions } from "~/composables/useDeploymentActions";
import {
  useDeploymentStream,
  type DeploymentStreamEvent,
} from "~/composables/useDeploymentStream";
import { useDeploymentJobDefinition } from "~/composables/useDeploymentJobDefinition";

// --- Auth setup ---
const route = useRoute();
const router = useRouter();
const { isAuthenticated: superTokensAuth, userData } = useSuperTokens();
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
  loadDeployment,
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
  jobActivityTab,
  getJobDuration,
  getJobStateNumber,
  activeJobsPaged,
  activeLoading,
  activeHasPrev,
  activeHasNext,
  activeNext,
  activePrev,
  applyJobFrame,
  applyActiveJobsSnapshot,
  runningJobsCount,
  historyJobs,
  historyLoading,
  historyHasPrev,
  historyHasNext,
  historyNext,
  historyPrev,
  loadHistory,
  deploymentEndpoints,
  deploymentEvents,
  hasErrorInLastEvent,
} = jobs;

const streamUserId = computed(() =>
  superTokensAuth.value
    ? userData.value?.generatedAddress
    : account.value?.address,
);

type EndpointRec = {
  opId: string;
  port: number | string;
  url: string;
  online: boolean;
};

const applyStreamEvent = (event: DeploymentStreamEvent) => {
  if (event.type === "deployment") {
    if (deployment.value) {
      Object.assign(deployment.value, {
        status: event.status,
        replicas: event.replicas,
        active_revision: event.active_revision,
      });
    }
    return;
  }

  if (event.type === "job") {
    // Updates the live active list in place; new jobs render straight from the
    // frame, which carries revision/created_at.
    applyJobFrame(event);
    return;
  }

  // Authoritative active-jobs snapshot, sent once on (re)connect ahead of the
  // per-job frames: prune anything we still show that's no longer active.
  if (event.type === "jobs") {
    applyActiveJobsSnapshot(event.jobs);
    return;
  }

  // Endpoint up/down: the frame carries the full endpoint (opId/port/url/online),
  // so apply it to the record instead of reading the record back.
  if (event.type === "endpoint") {
    if (!deployment.value) return;
    const dep = deployment.value as { endpoints?: EndpointRec[] };
    const list = [...(dep.endpoints ?? [])];
    const idx = list.findIndex(
      (e) => e.opId === event.opId && String(e.port) === String(event.port),
    );
    const next: EndpointRec = {
      opId: event.opId,
      port: event.port,
      url: event.url,
      online: event.online,
    };
    if (idx >= 0) list[idx] = { ...list[idx], ...next };
    else list.push(next);
    dep.endpoints = list;
    return;
  }

  // New event: the frame is the whole record (the list names the event `type`,
  // the frame names it `event`). Prepend it — the list is newest-first — but
  // skip any we already hold, since the stream replays existing events on open.
  if (event.type === "event") {
    if (!deployment.value) return;
    const item = {
      category: event.category,
      deploymentId: deployment.value.id,
      type: event.event,
      message: event.message,
      tx: event.tx ?? undefined,
      created_at: event.created_at,
    } as DeploymentEventItem;
    const exists = deploymentEventsData.value.some((e) =>
      item.tx
        ? (e as { tx?: string }).tx === item.tx
        : e.created_at === item.created_at &&
          e.type === item.type &&
          e.message === item.message,
    );
    if (!exists) {
      deploymentEventsData.value = [item, ...deploymentEventsData.value];
    }
    return;
  }

  // Scheduled task: upsert by id while pending/processing, drop it when done.
  if (event.type === "task") {
    const list = [...((tasks.value ?? []) as Array<{ id?: string }>)];
    const idx = list.findIndex((t) => t.id === event.id);
    if (event.status === "DONE") {
      if (idx >= 0) list.splice(idx, 1);
    } else {
      const item = {
        ...(idx >= 0 ? list[idx] : {}),
        id: event.id,
        task: event.task,
        status: event.status,
        attempts: event.attempts,
        due_at: event.due_at,
        job: event.job,
      };
      if (idx >= 0) list[idx] = item;
      else list.push(item);
    }
    tasks.value = list as typeof tasks.value;
    return;
  }
};

// `active_jobs` (the "up" replica count) is just the number of running jobs —
// keep the record's field synced to that derived count for the replicas display.
watch(runningJobsCount, (n) => {
  if (deployment.value) {
    (deployment.value as { active_jobs?: number }).active_jobs = n;
  }
});

const deploymentStream = useDeploymentStream({
  applyEvent: applyStreamEvent,
  refresh: {
    // The active list is fully stream-driven now (the jobs snapshot prunes and
    // job frames add/update in place), so it's no longer read back. Only two
    // things still need a reconnect refresh: the History tab (server-paginated)
    // and the open job subpage, whose own polling is disabled under the parent.
    jobs: async () => {
      const requests: Promise<unknown>[] = [];
      if (jobActivityTab.value === "history") requests.push(loadHistory());
      const openJob = route.params.jobaddress as string | undefined;
      if (openJob) requests.push(refreshNuxtData(`job-${openJob}`));
      if (requests.length) await Promise.all(requests);
    },
  },
});

const actions = useDeploymentActions({
  deployment,
  hasAnyAuth,
  isWalletMode,
  deploymentStatus,
  loadDeployment,
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
  updateName,
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
const { data: testgridMarkets } = useAPI("/markets", { default: () => [] });

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

// Re-load the parent deployment when returning from a job subroute.
// loadDeployment() intentionally early-returns while on a job subroute, so
// navigating back to the deployment overview (browser back or the in-app back
// button) can leave `deployment` null with loading=false -> blank screen.
// Refetch when the subroute is exited and we don't already have the deployment.
watch(
  () => route.params.jobaddress,
  (jobaddress, prevJobaddress) => {
    if (
      !jobaddress &&
      prevJobaddress &&
      hasAnyAuth.value &&
      !deployment.value
    ) {
      loadDeployment();
    }
  },
);

// --- Auth timeout cleanup ---
let authTimeout: NodeJS.Timeout | null = null;

onUnmounted(() => {
  if (authTimeout) {
    clearTimeout(authTimeout);
    authTimeout = null;
  }
  deploymentStream.stop();
});

onBeforeRouteLeave(() => {
  deploymentStream.stop();
});

// --- Watchers ---

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

watch(
  [() => deployment.value?.id, streamUserId],
  ([deploymentId, userId]) => {
    if (deploymentId && userId && deployment.value) {
      deploymentStream.start(deployment.value);
    } else {
      deploymentStream.stop();
    }
  },
  { immediate: true },
);

// --- Tab & action URL sync ---
const switchTab = (tab: string) => {
  activeTab.value = tab;
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

// Head
useHead({
  title: computed(() =>
    deployment.value
      ? `${deployment.value.name} - Deployment`
      : "Loading Deployment",
  ),
});
</script>

<style lang="scss" scoped>
/* Even, generous spacing between the section cards (overrides the components'
   own bottom margins so gap is the single source of spacing). */
.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
}

.tab-pane > * {
  margin-bottom: 0 !important;
}

/* Overview: endpoints + jobs on the left, the Activity panel alongside. */
.overview-cols {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 1.75rem;
  align-items: start;
}

.ov-main,
.ov-side {
  min-width: 0;
}

/* Sections inside each column space themselves with their own bottom margins;
   drop the trailing one so each column ends flush. */
.ov-main > :deep(:last-child),
.ov-side > :deep(:last-child) {
  margin-bottom: 0 !important;
}

/* Two columns only on wider desktops where the left column stays roomy enough
   for the job rows and usage strip; small desktops and laptops stack so job
   activity gets the full width and Activity drops below it. */
@media screen and (max-width: 1365px) {
  .overview-cols {
    grid-template-columns: 1fr;
    gap: 2.25rem;
  }
}

/* A clear soft elevation lifts every section card off the near-white ground. */
.tab-pane :deep(.dep-card),
.tab-pane :deep(.ep-card),
.tab-pane :deep(.da-card),
.tab-pane :deep(.as-card),
.tab-pane :deep(.task-card),
.tab-pane :deep(.event-card),
.tab-pane :deep(.rev-card) {
  box-shadow:
    0 1px 3px rgba($black, 0.06),
    0 14px 38px -6px rgba($black, 0.14);
}

/* Shadows read poorly on a dark ground, so there elevation comes from a
   lighter surface + a crisper hairline instead. */
html.dark-mode .tab-pane :deep(.dep-card),
html.dark-mode .tab-pane :deep(.ep-card),
html.dark-mode .tab-pane :deep(.da-card),
html.dark-mode .tab-pane :deep(.as-card),
html.dark-mode .tab-pane :deep(.task-card),
html.dark-mode .tab-pane :deep(.event-card),
html.dark-mode .tab-pane :deep(.rev-card) {
  border-color: rgba($white, 0.1);
  box-shadow:
    0 1px 3px rgba($black, 0.4),
    0 16px 40px -8px rgba($black, 0.6);
}
</style>
