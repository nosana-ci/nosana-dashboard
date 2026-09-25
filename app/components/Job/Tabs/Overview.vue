<template>
  <div class="containers">
    <!-- States -->
    <div v-if="loading" class="cc-state has-text-grey">
      <span class="loader"></span>
      <span>Loading operations…</span>
    </div>

    <div v-else-if="error" class="cc-state has-text-danger">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <div
      v-else-if="operations.length === 0"
      class="cc-state has-text-grey"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
      </svg>
      <span>No containers available.</span>
    </div>

    <!-- Groups -->
    <div v-else class="cc-groups">
      <section
        v-for="(groupOps, groupName) in groupedOperations"
        :key="groupName"
        class="cc-group"
      >
        <header class="cc-group-head">
          <!-- A single group is simply "Operations"; several keep their names. -->
          <h2 v-if="isSingleGroup" class="title is-5 mb-0 cc-group-title">
            Operations
          </h2>
          <div v-else class="cc-group-title">
            <span class="cc-group-name">{{ groupName }}</span>
            <span class="cc-group-count"
              >{{ groupOps.length }} operation{{
                groupOps.length !== 1 ? "s" : ""
              }}</span
            >
          </div>

          <div v-if="!isJobCompleted" class="cc-actions" @click.stop>
            <button
              class="button is-small cc-btn"
              @click="stopGroup(groupName)"
              :disabled="
                loadingGroups.has(groupName) ||
                !hasStoppableOpsInGroup(groupOps)
              "
              :class="{ 'is-loading': loadingGroups.has(groupName) }"
              title="Stop all operations in this group"
            >
              <span class="icon is-small"><SquareIcon /></span>
              <span>Stop</span>
            </button>
            <button
              class="button is-small cc-btn"
              @click="restartGroup(groupName)"
              :disabled="
                loadingGroups.has(groupName) ||
                !hasRestartableOpsInGroup(groupOps)
              "
              :class="{ 'is-loading': loadingGroups.has(groupName) }"
              title="Restart all operations in this group"
            >
              <span class="icon is-small"><RefreshIcon /></span>
              <span>Restart</span>
            </button>
          </div>
        </header>

        <div class="cc-ops">
          <article
            v-for="op in groupOps"
            :key="op.id"
            class="cc-op"
            :class="{ 'is-open': isOpOpen(op) }"
          >
            <div
              class="cc-op-head is-flex is-align-items-center"
              @click="toggleOpExpansion(op)"
            >
              <svg
                class="cc-chevron"
                :class="{ 'is-open': isOpOpen(op) }"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
              <div class="cc-op-id">
                <span class="cc-op-name">{{ op.id }}</span>
                <span class="cc-op-image is-family-monospace">{{
                  op.image || "--"
                }}</span>
              </div>
              <span class="cc-op-status">
                <DeploymentStatusPill :status="pillStatus(displayStatus(op))" />
                <span
                  v-if="opExitCode(op.id) !== null"
                  class="chip cc-exit"
                  :class="{ 'is-bad': exitIsBad(op.id) }"
                  >exit {{ opExitCode(op.id) }}</span
                >
              </span>
              <div
                v-if="!isSingleOp && !isJobCompleted"
                class="cc-actions"
                @click.stop
              >
                <button
                  class="button is-small cc-btn"
                  @click="stopOperation(op)"
                  :disabled="!canStop(op.status) || loadingOps.has(op.id)"
                  :class="{ 'is-loading': loadingOps.has(op.id) }"
                  title="Stop operation"
                >
                  <span class="icon is-small"><SquareIcon /></span>
                  <span>Stop</span>
                </button>
                <button
                  class="button is-small cc-btn"
                  @click="restartOperation(op)"
                  :disabled="!canRestart(op.status) || loadingOps.has(op.id)"
                  :class="{ 'is-loading': loadingOps.has(op.id) }"
                  title="Restart operation"
                >
                  <span class="icon is-small"><RefreshIcon /></span>
                  <span>Restart</span>
                </button>
              </div>
            </div>

            <!-- Kept mounted (v-show) so an open shell survives collapsing the card -->
            <div v-show="isOpOpen(op)" class="cc-op-body">
              <!-- Why it ended, when there is more to it than the status -->
              <p
                v-if="opOutcomes.get(op.id)"
                class="cc-outcome"
                :class="`is-${opOutcomes.get(op.id)?.tone}`"
              >
                {{ opOutcomes.get(op.id)?.message }}
              </p>

              <!-- Timing, and the captured results when the job asked for any -->
              <div class="cc-meta">
                <div class="cc-meta-item">
                  <span class="k">Started</span>
                  <span class="v">{{
                    formatTimestamp(getOpState(op.id)?.startTime) || "--"
                  }}</span>
                </div>
                <div class="cc-meta-item">
                  <span class="k">Ended</span>
                  <span class="v">{{
                    formatTimestamp(getOpState(op.id)?.endTime) || "--"
                  }}</span>
                </div>
                <div v-if="hasOpResults(op.id)" class="cc-meta-item">
                  <span class="k">Results</span>
                  <span class="v">
                    <button
                      class="button is-small is-ghost cc-view-btn"
                      @click.stop="openResultsModal(op.id)"
                    >
                      View results
                    </button>
                  </span>
                </div>
              </div>

              <!-- Endpoints -->
              <div
                class="cc-section"
                v-if="op.ports && op.ports.length > 0 && !isJobCompleted"
              >
                <div class="cc-section-title">Endpoints</div>
                <!-- Same row as the deployment page's Endpoints card -->
                <div class="cc-ep-card">
                  <EndpointRow
                    v-for="(portInfo, idx) in op.ports"
                    :key="idx"
                    :name="op.id"
                    :port="portInfo.port"
                    :url="portInfo.url"
                    :status="endpointStatus(op.id, portInfo.port, portInfo.status)"
                  />
                </div>
              </div>

              <!-- Logs (the job panel has a Logs view instead) -->
              <div v-if="showLogs" class="cc-section">
                <div
                  class="cc-section-head is-flex is-align-items-center is-justify-content-space-between"
                >
                  <div class="cc-section-title">Logs</div>
                  <button
                    v-if="getOpLogs(op.id)?.length"
                    class="button is-small cc-icon-btn"
                    @click.stop="openLogModal(op.id)"
                    title="Fullscreen logs"
                  >
                    <span class="icon is-small"><FullscreenIcon /></span>
                  </button>
                </div>
                <FLogViewer
                  v-if="getOpLogs(op.id)?.length"
                  :logs="getOpLogs(op.id)"
                  :isConnecting="false"
                  :progressBars="new Map()"
                  :resourceProgressBars="new Map()"
                  class="cc-logs"
                />
                <p v-else class="cc-empty">No logs available</p>
              </div>

              <!-- Shell into this operation (deployment jobs on a node) -->
              <div
                v-if="deploymentId && node && !isJobCompleted"
                class="cc-section"
              >
                <div class="cc-section-title">Shell</div>
                <JobAccessContent
                  :job-address="jobAddress ?? ''"
                  :node="node"
                  :project-address="projectAddress ?? ''"
                  :job-definition="accessDefinition ?? null"
                  :is-running="!!isRunning"
                  :deployment-id="deploymentId"
                  :operation="op.id"
                  :ssh-public-keys="sshPublicKeys"
                  :ssh-keys-loading="sshKeysLoading"
                  :ssh-keys-error="sshKeysError"
                  :active="!!shellsActive && isOpOpen(op)"
                  :auto-connect="autoOp === op.id"
                  :cvm="isCvmJob"
                />
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>

    <!-- Fullscreen Logs Modal -->
    <FullscreenModal
      :isOpen="logModalOpen"
      :title="`Operation Logs - ${fullscreenOpId || ''}`"
      @close="closeLogModal"
    >
      <FLogViewer
        v-if="fullscreenOpId && getOpLogs(fullscreenOpId)?.length"
        :logs="getOpLogs(fullscreenOpId)"
        :isConnecting="false"
        :fullscreen="true"
        :progressBars="new Map()"
        :resourceProgressBars="new Map()"
        class="fullscreen-viewer"
      />
      <div v-else class="has-text-centered p-4">
        <span class="has-text-grey">No logs available</span>
      </div>
    </FullscreenModal>

    <!-- Job Results Modal -->
    <FullscreenModal
      :isOpen="resultsModalOpen"
      :title="`Job Results - ${resultsOpId || ''}`"
      @close="closeResultsModal"
    >
      <div class="box">
        <div class="content">
          <template v-if="resultsOpId && hasOpResults(resultsOpId)">
            <VueJsonPretty
              :data="getOpResults(resultsOpId)"
              show-icon
              show-line-number
            />
          </template>
          <div v-else class="has-text-centered py-6">
            <span class="has-text-grey">No results available</span>
          </div>
        </div>
      </div>
    </FullscreenModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import FullscreenModal from '~/components/Common/FullscreenModal.vue';
