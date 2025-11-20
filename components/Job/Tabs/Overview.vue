<template>
  <div class="groups-container">
    <div v-if="loading" class="has-text-centered p-6">
      <span class="icon is-small">
        <i class="fas fa-spinner fa-spin"></i>
      </span>
      <span>Loading groups...</span>
    </div>

    <div v-else-if="error" class="has-text-centered p-6 has-text-danger">
      <span class="icon is-small">
        <i class="fas fa-exclamation-triangle"></i>
      </span>
      <span>{{ error }}</span>
    </div>

    <div v-else-if="operations.length === 0" class="has-text-centered p-6 has-text-grey-light">
      <span class="icon is-small">
        <i class="fas fa-box-open"></i>
      </span>
      <span>No groups available.</span>
    </div>

    <!-- Expandable Tree Table Structure -->
    <div v-else class="container-controls-tree">
      <template v-for="(groupOps, groupName) in groupedOperations" :key="groupName">
        <!-- Group Row -->
        <div class="tree-row tree-row--group" :class="{ 'is-expanded': expandedGroups.has(groupName) }">
          <div class="tree-row__content" @click="toggleGroupExpansion(groupName)">
            <div class="tree-row__main">
              <span class="tree-row__expand-icon">
                <i class="fas fa-chevron-right"></i>
              </span>
              <div class="tree-row__info">
                <h2 class="title is-5 mb-0 is-capitalized">{{ groupName }}</h2>
                <span class="subtitle is-6 has-text-grey-dark">{{ groupOps.length }} operation{{ groupOps.length !== 1 ? 's' : '' }}</span>
              </div>
            </div>
            <div class="tree-row__actions" @click.stop>
              <div class="buttons has-addons">
                <button
                  @click="stopGroup(groupName)"
                  :disabled="isJobCompleted || loadingGroups.has(groupName) || !hasStoppableOpsInGroup(groupOps)"
                  :class="{ 'is-loading': loadingGroups.has(groupName) }"
                  class="button tab-button"
                  title="Stop all operations in this group"
                >
                  <span class="icon is-small">
                    <SquareIcon />
                  </span>
                  <span>Stop</span>
                </button>
                <button
                  @click="restartGroup(groupName)"
                  :disabled="isJobCompleted || loadingGroups.has(groupName) || !hasRestartableOpsInGroup(groupOps)"
                  :class="{ 'is-loading': loadingGroups.has(groupName) }"
                  class="button tab-button"
                  title="Restart all operations in this group"
                >
                  <span class="icon is-small">
                    <RefreshIcon />
                  </span>
                  <span>Restart</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Operations List (Indented Level 1) -->
          <div v-if="expandedGroups.has(groupName)" class="tree-row__children">
            <template v-for="op in groupOps" :key="op.id">
              <!-- Operation Row -->
              <div class="tree-row tree-row--operation" :class="{ 'is-expanded': expandedOps.has(op.id) }">
                <div class="tree-row__content" @click="toggleOpExpansion(op.id)">
                  <div class="tree-row__main">
                    <span class="tree-row__expand-icon">
                      <i class="fas fa-chevron-right"></i>
                    </span>
                    <div class="tree-row__info">
                      <div class="is-flex is-align-items-center">
                        <div class="mr-3">
                          <h2 class="title is-5 mb-0">{{ op.id }}</h2>
                          <span class="subtitle is-6 has-text-grey-dark is-family-monospace">{{ op.image || '--' }}</span>
                        </div>
                        <!-- Status next to title -->
                        <div class="tree-row__status">
                          <StatusTag :status="op.status" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Right side: Actions -->
                  <div class="tree-row__right" @click.stop>
                    <!-- Actions -->
                    <div class="tree-row__actions">
                      <div class="buttons has-addons">
                        <button
                          @click="stopOperation(op)"
                          :disabled="isJobCompleted || !canStop(op.status) || loadingOps.has(op.id)"
                          :class="{ 'is-loading': loadingOps.has(op.id) }"
                          class="button tab-button"
                          title="Stop operation"
                        >
                          <span class="icon is-small">
                            <SquareIcon />
                          </span>
                          <span>Stop</span>
                        </button>
                        <button
                          @click="restartOperation(op)"
                          :disabled="isJobCompleted || !canRestart(op.status) || loadingOps.has(op.id)"
                          :class="{ 'is-loading': loadingOps.has(op.id) }"
                          class="button tab-button"
                          title="Restart operation"
                        >
                          <span class="icon is-small">
                            <RefreshIcon />
                          </span>
                          <span>Restart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Operation Details (Indented Level 2) -->
                <div v-if="expandedOps.has(op.id)" class="operation-details-panel">
                  <!-- Operation Details -->
                  <div class="detail-section">
                    <h2 class="title is-5 mb-3">Operation Details</h2>
                    <div class="table-container">
                      <table class="table is-fullwidth mb-0">
                      <tbody>
                        <tr>
                          <td class="has-min-width-250">Started</td>
                          <td>{{ formatTimestamp(getOpState(op.id)?.startTime) || '--' }}</td>
                        </tr>
                        <tr>
                          <td>Ended</td>
                          <td>{{ formatTimestamp(getOpState(op.id)?.endTime) || '--' }}</td>
                        </tr>
                        <tr>
                          <td>Results</td>
                          <td>
                            <button
                              v-if="hasOpResults(op.id)"
                              class="button is-small is-link is-light"
                              @click.stop="openResultsModal(op.id)"
                            >
                              <span class="icon is-small">
                                <i class="fas fa-eye"></i>
                              </span>
                              <span>View</span>
                            </button>
                            <span v-else class="has-text-grey">None available</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    </div>
                  </div>
                  
                  <!-- Service Endpoints -->
                  <div class="detail-section">
                    <h2 class="title is-5 mb-3">Service Endpoints</h2>
                    <div class="table-container">
                      <table v-if="op.ports && op.ports.length > 0" class="table is-fullwidth mb-0">
                      <thead>
                        <tr>
                          <th>Port</th>
                          <th>URL</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(portInfo, idx) in op.ports" :key="idx">
                          <td>{{ portInfo.port }}</td>
                          <td>
                            <a :href="portInfo.url" target="_blank" class="has-text-link endpoint-url">{{ portInfo.url }} ↗</a>
                          </td>
                          <td>
                            <StatusTag :status="portInfo.status" />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <table v-else class="table is-fullwidth mb-0">
                      <tbody>
                        <tr>
                          <td class="has-text-grey">No endpoints available</td>
                        </tr>
                      </tbody>
                    </table>
                    </div>
                  </div>
                  
                  <!-- Logs -->
                  <div class="detail-section">
                    <div class="is-flex is-justify-content-space-between is-align-items-center mb-3">
                      <h2 class="title is-5 mb-0">Logs</h2>
                    </div>
                    <div v-if="getOpLogs(op.id)?.length" class="logs-container-with-button">
                      <div class="logs-header">
                        <button
                          class="button is-small is-text fullscreen-logs-button"
                          @click.stop="openLogModal(op.id)"
                          title="Fullscreen Logs"
                        >
                          <span class="icon is-small">
                            <FullscreenIcon />
                          </span>
                        </button>
                      </div>
                      <FLogViewer
                        :logs="getOpLogs(op.id)"
                        :isConnecting="false"
                        :progressBars="new Map()"
                        :resourceProgressBars="new Map()"
                      />
                    </div>
                    <table v-else class="table is-fullwidth mb-0">
                      <tbody>
                        <tr>
                          <td class="has-text-grey">No logs available</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>

  <!-- Fullscreen Logs Modal -->
  <FullscreenModal :isOpen="logModalOpen" :title="`Operation Logs - ${fullscreenOpId || ''}`" @close="closeLogModal">
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
  <FullscreenModal :isOpen="resultsModalOpen" :title="`Job Results - ${resultsOpId || ''}`" @close="closeResultsModal">
    <div class="box">
      <div class="content">
        <template v-if="resultsOpId && hasOpResults(resultsOpId)">
          <VueJsonPretty :data="getOpResults(resultsOpId)" show-icon show-line-number />
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
  jobDefinition?: { ops?: Array<{ id: string; args?: { image?: string } }> };
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

