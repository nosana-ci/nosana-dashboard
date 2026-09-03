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
          <button
            type="button"
            class="cc-group-toggle"
            @click="toggleGroupExpansion(groupName)"
          >
            <svg
              class="cc-chevron"
              :class="{ 'is-open': expandedGroups.has(groupName) }"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span class="cc-group-name">{{ groupName }}</span>
            <span class="cc-group-count"
              >{{ groupOps.length }} operation{{
                groupOps.length !== 1 ? "s" : ""
              }}</span
            >
          </button>

          <div class="cc-actions" @click.stop>
            <button
              class="button is-small cc-btn"
              @click="stopGroup(groupName)"
              :disabled="
                isJobCompleted ||
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
                isJobCompleted ||
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

        <div v-if="expandedGroups.has(groupName)" class="cc-ops">
          <article
            v-for="op in groupOps"
            :key="op.id"
            class="cc-op"
            :class="{ 'is-open': expandedOps.has(op.id) }"
          >
            <div
              class="cc-op-head is-flex is-align-items-center"
              @click="toggleOpExpansion(op.id)"
            >
              <svg
                class="cc-chevron"
                :class="{ 'is-open': expandedOps.has(op.id) }"
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
                <StatusTag :status="op.status" />
              </span>
              <div class="cc-actions" @click.stop>
                <button
                  class="button is-small cc-btn"
                  @click="stopOperation(op)"
                  :disabled="
                    isJobCompleted || !canStop(op.status) || loadingOps.has(op.id)
                  "
                  :class="{ 'is-loading': loadingOps.has(op.id) }"
                  title="Stop operation"
                >
                  <span class="icon is-small"><SquareIcon /></span>
                  <span>Stop</span>
                </button>
                <button
                  class="button is-small cc-btn"
                  @click="restartOperation(op)"
                  :disabled="
                    isJobCompleted ||
                    !canRestart(op.status) ||
                    loadingOps.has(op.id)
                  "
                  :class="{ 'is-loading': loadingOps.has(op.id) }"
                  title="Restart operation"
                >
                  <span class="icon is-small"><RefreshIcon /></span>
                  <span>Restart</span>
                </button>
              </div>
            </div>

            <div v-if="expandedOps.has(op.id)" class="cc-op-body">
              <!-- Timing + results -->
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
                <div class="cc-meta-item">
                  <span class="k">Results</span>
                  <span class="v">
                    <button
                      v-if="hasOpResults(op.id)"
                      class="button is-small is-ghost cc-view-btn"
                      @click.stop="openResultsModal(op.id)"
                    >
                      View results
                    </button>
                    <span v-else class="has-text-grey">None available</span>
                  </span>
                </div>
              </div>

              <!-- Entrypoint / Command (only when overridden in the job definition) -->
              <div class="cc-section" v-if="op.entrypoint || op.cmd">
                <div class="cc-cmd">
                  <div class="cc-cmd-item" v-if="op.entrypoint">
                    <span class="cc-cmd-label">Entrypoint</span>
                    <code class="cc-code is-family-monospace">{{
                      op.entrypoint
                    }}</code>
                  </div>
                  <div class="cc-cmd-item" v-if="op.cmd">
                    <span class="cc-cmd-label">Command</span>
                    <code class="cc-code is-family-monospace">{{ op.cmd }}</code>
                  </div>
                </div>
              </div>

              <!-- Endpoints -->
              <div class="cc-section" v-if="op.ports && op.ports.length > 0">
                <div class="cc-section-title">Endpoints</div>
                <div class="cc-endpoints">
                  <div
                    v-for="(portInfo, idx) in op.ports"
                    :key="idx"
                    class="cc-endpoint is-flex is-align-items-center"
                  >
                    <span class="cc-port is-family-monospace"
                      >:{{ portInfo.port }}</span
                    >
                    <a
                      :href="portInfo.url"
                      target="_blank"
                      class="cc-ep-url is-family-monospace"
                      :title="portInfo.url"
                      >{{ portInfo.url }}</a
                    >
                    <StatusTag :status="portInfo.status" />
                  </div>
                </div>
              </div>

              <!-- Logs -->
              <div class="cc-section">
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
                <p v-else class="has-text-grey has-text-centered py-4 mb-0">
                  No logs available
                </p>
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
import StatusTag from "~/components/Common/StatusTag.vue";