import VueJsonPretty from 'vue-json-pretty';
import FLogViewer from '../FLogViewer.vue';
import 'vue-json-pretty/lib/styles.css';
import DeploymentStatusPill from "~/components/Deployment/DeploymentStatusPill.vue";
import JobAccessContent from "~/components/Job/AccessContent.vue";
import EndpointRow, {
  type EndpointStatus,
} from "~/components/Common/EndpointRow.vue";
import type { JobDefinition } from "@nosana/kit";

// Import icons as components
import SquareIcon from '@/assets/img/icons/square.svg?component';
import RefreshIcon from '@/assets/img/icons/refresh.svg?component';
import FullscreenIcon from '@/assets/img/icons/fullscreen.svg?component';
import { useNodeJobResolver } from '~/composables/jobs/useNodeJobResolver';
import { isCvmMarket } from '~/utils/cvm';

type EndpointStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN';

interface EndpointUrlItem {
  opId?: string;
  opID?: string;
  url: string;
  port: number | string;
  status?: EndpointStatus | string;
}
type EndpointUrls = Record<string, EndpointUrlItem>;
interface EndpointsSection { urls: EndpointUrls }

interface SecretEndpoint {
  opID?: string;
  opId?: string;
  port: number | string;
  url: string;
  status?: EndpointStatus | string;
}
type SecretsGroup = Record<string, SecretEndpoint>;
type SecretsPayload = Record<string, SecretsGroup> & { urlmode?: string };

interface SseOpState {
  operationId: string;
  group?: string;
  status: string;
  startTime?: number;
  endTime?: number;
  exitCode?: number | null;
  results?: unknown;
  logs?: Array<{ log?: string; type?: string } | string>;
  /** Why the operation ended, when it didn't end on its own terms. */
  error?: { event?: string; message?: string; code?: number } | null;
  errors?: unknown[] | null;
  diagnostics?: {
    reason?: {
      hostShutDown?: boolean;
      jobStopped?: boolean;
      jobExpired?: boolean;
      reason?: string;
    } | null;
    state?: { Error?: string; OOMKilled?: boolean; ExitCode?: number } | null;
  } | null;
}

type TaskStatusMap = Record<string, string>;
interface SseOperations {
  all?: TaskStatusMap | null;
  currentGroup?: string;
  currentGroupStatus?: TaskStatusMap | null;
}