const { ensureAuth } = useAuthHeader();
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

    // Optional image lookup from REST jobDefinition (not from SSE)
    const imageByOpId: Record<string, string> = {};
    if (jobDefinition?.ops && Array.isArray(jobDefinition.ops)) {
      for (const opDef of jobDefinition.ops) {
        if (opDef?.id) imageByOpId[opDef.id] = opDef?.args?.image || '--';
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
    const authHeader = await ensureAuth({ deploymentId: deploymentId.value });
    
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
    const authHeader = await ensureAuth({ deploymentId: deploymentId.value });
    
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
    const authHeader = await ensureAuth({ deploymentId: deploymentId.value });
    
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
    const authHeader = await ensureAuth({ deploymentId: deploymentId.value });
    
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
// Use Bulma utility classes instead of custom containers
.groups-container {
  // Remove hardcoded background and radius - use Bulma classes in template
}

// Replace custom flex layouts with Bulma has-text-centered
.loading-state,
.error-state,
.empty-state {
  // Use Bulma classes: has-text-centered p-6 
}

.error-state {
  // Use Bulma class: has-text-danger
}

// Use Bulma spacing utilities instead
.groups-table-container {
  // Use Bulma class: is-flex is-flex-direction-column 
}

.group-section {
  // Use Bulma class: is-flex is-flex-direction-column mb-5
}

// Simplify group header using Bulma level classes
.group-header {
  // Use Bulma classes: level px-4 py-3 has-background-light
  border-left: 4px solid $secondary;
}

.group-info {
  // Use Bulma class: level-left
}

.group-name {
  // Use Bulma classes: title is-5 mb-0 is-capitalized
}

.group-count {
  // Use Bulma class: has-text-grey
}

// Use Bulma class: level-right with buttons field
.group-actions {
  // Remove - using level-right instead
}

// Minimal table customization - use Bulma table classes
.table {
  tbody {
    tr.op-row {
      cursor: pointer;
      
      &.is-expanded {
        background-color: $grey-lightest;
      }
    }
  }
}

html.dark-mode {
  .table tbody tr.op-row.is-expanded {
    background-color: $grey-darker;
  }
}

// Operation Details - use Bulma columns
.op-details-cell {
  padding: 0 !important;
  background: transparent;
}

.op-details-container {
  background: $white;
}

.op-info-panel {
  // Single column layout now
}

// Use Bulma typography classes - minimal custom styling needed
.op-info-section {  
  &.endpoints-section {
    min-height: 0;
    overflow: hidden;
    
    .endpoints-content {
      overflow-y: auto;
      min-height: 0;
    }
  }
}

// Minimal custom styling - use Bulma classes in template
.info-item {
  border-bottom: 1px solid $grey-lighter;
  
  &:last-child {
    border-bottom: none;
  }
}

// Minimal styling for expand icon
.expand-icon {
  transition: transform 0.2s ease;
  color: $text-dark;

  &.is-expanded {
    transform: rotate(180deg);
  }
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

.log-entry {
  margin: 0;
  padding: 0.25rem 0;
  word-wrap: break-word;
  
  :deep(.timestamp) {
    color: $grey-dark;
    margin-right: 0.5rem;
  }
  
  :deep(.info) {
    color: $info;
  }
  
  :deep(.error) {
    color: $danger;
  }
  
  :deep(.warning) {
    color: $warning;
  }
  
  :deep(.success) {
    color: $success;
  }
}

.op-logs-empty {
  padding: 2rem;
  text-align: center;
  color: $grey;
  background: $white;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid $grey-lighter;
  border-radius: $radius;
}

.op-image {
  color: $text;
  font-family: monospace;
}

.op-ports {
  color: $text-dark;
  font-family: monospace;
}

.port-badges {
  display: inline-flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  justify-content: flex-start;
}

// Port badge styling now in global.scss

// Status badges now use global .tag styling

.action-buttons {
  display: inline-flex;
  gap: 0.5rem;
}

.op-status {
  vertical-align: middle;
}

.op-actions {
  vertical-align: middle;
}

// Tree Table Structure using Bulma variables
.container-controls-tree {
  .tree-row {
    border: 1px solid $border;
    border-radius: $radius;
    background: $white;
    transition: all 0.2s ease;

    &:not(:last-child) {
      margin-bottom: $block-spacing;
    }

    &.is-expanded {
      .tree-row__expand-icon i {
        transform: rotate(90deg);
      }
    }

    &--group {
      // border-left removed from group header
      
      // No need for children margin adjustment anymore
      .tree-row__children {
        // margin-left: -5px;
        border-left: none;
      }
    }

    &--operation {
      margin-left: $size-5; // keep first-level indent for operations
    }

  }

  .tree-row__content {
    padding: $size-4; // uniform padding on all sides
    cursor: pointer;
    transition: background-color 0.2s ease;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &:hover {
      background-color: $grey-lightest;
    }
  }

  // When expanded, add a clear divider between header and body
  .tree-row.is-expanded > .tree-row__content {
    // border-bottom removed
  }

  .tree-row__main {
    display: flex;
    align-items: center;
    flex: 1;
    gap: 0; // remove implicit spacing between expand icon and info
  }

  .tree-row__expand-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 0.25rem; // minimal spacer
    width: auto; // no reserved width
    color: $grey;
    transition: transform 0.2s ease;

    i {
      display: block;
      line-height: 1;
      transition: transform 0.2s ease;
    }
  }

  .tree-row__info {
    flex: 1;
    margin-left: 0; // ensure no extra left offset inside info block
    > .is-flex.is-align-items-center {
      gap: 0.25rem; // tighten inner flex spacing
    }
  }

  .tree-row__status { margin-left: 0.5rem; }

  .tree-row__right {
    display: flex;
    align-items: center;
  }

  .tree-row__actions {
    .buttons {
      margin-bottom: 0;
    }
  }

  .tree-row__children {
    background: $white; // unify with dashboard background
  }

  // Operation details panel styling
  .operation-details-panel {
    margin-left: 0;
    padding: $size-4; // match header padding
    background: $white; // unify with dashboard background
    border-radius: $radius-small;
  }

  .detail-section {
    &:not(:last-child) {
      margin-bottom: $size-4;
      padding-bottom: $size-4;
      border-bottom: 1px solid $border-light;
    }
  }

}


// Dark mode using Bulma variables
html.dark-mode {
  .container-controls-tree {
    .tree-row {
      background: $grey-darker;
      border: 1px solid $grey-dark;

      &--group {
        // border-left-color removed from group header in dark mode
        
        // No need for children margin adjustment anymore
        .tree-row__children {
          // margin-left: -5px;
          border-left: none;
        }
      }

      &--operation {
        // no border for operations
      }

    }

    .tree-row__content:hover {
      background-color: lighten($grey-darker, 3%);
    }

    .tree-row.is-expanded > .tree-row__content {
      // border-bottom removed for dark mode too
    }

    .operation-details-panel {
      background: darken($grey-darker, 2%);
      border-left-color: $grey;
    }

    .detail-section:not(:last-child) {
      border-bottom-color: $grey-dark;
    }

    .tree-row__children {
      background: darken($grey-darker, 2%);
    }

    .tree-row__expand-icon {
      color: $grey-light;
    }
  }
}

html.dark-mode {
  .groups-container {
    background: $grey-darker;
  }

  .group-header {
    background: $black;
    border-left-color: $secondary;
  }

  .group-name {
    color: $white;
  }

  .group-count {
    color: $grey-light;
  }

  .operations-table {
    thead tr {
      border-bottom-color: $grey-dark;
    }

    thead th {
      color: $grey-light;
    }

    tbody tr.op-row {
      border-bottom-color: $grey-darker;

      &:hover {
        background-color: transparent;
      }

      &.is-expanded {
        background-color: lighten($grey-darker, 3%);
      }
    }

    tbody tr.op-details-row {
      border-bottom-color: $grey-darker;
    }
  }

  .op-details-container {
    background: $grey-darker;
  }

  .op-info-panel {
    background: $grey-darker;
    border-right-color: $grey-dark;
  }

  .op-info-section {
    .section-title {
      color: $white;
    }
  }
  
  .op-logs-panel {
    background: $grey-darker;
  }
  
  .logs-header {
    background: $grey-darker;
    border-bottom-color: $grey-dark;
  }
  
  .logs-title {
    color: $white;
  }

  .info-item {
    border-bottom-color: $grey-darker;
    
    &:first-child {
      padding-top: 0;
    }
    
    .info-label {
      color: $grey-light;
    }
    
    .info-value {
      color: $grey-lighter;
    }
  }

  .endpoint-item {
    background: $grey-darker;
    border-color: lighten($grey-dark, 10%);
  }
  
  .endpoints-empty {
    color: $grey;
  }

  .endpoint-port {
    color: $grey-lighter;
  }

  .status-dot {
    &.dot-online {
      background: lighten($success, 10%);
    }
    
    &.dot-offline {
      background: lighten($danger, 10%);
    }
    
    &.dot-unknown {
      background: lighten($warning, 10%);
    }
  }

  .endpoint-link {
    background: $secondary;
    color: $black;
    
    &:hover {
      background: darken($secondary, 5%);
      box-shadow: 0 2px 4px rgba($secondary, 0.3);
    }
    
    .endpoint-url {
      color: $black;
    }
}

// Responsive endpoint URLs
.endpoint-url {
  word-break: break-all;
  display: inline-block;
  max-width: 100%;
  overflow-wrap: break-word;
}

@media screen and (max-width: 768px) {
  .endpoint-url {
    font-size: 0.75rem;
    max-width: 300px;
    min-width: 200px;
  }
}

@media screen and (max-width: 480px) {
  .endpoint-url {
    font-size: 0.7rem;
    max-width: 250px;
    min-width: 180px;
  }
}

  .op-id {
    color: $grey-lighter;
  }

  .expand-icon {
    color: $grey-light;
  }

  .op-logs-content {
    background: $black-bis;
    border-color: $grey-dark;
  }

  .op-logs-viewer {
    color: $grey-lighter;
  }

  .log-entry {
    :deep(.timestamp) {
      color: $grey-dark;
    }
    
    :deep(.info) {
      color: $info;
    }
    
    :deep(.error) {
      color: $danger;
    }
    
    :deep(.warning) {
      color: $warning;
    }
    
    :deep(.success) {
      color: $success;
    }
  }

  .op-logs-empty {
    color: $grey;
    background: $black-bis;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-color: $grey-dark;
  }

  .op-image {
    color: $grey-lighter;
  }

  .op-ports {
    color: $grey-light;
  }

  // Port badge dark mode styling now in global.scss

  // Status badges use global .tag styling in dark mode too

  .action-btn {
    background: $grey-darker;
    border-color: $grey-dark;
    color: $grey-light;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    
    .icon img {
      filter: brightness(0) saturate(100%) invert(88%) sepia(0%) saturate(0%) hue-rotate(180deg) brightness(100%) contrast(88%);
    }

    &:hover:not(:disabled) {
      background: lighten($grey-darker, 5%);
      border-color: lighten($grey-dark, 10%);
      color: $white;
    }
    
    &.is-loading {
      &:after {
        border-color: $grey;
        border-right-color: transparent;
        border-top-color: transparent;
      }
    }
  }

  .loading-state,
  .empty-state {
    color: $grey-light;
  }
}

// Operation logs container styling to match main logs
.logs-container-with-button {
  position: relative;
  
  .logs-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    position: absolute;
    top: 0.2rem;
    right: 0.5rem;
    z-index: 10;
    pointer-events: none;
  }
  
  .fullscreen-logs-button {
    pointer-events: auto;
    background-color: rgba(255, 255, 255, 0.8) !important;
    backdrop-filter: blur(4px);
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.95) !important;
    }
  }
}

html.dark-mode {
  .logs-container-with-button .fullscreen-logs-button {
    background-color: rgba(54, 54, 54, 0.8) !important;
    
    &:hover {
      background-color: rgba(54, 54, 54, 0.95) !important;
    }
  }
}

:deep(.fullscreen-modal-body .fullscreen-viewer) {
  height: 100%;
  min-height: 100%;
  overflow-y: auto;
}

@keyframes spinAround {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