// Import icons as components
import SquareIcon from '@/assets/img/icons/square.svg?component';
import RefreshIcon from '@/assets/img/icons/refresh.svg?component';
import RunningIcon from '@/assets/img/icons/status/running.svg?component';
import StoppedIcon from '@/assets/img/icons/status/stopped.svg?component';
import FailedIcon from '@/assets/img/icons/status/failed.svg?component';
import DoneIcon from '@/assets/img/icons/status/done.svg?component';
import QueuedIcon from '@/assets/img/icons/status/queued.svg?component';
import FullscreenIcon from '@/assets/img/icons/fullscreen.svg?component';
import { useStatus } from '~/composables/useStatus';
import { useDeploymentAuth } from '~/composables/useDeploymentAuth';

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
  results?: { status?: string; startTime?: number; endTime?: number; opStates?: SseOpState[] };
}

interface JobLike {
  address: string;
  node?: string | { toString(): string };
  isCompleted?: boolean;
  timeEnd?: number;
  results?: { opStates?: SseOpState[]; secrets?: SecretsPayload };
  jobDefinition?: {
    ops?: Array<{
      id: string;
      args?: {
        image?: string;
        entrypoint?: string | string[];
        cmd?: string | string[];
      };
    }>;
  };
}

type AnyLogEntry = { id: number; content: string; timestamp: number; html?: boolean };

interface Operation {
  id: string;
  name?: string;
  image?: string;
  entrypoint?: string;
  cmd?: string;
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
}

const props = defineProps<Props>();