interface LocalJobInfo {
  status: string;
  startTime?: number;
  endTime?: number | null;
  secrets?: SecretsPayload;
  errors?: unknown[];
  opStates?: SseOpState[];
  operations?: SseOperations | null;
  endpoints?: EndpointsSection;
  results?: { status?: string; startTime?: number; endTime?: number; opStates?: SseOpState[]; errors?: unknown[] };
}

interface JobLike {
  address: string;
  node?: string | { toString(): string };
  /** The market the job runs on; a CVM market's shell is served inside the VM. */
  market?: unknown;
  isCompleted?: boolean;
  timeEnd?: number;
  results?: {
    opStates?: SseOpState[];
    secrets?: SecretsPayload;
    /** The node's verdict on the run as a whole, e.g. "init error". */
    status?: string;
    errors?: unknown[];
  };
  jobDefinition?: {
    ops?: Array<{
      id: string;
      args?: {
        image?: string;
      };
    }>;
  };
}

type AnyLogEntry = { id: number; content: string; timestamp: number; html?: boolean };

interface Operation {
  id: string;
  name?: string;
  image?: string;
  ports?: Array<{ port: number; url: string; status: string }>;
  status: string;
  group: string;
}

interface Props {
  job: JobLike;
  isJobPoster: boolean;
  opIds?: string[];
  activeLogs?: AnyLogEntry[];
  selectOp?: (opId: string | null) => void;
  logsByOp?: Map<string, AnyLogEntry[]>;
  systemLogsMap?: AnyLogEntry[];
  jobInfo?: LocalJobInfo | null;
  // Per-operation shells (deployment jobs only)
  deploymentId?: string | null;
  jobAddress?: string;
  node?: string;
  projectAddress?: string;
  accessDefinition?: JobDefinition | null;
  isRunning?: boolean;
  sshPublicKeys?: string[];
  sshKeysLoading?: boolean;
  sshKeysError?: string;
  /** False while the tab is mounted but hidden, so no shell opens unseen. */
  shellsActive?: boolean;
  /** Operation whose shell opens on its own; "*" means the first one. */
  autoConnectOp?: string;
  /** Show each operation's log excerpt (off inside the job panel). */
  showLogs?: boolean;
  /** The deployment's endpoint status, matched to a card's port. */
  deploymentEndpoints?: Array<{
    opId: string;
    port: number | string;
    online: boolean;
  }>;
}

const props = withDefaults(defineProps<Props>(), { showLogs: true });

// Has the job ended, whatever the ending was? isCompleted is only set for a
// job that ran to completion — a stopped one reports false — so timeEnd is
// checked alongside it rather than behind it.
const isJobCompleted = computed(() => {
  const job = (props && props.job) ? props.job : null;
  if (job?.isCompleted) return true;
  if (job?.timeEnd) return true;
  const completedStatuses = new Set(['finished', 'success']);
  if (Array.isArray(operations.value) && operations.value.length > 0) {
    const allCompleted = operations.value.every(op => completedStatuses.has(String(op.status).toLowerCase()));
    if (allCompleted) return true;
  }
  return false;
});

const operations = ref<Operation[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const loadingOps = ref(new Set<string>());
const loadingGroups = ref(new Set<string>());
const opOpenOverrides = ref(new Map<string, boolean>());
const clearedAtByOp = ref<Map<string, number>>(new Map());
let pollInterval: NodeJS.Timeout | null = null;

const route = useRoute();
const deploymentId = computed<string | undefined>(() => {
  return route.params?.id as string || undefined;
});
// Operation controls go to the job's node through Kit, signed as the poster or the deployment.
const resolveNodeJob = useNodeJobResolver(props.job.address, deploymentId.value);
const isCvmJob = computed(() => isCvmMarket(props.job?.market));

const jobInfo = computed<LocalJobInfo | null>(() => props.jobInfo ?? null);


// Logs modal per operation
const logModalOpen = ref(false);
const fullscreenOpId = ref<string | null>(null);
const openLogModal = (opId: string) => {
  fullscreenOpId.value = opId;
  logModalOpen.value = true;
};
const closeLogModal = () => {
  logModalOpen.value = false;
  fullscreenOpId.value = null;
};

// Results modal per operation
const resultsModalOpen = ref(false);
const resultsOpId = ref<string | null>(null);
const openResultsModal = (opId: string) => {
  resultsOpId.value = opId;
  resultsModalOpen.value = true;
};
const closeResultsModal = () => {
  resultsModalOpen.value = false;
  resultsOpId.value = null;
};

// Toggle operation expansion. Records an explicit choice, so it also closes
// operations the defaults below would otherwise hold open.
const toggleOpExpansion = (op: { id: string; status?: string | number }) => {
  const next = new Map(opOpenOverrides.value);
  next.set(op.id, !isOpOpen(op));
  opOpenOverrides.value = next;
};

// The operation whose shell opens on its own; its card opens with it.
const autoOp = computed(() =>
  props.autoConnectOp === "*" ? operations.value[0]?.id : props.autoConnectOp,
);
watch(
  [autoOp, () => operations.value.length],
  ([opId]) => {
    if (!opId || !operations.value.some((op) => op.id === opId)) return;
    opOpenOverrides.value = new Map(opOpenOverrides.value).set(opId, true);
  },
  { immediate: true },
);

// Get logs for a specific operation
const getOpLogs = (opId: string) => {
  const clearedAt = clearedAtByOp.value.get(opId) ?? 0;

  // For running jobs, read directly from the logsByOp prop
  if (props.logsByOp && props.logsByOp.has(opId)) {
    const logs = props.logsByOp.get(opId);
    if (logs && logs.length > 0) {
      // Filter by clearedAt timestamp if operation was restarted
      return clearedAt
        ? logs.filter(l => (l?.timestamp ?? 0) >= clearedAt)
        : logs;
    }
  }
  
  // Fall back to completed job results from IPFS/node results
  if (clearedAt) return [];
  
  const jobResults = props.job?.results?.opStates;
  if (jobResults && Array.isArray(jobResults)) {
    const entry = jobResults.find((r) => r.operationId === opId);
    if (entry?.logs && Array.isArray(entry.logs)) {
      return entry.logs.map((logEntry, index: number) => {
        const isString = typeof logEntry === 'string';
        const logText = isString ? (logEntry as string) : ((logEntry as { log?: string }).log ?? '');
        const logType = isString ? 'stdout' : ((logEntry as { type?: string }).type ?? 'stdout');
        return {
          id: index,
          content: logText,
          log: logText,
          timestamp: (entry.startTime ?? 0) + index,
          html: false,
          type: logType
        };
      });
    }
  }
  
  // Fallback to jobInfo.value.results if available
  const results = jobInfo.value?.results?.opStates;
  if (results && Array.isArray(results)) {
    const entry = results.find((r) => r.operationId === opId);
    if (entry?.logs) return entry.logs;
  }

  // Finally, check top-level SSE opStates for logs
  const liveOpStates = jobInfo.value?.opStates;
  if (Array.isArray(liveOpStates)) {
    const entry = liveOpStates.find((r) => r.operationId === opId);
    if (entry?.logs) return entry.logs;
  }
  
  return null;
};

// Get operation state
const getOpState = (opId: string) => {
  // Prefer top-level SSE opStates
  const liveOpStates = jobInfo.value?.opStates;
  if (Array.isArray(liveOpStates)) {
    const state = liveOpStates.find((s) => s.operationId === opId);
    if (state) return state;
  }

  // Then check jobInfo.operations.opStates
  // Note: operations.opStates no longer present in SSE; kept for backward compat if ever provided
  const opStates = (jobInfo.value as unknown as { operations?: { opStates?: SseOpState[] } })?.operations?.opStates;
  if (opStates) {
    const state = opStates.find((state) => state.operationId === opId);
    if (state) return state;
  }
  
  // For completed jobs, use IPFS results. Returned whole: this is the only
  // record that carries why the operation ended.
  const jobResults = props.job?.results?.opStates;
  if (jobResults && Array.isArray(jobResults)) {
    const entry = jobResults.find((r) => r.operationId === opId);
    if (entry) return entry;
  }

  return null;
};

// The container's own exit status, present once an operation has finished.
// 0 is a real code, so callers compare against null rather than falsiness.
const opExitCode = (opId: string): number | null => {
  const code = getOpState(opId)?.exitCode;
  return typeof code === 'number' ? code : null;
};

// Why an operation ended, when it ended for a reason worth reading. Taken in
// the order the node narrows it down: the operation's own error, then what
// Docker said about the container, then the coarse reasons the host gives when
// it tore the whole job down. Being stopped or hitting the timeout is the job
// doing as it was told, so those read as plain notes; the rest are failures.
type OpOutcome = { message: string; tone: 'danger' | 'neutral' };

// The node writes errors as strings in some places and as objects in others.
const messageOf = (entry: unknown): string | null => {
  if (typeof entry === 'string') return entry.trim() || null;
  if (entry && typeof entry === 'object') {
    const shape = entry as { message?: string; event?: string };
    return shape.message?.trim() || shape.event?.trim() || null;
  }
  return null;
};

const readOutcome = (state: SseOpState | null): OpOutcome | null => {
  if (!state) return null;
  const danger = (message: string): OpOutcome => ({ message, tone: 'danger' });

  const error = state.error?.message?.trim();
  if (error) return danger(error);

  const listed = (state.errors ?? [])
    .map(messageOf)
    .filter((entry): entry is string => Boolean(entry));
  if (listed.length) return danger(listed.join('; '));

  const diagnostics = state.diagnostics;
  if (diagnostics?.state?.OOMKilled) {
    return danger('Out of memory — the host killed the container');
  }
  const containerError = diagnostics?.state?.Error?.trim();
  if (containerError) return danger(containerError);

  const reason = diagnostics?.reason;
  const stated = reason?.reason?.trim();
  if (stated) return danger(stated);
  if (reason?.hostShutDown) return danger('The host shut down');
  if (reason?.jobExpired) {
    return { message: 'The job reached its timeout', tone: 'neutral' };
  }
  if (reason?.jobStopped) {
    return { message: 'The job was stopped', tone: 'neutral' };
  }
  return null;
};

// The job's own failure, when the node reported one against the run rather
// than against any one operation. An init error is exactly that shape: the
// container itself ran, the node fell over around it, and the operation record
// was left as the node last wrote it.
const jobFailure = computed<string | null>(() => {
  const results = jobInfo.value?.results ?? props.job?.results ?? null;
  if (!results) return null;
  const status = typeof results.status === 'string' ? results.status.trim() : '';
  const detail = (results.errors ?? [])
    .map(messageOf)
    .filter((entry): entry is string => Boolean(entry))
    .join('; ');
  if (!detail && !/error|fail/i.test(status)) return null;
  const headline = status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
  if (headline && detail) return `${headline}: ${detail}`;
  return detail || headline || null;
});

const opOutcomes = computed(() => {
  const byOp = new Map<string, OpOutcome>();
  for (const op of operations.value) {
    const outcome =
      readOutcome(getOpState(op.id)) ??
      (isJobCompleted.value && jobFailure.value
        ? ({ message: jobFailure.value, tone: 'danger' } as OpOutcome)
        : null);
    if (outcome) byOp.set(op.id, outcome);
  }
  return byOp;
});

// A container that was told to stop exits non-zero by design (137 for a kill),
// so the code only reads as a failure when nothing benign explains it.
const exitIsBad = (opId: string) =>
  opExitCode(opId) !== 0 && opOutcomes.value.get(opId)?.tone !== 'neutral';

const formatTimestamp = (timestamp: number | null | undefined) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// Per-operation results accessors
const getOpResults = (opId: string) => {
  try {
    // Prefer live SSE opStates
    const liveOpStates = jobInfo.value?.opStates;
    if (Array.isArray(liveOpStates)) {
      const entry = liveOpStates.find((r) => r.operationId === opId);
      if (entry?.results && Object.keys(entry.results).length > 0) return entry.results;
    }

    // Fallback to jobInfo.results.opStates
    const infoRes = jobInfo.value?.results?.opStates;
    if (Array.isArray(infoRes)) {
      const entry = infoRes.find((r) => r.operationId === opId);
      if (entry?.results && Object.keys(entry.results).length > 0) return entry.results;
    }

    // Finally, props.job.results.opStates
    const jobRes = props.job?.results?.opStates;
    if (Array.isArray(jobRes)) {
      const entry = jobRes.find((r) => r.operationId === opId);
      if (entry?.results && Object.keys(entry.results).length > 0) return entry.results;
    }
  } catch {}
  return null;
};

const hasOpResults = (opId: string) => {
  const r = getOpResults(opId);
  return r && typeof r === 'object' && Object.keys(r).length > 0;
};

const buildOperations = () => {
  try {
    const ops: Operation[] = [];
    
    // Prefer jobInfo.jobDefinition (fetched from node for confidential jobs), then fall back to REST jobDefinition
    const jobDefinition = jobInfo.value?.jobDefinition || props.job?.jobDefinition || null;
    const endpointsData: EndpointUrls = jobInfo.value?.endpoints?.urls ?? ({} as EndpointUrls);
    
    // Derive operation statuses from jobInfo first, then fall back to completed IPFS results
    let operationStatuses: Record<string, string> = {};
    if (jobInfo.value?.operations?.all) {
      operationStatuses = jobInfo.value.operations.all ?? {};
    } else if (jobInfo.value?.opStates) {
      const liveOpStates = jobInfo.value.opStates;
      for (const opState of liveOpStates) {
        if (opState && opState.operationId) {
          operationStatuses[opState.operationId] = opState.status || 'unknown';
        }
      }
    } else if (props.job?.results?.opStates && Array.isArray(props.job.results.opStates)) {
      for (const opState of props.job.results.opStates) {
        operationStatuses[opState.operationId] = opState.status || 'unknown';
      }
    }
    
    // Create a map of opId to endpoints
    const endpointsByOpId = new Map<string, Array<{ port: number; url: string; status: string }>>();
    const seenEndpointKeys = new Set<string>();
    const addEndpoint = (opId: string | undefined, port: number, url: string, status: string) => {
      if (!opId || !url || Number.isNaN(port)) return;
      const key = `${opId}::${port}::${url}`;
      if (seenEndpointKeys.has(key)) return;
      seenEndpointKeys.add(key);
      if (!endpointsByOpId.has(opId)) {
        endpointsByOpId.set(opId, []);
      }
      endpointsByOpId.get(opId)!.push({ port, url, status });
    };

    // 1) from endpoints.urls (existing)
    for (const [, ep] of Object.entries(endpointsData)) {
      const opIdFromUrls = ep.opId || ep.opID;
      const port = Number(ep.port);
      const url = ep.url;
      const status = (ep.status as string) || 'UNKNOWN';
      addEndpoint(opIdFromUrls, port, url, status);
    }

    // 2) from SSE secrets shape
    const secrets = jobInfo.value?.secrets;
    if (secrets && typeof secrets === 'object') {
      for (const [bucketKey, bucketVal] of Object.entries(secrets as SecretsPayload)) {
        if (bucketKey === 'urlmode') continue; // skip meta
        const group = bucketVal as SecretsGroup;
        if (!group || typeof group !== 'object') continue;
        for (const [, entryVal] of Object.entries(group)) {
          const ep = entryVal as SecretEndpoint;
          if (!ep || typeof ep !== 'object') continue;
          const opId = ep.opID || ep.opId;
          const port = Number(ep.port);
          const url = ep.url;
          const status = (ep.status as string) || 'UNKNOWN';
          addEndpoint(opId, port, url, status);
        }
      }
    }

    // 3) from IPFS results secrets (job.results.secrets)
    const ipfsSecrets = props.job?.results?.secrets;
    if (ipfsSecrets && typeof ipfsSecrets === 'object') {
      for (const [bucketKey, bucketVal] of Object.entries(ipfsSecrets as SecretsPayload)) {
        if (bucketKey === 'urlmode') continue;
        const group = bucketVal as SecretsGroup;
        if (!group || typeof group !== 'object') continue;
        for (const [, entryVal] of Object.entries(group)) {
          const ep = entryVal as SecretEndpoint;
          if (!ep || typeof ep !== 'object') continue;
          const opId = ep.opID || ep.opId;
          const port = Number(ep.port);
          const url = ep.url;
          const status = (ep.status as string) || 'UNKNOWN';
          addEndpoint(opId, port, url, status);
        }
      }
    }
    
    // The definition's container operations come first, so the cards exist
    // before the node's status stream reports on them; SSE state then fills in.
    const opIdsFromDefinition = (jobDefinition?.ops ?? [])
      .filter((opDef) => {
        const type = (opDef as { type?: string }).type;
        return opDef?.id && (type ? type === 'container/run' : Boolean(opDef.args?.image));
      })
      .map((opDef) => opDef.id);
    const liveOpStates = jobInfo.value?.opStates ?? [];
    const opIdsFromStatuses = Object.keys(operationStatuses || {});
    const opIdsFromLive = Array.isArray(liveOpStates)
      ? liveOpStates.map((s) => s?.operationId).filter((v): v is string => Boolean(v))
      : [];
    const opIdsFromEndpoints = Array.from(endpointsByOpId.keys());
    const uniqueOpIds = Array.from(new Set([
      ...opIdsFromDefinition,
      ...opIdsFromStatuses,
      ...opIdsFromLive,
      ...opIdsFromEndpoints,
    ]));

    // Grouping: use group from top-level opStates; fallback to "default" if missing
    const groupByOpId: Record<string, string> = {};
    for (const s of liveOpStates) {
      if (s?.operationId && s?.group) groupByOpId[s.operationId] = s.group;
    }
    // augment with IPFS results groups
    const ipfsOpStates = props.job?.results?.opStates ?? [];
    for (const s of ipfsOpStates) {
      if (s?.operationId && s?.group && !groupByOpId[s.operationId]) {
        groupByOpId[s.operationId] = s.group;
      }
    }

    // Optional image lookup from REST jobDefinition (not from SSE)
    const imageByOpId: Record<string, string> = {};
    if (jobDefinition?.ops && Array.isArray(jobDefinition.ops)) {
      for (const opDef of jobDefinition.ops) {
        if (!opDef?.id) continue;
        imageByOpId[opDef.id] = opDef?.args?.image || '--';
      }
    }

    for (const opId of uniqueOpIds) {
      const status = operationStatuses[opId]
        || (liveOpStates?.find?.((s) => s?.operationId === opId)?.status)
        || 'unknown';
      const groupName = groupByOpId[opId] || 'default';
      const image = imageByOpId[opId] || '--';
      ops.push({
        id: opId,
        name: opId,
        image,
        ports: endpointsByOpId.get(opId) || [],
        status: status,
        group: groupName,
      });
    }
    
    operations.value = ops;
    loading.value = false;
    error.value = null;
  } catch (err) {
    console.error('Error building operations:', err);
    error.value = 'Failed to load operations';
    loading.value = false;
  }
};

// Watch jobInfo and rebuild operations when it changes
watch(jobInfo, () => {
  buildOperations();
}, { immediate: true });

// Rebuild when job results arrive
watch(() => [props.job?.results, props.job?.jobDefinition, props.job?.isCompleted], () => {
  buildOperations();
}, { immediate: true, deep: true });

// Group operations by their group property
const groupedOperations = computed(() => {
  const groups: Record<string, Operation[]> = {};
  
  for (const op of operations.value) {
    const groupName = op.group || 'default';
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(op);
  }
  
  return groups;
});


// Most jobs have one group, which needs no name of its own.
const isSingleGroup = computed(
  () => Object.keys(groupedOperations.value).length === 1,
);

// Container/op status uses the shared status pill (same as the deployment and
// job pages). Container "finished" maps to the pill's "completed", so a
// container that ran to the end gets the same green checkmark a completed job
// does rather than a second word for the same thing.
const pillStatus = (s: unknown) =>
  String(s ?? "").toLowerCase() === "finished" ? "completed" : String(s ?? "");

// A job with a single operation doesn't need per-operation controls.
const isSingleOp = computed(() => operations.value.length === 1);

// Running operations stay expanded (their accordion is always open); other
// operations expand/collapse on click.
const runningOpStates = new Set(["running", "starting", "waiting", "pending", "init"]);
const opIsRunning = (op: { status?: string | number }) =>
  runningOpStates.has(String(op?.status ?? "").toLowerCase());
// The node writes an operation's terminal state when it tears the container
// down. A node that crashes mid-run never gets to, so the last thing it wrote
// stands — "running", indefinitely, on a job that ended hours ago. The job's
// own end is the authority here: nothing is still running inside a job that
// has finished, so a live status that outlived its job is reported as ended.
const opOutlivedJob = (op: { status?: string | number }) =>
  isJobCompleted.value && opIsRunning(op);
const opIsLive = (op: { status?: string | number }) =>
  opIsRunning(op) && !isJobCompleted.value;

// Ended how, though? Failed when something explains it, stopped when nothing
// does — either way not a green pill claiming it is still up.
const displayStatus = (op: { id: string; status: string }) => {
  if (!opOutlivedJob(op)) return op.status;
  return opOutcomes.value.get(op.id)?.tone === 'danger' ? 'failed' : 'stopped';
};

// A lone operation and a genuinely live one open by default — but only by
// default: an explicit toggle wins, so either can still be collapsed.
const isOpOpen = (op: { id: string; status?: string | number }) =>
  opOpenOverrides.value.get(op.id) ?? (isSingleOp.value || opIsLive(op));

// Endpoint status as a colored circle dot (matches the deployment page).
// The deployment's own endpoint status wins, so the card agrees with the
// deployment page; the node's report covers standalone jobs.
const endpointStatus = (
  opId: string,
  port: number | string,
  status?: string,
): EndpointStatus => {
  const known = props.deploymentEndpoints?.find(
    (endpoint) =>
      endpoint.opId === opId && String(endpoint.port) === String(port),
  );
  if (known) {
    if (known.online) return "online";
    return props.isRunning ? "starting" : "inactive";
  }
  const s = String(status ?? "").toUpperCase();
  if (s === "ONLINE") return "online";
  if (s === "STARTING") return "starting";
  return "inactive";
};

// Check if operation can be stopped
const canStop = (status: string) => {
  const stoppableStatuses = ['running', 'starting', 'waiting', 'pending'];
  return stoppableStatuses.includes(status?.toLowerCase());
};

// Check if operation can be restarted
const canRestart = (status: string) => {
  const restartableStatuses = [
    'running', 'starting', 'waiting', 'pending', 'init',
    'stopped', 'failed', 'finished', 'success'
  ];
  return restartableStatuses.includes(status?.toLowerCase());
};

// Stop operation
const stopOperation = async (op: Operation) => {
  loadingOps.value.add(op.id);
  loadingOps.value = new Set(loadingOps.value);
  try {
    await (await resolveNodeJob()).stopOperation(op.group || op.id, op.id);
  } catch (err) {
    console.error('Error stopping operation:', err);
  } finally {
    loadingOps.value.delete(op.id);
    loadingOps.value = new Set(loadingOps.value);
  }
};

// Restart operation
const restartOperation = async (op: Operation) => {
  loadingOps.value.add(op.id);
  loadingOps.value = new Set(loadingOps.value);
  try {
    // Mark the timestamp when we cleared logs for this operation
    // This allows getOpLogs to filter out old logs from before the restart
    clearedAtByOp.value.set(op.id, Date.now());

    await (await resolveNodeJob()).restartOperation(op.group || op.id, op.id);
  } catch (err) {
    console.error('Error restarting operation:', err);
  } finally {
    loadingOps.value.delete(op.id);
    loadingOps.value = new Set(loadingOps.value);
  }
};

const hasStoppableOpsInGroup = (groupOps: Operation[]) => {
  return groupOps.some(op => canStop(op.status));
};

const hasRestartableOpsInGroup = (groupOps: Operation[]) => {
  return groupOps.some(op => canRestart(op.status));
};

// Stop entire group
const stopGroup = async (groupName: string) => {
  loadingGroups.value.add(groupName);
  loadingGroups.value = new Set(loadingGroups.value);
  try {
    await (await resolveNodeJob()).stopGroup(groupName);
  } catch (err) {
    console.error('Error stopping group:', err);
  } finally {
    loadingGroups.value.delete(groupName);
    loadingGroups.value = new Set(loadingGroups.value);
  }
};

// Restart entire group
const restartGroup = async (groupName: string) => {
  loadingGroups.value.add(groupName);
  loadingGroups.value = new Set(loadingGroups.value);
  try {
    // Mark timestamp for all operations in this group to clear their logs
    const groupOps = groupedOperations.value[groupName];
    const timestamp = Date.now();
    for (const op of groupOps) {
      clearedAtByOp.value.set(op.id, timestamp);
    }

    await (await resolveNodeJob()).restartGroup(groupName);
  } catch (err) {
    console.error('Error restarting group:', err);
  } finally {
    loadingGroups.value.delete(groupName);
    loadingGroups.value = new Set(loadingGroups.value);
  }
};
</script>

<style lang="scss" scoped>
@use "sass:color";

.containers {
  display: flex;
  flex-direction: column;
}

/* ---- States (Bulma .loader / text-colour helpers do the heavy lifting) ---- */
.cc-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 3rem 1rem;
  font-size: 0.9rem;

  svg {
    width: 20px;
    height: 20px;
  }

  .loader {
    width: 18px;
    height: 18px;
  }
}