const isJobCompleted = computed(() => {
  const job = (props && props.job) ? props.job : null;
  if (job && job.isCompleted !== undefined) return Boolean(job.isCompleted);
  if (job && job.timeEnd) return true;
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
const expandedOps = ref(new Set<string>());
const expandedGroups = ref(new Set<string>());
const hasInitializedGroupExpansion = ref(false);
const clearedAtByOp = ref<Map<string, number>>(new Map());
let pollInterval: NodeJS.Timeout | null = null;

const { getAuthHeader } = useDeploymentAuth();
const route = useRoute();
const deploymentId = computed<string | undefined>(() => {
  return route.params?.id as string || undefined;
});

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

// Toggle group expansion
const toggleGroupExpansion = (groupName: string) => {
  if (expandedGroups.value.has(groupName)) {
    expandedGroups.value.delete(groupName);
  } else {
    expandedGroups.value.add(groupName);
  }
  expandedGroups.value = new Set(expandedGroups.value);
};

// Toggle operation expansion
const toggleOpExpansion = (opId: string) => {
  if (expandedOps.value.has(opId)) {
    expandedOps.value.delete(opId);
  } else {
    expandedOps.value.add(opId);
  }
  expandedOps.value = new Set(expandedOps.value);
};

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
  
  // For completed jobs, use IPFS results
  const jobResults = props.job?.results?.opStates;
  if (jobResults && Array.isArray(jobResults)) {
    const entry = jobResults.find((r) => r.operationId === opId);
    if (entry) {
      return {
        operationId: entry.operationId,
        status: entry.status,
        startTime: entry.startTime,
        endTime: entry.endTime,
        exitCode: entry.exitCode
      };
    }
  }
  
  return null;
};

// entrypoint/cmd are argv arrays (or a plain string) in the job definition;
// render them as a single shell-style line, empty when unset.
const argvToString = (value: unknown): string => {
  if (Array.isArray(value)) return value.map((v) => String(v)).join(' ').trim();
  if (typeof value === 'string') return value.trim();
  return '';
};

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

const getNodeUrl = () => {
  const config = useRuntimeConfig();
  const raw = props.job.node;
  const nodeAddress = typeof raw === 'string' ? raw : raw?.toString?.();
  return `https://${nodeAddress ?? ''}.${config.public.nodeDomain}`;
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
    
    // Build from SSE opStates / operations only
    const liveOpStates = jobInfo.value?.opStates ?? [];
    const opIdsFromStatuses = Object.keys(operationStatuses || {});
    const opIdsFromLive = Array.isArray(liveOpStates)
      ? liveOpStates.map((s) => s?.operationId).filter((v): v is string => Boolean(v))
      : [];
    const opIdsFromEndpoints = Array.from(endpointsByOpId.keys());
    const uniqueOpIds = Array.from(new Set([
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

    // Optional image / entrypoint / cmd lookup from REST jobDefinition (not from SSE)
    const imageByOpId: Record<string, string> = {};
    const entrypointByOpId: Record<string, string> = {};
    const cmdByOpId: Record<string, string> = {};
    if (jobDefinition?.ops && Array.isArray(jobDefinition.ops)) {
      for (const opDef of jobDefinition.ops) {
        if (!opDef?.id) continue;
        imageByOpId[opDef.id] = opDef?.args?.image || '--';
        const entrypoint = argvToString(opDef?.args?.entrypoint);
        if (entrypoint) entrypointByOpId[opDef.id] = entrypoint;
        const cmd = argvToString(opDef?.args?.cmd);
        if (cmd) cmdByOpId[opDef.id] = cmd;
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
        entrypoint: entrypointByOpId[opId],
        cmd: cmdByOpId[opId],
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


watch(groupedOperations, (newGroups) => {
  if (!newGroups) return;
  const allGroupNames = Object.keys(newGroups);

  if (!hasInitializedGroupExpansion.value) {
    expandedGroups.value = new Set(allGroupNames);
    hasInitializedGroupExpansion.value = true;
    return;
  }

  const next = new Set<string>();
  for (const name of expandedGroups.value) {
    if (allGroupNames.includes(name)) next.add(name);
  }
  expandedGroups.value = next;
}, { immediate: true });

// Get status icon using the same logic as Job.vue for consistency
const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'running':
    case 'starting':
    case 'waiting':
    case 'pending':
    case 'init':
      return RunningIcon;
    case 'stopped':
    case 'stopping':
      return StoppedIcon;
    case 'failed':
      return FailedIcon;
    case 'finished':
    case 'success':
      return DoneIcon;
    case 'restarting':
    case 'queued':
      return QueuedIcon;
    default:
      return StoppedIcon;
  }
};

// Use global status system for consistent colors
const { getStatusClass } = useStatus();

// Get status class for tag styling with mapping to global status strings
// For outlined light tags, we want colored borders but white backgrounds
const statusClass = (status: string) => {
  // Map operation statuses to standard status strings that the global system understands
  const statusLower = status?.toLowerCase();
  switch (statusLower) {
    case 'running':
    case 'starting':
    case 'waiting':
    case 'pending':
    case 'init':
      return getStatusClass('RUNNING');
    case 'stopped':
    case 'stopping':
      return getStatusClass('STOPPED');
    case 'failed':
      return getStatusClass('FAILED');
    case 'finished':
    case 'success':
      return getStatusClass('SUCCESS');
    case 'restarting':
      return getStatusClass('QUEUED'); // Restarting is like queued
    default:
      return getStatusClass('STOPPED');
  }
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
    const jobId = props.job.address;
    const baseUrl = getNodeUrl();
    const group = op.group || op.id;
    const url = `${baseUrl}/job/${jobId}/group/${group}/operation/${op.id}/stop`;
    const authHeader = await getAuthHeader(jobId);
    
    await $fetch(url, {
      method: 'POST',
      headers: {
        authorization: authHeader,
      },
    });
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

    const jobId = props.job.address;
    const baseUrl = getNodeUrl();
    const group = op.group || op.id;
    const url = `${baseUrl}/job/${jobId}/group/${group}/operation/${op.id}/restart`;
    const authHeader = await getAuthHeader(jobId);
    
    await $fetch(url, {
      method: 'POST',
      headers: {
        authorization: authHeader,
      },
    });
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
    const jobId = props.job.address;
    const baseUrl = getNodeUrl();
    const url = `${baseUrl}/job/${jobId}/group/${groupName}/stop`;
    const authHeader = await getAuthHeader(jobId);
    
    await $fetch(url, {
      method: 'POST',
      headers: {
        authorization: authHeader,
      },
    });
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

    const jobId = props.job.address;
    const baseUrl = getNodeUrl();
    const url = `${baseUrl}/job/${jobId}/group/${groupName}/restart`;
    const authHeader = await getAuthHeader(jobId);
    
    await $fetch(url, {
      method: 'POST',
      headers: {
        authorization: authHeader,
      },
    });
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

.cc-group-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  background: none;
  border: 0;
  padding: 2px 4px 2px 0;
  cursor: pointer;
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
  color: $grey;
  white-space: nowrap;
}

/* ---- Operation cards ---- */
.cc-ops {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cc-op {
  background: $white;
  border: 1px solid $grey-lighter;
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.15s ease;
}

.cc-op.is-open {
  border-color: $grey-light;
}

html.dark-mode .cc-op {
  background: $black-ter;
  border-color: rgba($white, 0.1);
}

.cc-op-head {
  gap: 0.85rem;
  padding: 0.8rem 1rem;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: $white-ter;
  }
}

html.dark-mode .cc-op-head:hover {
  background: rgba($white, 0.04);
}

.cc-chevron {
  width: 15px;
  height: 15px;
  flex: none;
  color: $grey;
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
  color: $grey;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cc-op-status {
  flex: none;
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
  border-color: $grey-lighter;

  &:hover:not([disabled]) {
    background-color: $white-ter;
    border-color: $grey-light;
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
  border-top: 1px solid $grey-lighter;
}

html.dark-mode .cc-op-body {
  border-top-color: rgba($white, 0.08);
}

.cc-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1rem 0;
}

.cc-meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.cc-meta-item .k {
  font-size: 0.72rem;
  color: $grey;
}

.cc-meta-item .v {
  font-size: 0.85rem;
  color: $text;
  font-variant-numeric: tabular-nums;
}

html.dark-mode .cc-meta-item .v {
  color: $white;
}

.cc-view-btn.button {
  height: auto;
  padding: 0;
  justify-content: flex-start;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

@media screen and (max-width: 620px) {
  .cc-meta {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

/* ---- Sub-sections (endpoints / logs) ---- */
.cc-section {
  padding-top: 1rem;
  border-top: 1px solid $grey-lightest;
}

html.dark-mode .cc-section {
  border-top-color: rgba($white, 0.06);
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
  color: $grey;
  margin-bottom: 0.6rem;
}

.cc-section-head .cc-section-title {
  margin-bottom: 0;
}

/* ---- Entrypoint / Command ---- */
.cc-cmd {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cc-cmd-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.cc-cmd-label {
  font-size: 0.72rem;
  color: $grey;
}

.cc-code {
  display: block;
  background: $white-ter;
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  font-size: 0.78rem;
  color: $text;
  white-space: pre-wrap;
  word-break: break-word;
}

html.dark-mode .cc-code {
  background: rgba($white, 0.04);
  color: $white;
}

/* ---- Endpoints ---- */
.cc-endpoints {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.cc-endpoint {
  gap: 0.7rem;
  padding: 0.5rem 0.75rem;
  background: $white-ter;
  border-radius: 8px;
}

html.dark-mode .cc-endpoint {
  background: rgba($white, 0.04);
}

.cc-port {
  font-weight: 600;
  font-size: 0.8rem;
  color: $text;
  flex: none;
}

html.dark-mode .cc-port {
  color: $white;
}

.cc-ep-url {
  font-size: 0.78rem;
  color: $link;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: auto;

  &:hover {
    text-decoration: underline;
  }
}

/* ---- Logs ---- */
.cc-icon-btn.button {
  border-radius: 8px;
  border-color: $grey-lighter;
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