/* ---- Groups ---- */
.cc-groups {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.cc-group-head {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.8rem;
}

.cc-group-title {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  margin-right: auto;
}

.cc-group-name {
  font-family: $title-family;
  font-weight: 600;
  font-size: 1rem;
  color: $text;
  text-transform: capitalize;
}

html.dark-mode .cc-group-name {
  color: $white;
}

.cc-group-count {
  font-size: 0.78rem;
  color: $text-muted;
  white-space: nowrap;
}

/* ---- Operation cards ---- */
.cc-ops {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cc-op {
  @include soft-panel;
}

.cc-op-head {
  gap: 0.85rem;
  padding: 0.8rem 1rem;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: $surface-hover;
  }
}

html.dark-mode .cc-op-head:hover {
  background: rgba($white, 0.04);
}

.cc-chevron {
  width: 15px;
  height: 15px;
  flex: none;
  color: $text-muted;
  transition: transform 0.2s ease;

  &.is-open {
    transform: rotate(90deg);
  }
}

.cc-op-id {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-right: auto;
}

.cc-op-name {
  font-family: $title-family;
  font-weight: 600;
  font-size: 0.92rem;
  color: $text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

html.dark-mode .cc-op-name {
  color: $white;
}

.cc-op-image {
  font-size: 0.75rem;
  color: $text-muted;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cc-op-status {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

/* A non-zero exit reads as a failure even when the operation's status pill
   says the job merely stopped, so it carries the danger tint. $danger is a
   mid-light red picked to sit on a dark ground; on the tinted chip it has to
   come down 25% to clear AA, and go up on the dark one. */
.cc-exit.is-bad {
  background: rgba($danger, 0.12);
  color: color.adjust($danger, $lightness: -25%);
}

html.dark-mode .cc-exit.is-bad {
  background: rgba($danger, 0.2);
  color: color.adjust($danger, $lightness: 8%);
}

/* ---- Action buttons: Bulma .button base + a lighter, rounded skin ---- */
.cc-actions {
  display: inline-flex;
  gap: 0.4rem;
  flex: none;
}

.cc-btn.button {
  font-family: $title-family;
  font-weight: 500;
  border-radius: 8px;
  border-color: $border-soft;

  &:hover:not([disabled]) {
    background-color: $surface-hover;
    border-color: $border-strong;
  }
}

.cc-btn.button .icon svg {
  width: 14px;
  height: 14px;
}

html.dark-mode .cc-btn.button {
  background-color: rgba($white, 0.06);
  border-color: rgba($white, 0.1);
  color: $white;

  &:hover:not([disabled]) {
    background-color: rgba($white, 0.1);
    border-color: rgba($white, 0.2);
  }
}

/* ---- Expanded body ---- */
.cc-op-body {
  padding: 0 1rem 1.1rem;
  border-top: 1px solid $border-soft;
}

html.dark-mode .cc-op-body {
  border-top-color: rgba($white, 0.08);
}

/* Why the operation ended. A quiet note for the endings the job asked for —
   stopped, timed out — and a danger tint for the ones it did not: an OOM kill,
   a Docker error, a host that went away. Sits above the timing band so the
   first thing an expanded card says is what happened to it. */
.cc-outcome {
  margin: 0.9rem 0 0;
  padding: 0.7rem 0.85rem;
  border-radius: 9px;
  font-size: 0.82rem;
  line-height: 1.45;
  overflow-wrap: anywhere;

  &.is-neutral {
    background: $white-ter;
    color: $text-muted;
  }

  &.is-danger {
    background: rgba($danger, 0.1);
    color: color.adjust($danger, $lightness: -25%);
  }
}

html.dark-mode .cc-outcome {
  &.is-neutral {
    background: rgba($white, 0.05);
    color: $grey-light;
  }

  &.is-danger {
    background: rgba($danger, 0.16);
    color: color.adjust($danger, $lightness: 8%);
  }
}

/* Timing band. Built like the deployment card's stat band — same label/value
   pairing, same hairline between cells — at the smaller size this sits at. */
.cc-meta {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  padding: 1.15rem 0 0.35rem;
}

.cc-meta-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  position: relative;
  padding-right: 1rem;
}

/* The first cell keeps the body's own padding so it lines up with the section
   titles below; only the later ones are inset by their divider. */
.cc-meta-item + .cc-meta-item {
  padding-left: 1rem;
}

.cc-meta-item + .cc-meta-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 1px;
  bottom: 1px;
  width: 1px;
  background: $border-soft;
}

html.dark-mode .cc-meta-item + .cc-meta-item::before {
  background: rgba($white, 0.08);
}

.cc-meta-item .k {
  font-size: 0.72rem;
  color: $text-muted;
}

.cc-meta-item .v {
  font-family: $title-family;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: $text;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

html.dark-mode .cc-meta-item .v {
  color: $white;
}

/* The Results cell holds a control where its neighbours hold a value, so the
   button carries the band's metrics and sits on the same baseline. Colour is
   left to Bulma's ghost token, which is contrast-corrected per scheme. */
.cc-view-btn.button {
  height: auto;
  padding: 0;
  border: 0;
  background: none;
  justify-content: flex-start;
  text-decoration: none;
  font-family: $title-family;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.2;

  &:hover {
    text-decoration: underline;
  }
}

@media screen and (max-width: 620px) {
  .cc-meta {
    grid-auto-flow: row;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

/* ---- Sub-sections (endpoints / logs) ---- */
/* Each section already announces itself with an uppercase title, so the rule
   above it was redundant — and with four sections open they stacked into a
   ladder of full-width lines that read as a ledger rather than a panel. Space
   separates them now; the head/body rule is the only one left. */
.cc-section {
  padding-top: 1.35rem;
}

.cc-section-head {
  margin-bottom: 0.6rem;
}

.cc-section-title {
  font-family: $title-family;
  font-weight: 600;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: $text-muted;
  margin-bottom: 0.6rem;
}

.cc-section-head .cc-section-title {
  margin-bottom: 0;
}

.cc-empty {
  background: $white-ter;
  border-radius: 8px;
  padding: 1.1rem;
  margin: 0;
  text-align: center;
  font-size: 0.82rem;
  color: $text-muted;
}

html.dark-mode .cc-empty {
  background: rgba($white, 0.03);
}

/* ---- Endpoints ---- */
/* One of the sections inside an operation body, like Command and Logs, not a
   panel in its own right — it used to carry the full card treatment, which read
   as a card inside a card. The rows draw their own dividers, and the negative
   inset lets them span the body's full width so their text still lines up with
   the section title above. */
.cc-ep-card {
  margin: 0 -1rem;
}

/* ---- Logs ---- */
.cc-icon-btn.button {
  border-radius: 8px;
  border-color: $border-soft;
}

.cc-icon-btn.button .icon svg {
  width: 15px;
  height: 15px;
}

html.dark-mode .cc-icon-btn.button {
  background-color: rgba($white, 0.06);
  border-color: rgba($white, 0.1);
  color: $white;
}

.cc-logs :deep(.log-viewer) {
  height: 320px;
}

/* Keep JSON results background stable (disable VueJsonPretty line highlight) */
:deep(.vjs-tree) {
  background-color: transparent !important;
}
:deep(.vjs-tree *:hover),
:deep(.vjs-tree *:active),
:deep(.vjs-tree *:focus) {
  background-color: transparent !important;
}
:deep(.vjs-tree .vjs-tree__line),
:deep(.vjs-tree .vjs-tree__node) {
  background-color: transparent !important;
  transition: none !important;
}

:deep(.fullscreen-modal-body .fullscreen-viewer) {
  height: 100%;
  min-height: 100%;
  overflow-y: auto;
}
</style>
