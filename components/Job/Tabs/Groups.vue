<template>
  <div class="groups-container">
    <div v-if="loading" class="loading-state">
      <span class="icon is-small">
        <i class="fas fa-spinner fa-spin"></i>
      </span>
      <span>Loading groups...</span>
    </div>

    <div v-else-if="error" class="error-state">
      <span class="icon is-small has-text-danger">
        <i class="fas fa-exclamation-triangle"></i>
      </span>
      <span>{{ error }}</span>
    </div>

    <div v-else-if="operations.length === 0" class="empty-state">
      <span class="icon is-small has-text-grey-light">
        <i class="fas fa-box-open"></i>
      </span>
      <span>No groups found</span>
    </div>

    <div v-else class="groups-table-container">
      <template v-for="(groupOps, groupName) in groupedOperations" :key="groupName">
        <div class="group-section">
          <div class="group-header">
            <div class="group-info">
              <h3 class="group-name">{{ groupName }}</h3>
              <span class="group-count">{{ groupOps.length }} operation{{ groupOps.length !== 1 ? 's' : '' }}</span>
            </div>
            <div class="group-actions">
              <button
                @click.stop="stopGroup(groupName)"
                :disabled="isJobCompleted || loadingGroups.has(groupName) || !hasStoppableOpsInGroup(groupOps)"
                :class="{ 'is-loading': loadingGroups.has(groupName) }"
                class="group-action-btn stop-btn"
                title="Stop all operations in this group"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="4" width="8" height="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <button
                @click.stop="restartGroup(groupName)"
                :disabled="isJobCompleted || loadingGroups.has(groupName) || !hasRestartableOpsInGroup(groupOps)"
                :class="{ 'is-loading': loadingGroups.has(groupName) }"
                class="group-action-btn restart-btn"
                title="Restart all operations in this group"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 8C13 10.7614 10.7614 13 8 13C5.23858 13 3 10.7614 3 8C3 5.23858 5.23858 3 8 3C9.44649 3 10.752 3.59668 11.6829 4.5625" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M11 2V4.5H8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          
          <table class="operations-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Port(s)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="op in groupOps" :key="op.id">
                <tr 
                  :class="['op-row', `status-${op.status}`, { 'is-expanded': expandedOps.has(op.id) }]"
                  @click="toggleOpExpansion(op.id)"
                >
                  <td class="op-name">
                    <span class="op-id">
                      {{ op.id }}
                    </span>
                  </td>
                  <td class="op-image">{{ op.image || '--' }}</td>
                  <td class="op-ports">
                    <span v-if="!op.ports || op.ports.length === 0">--</span>
                    <span v-else class="port-badges">
                      <a 
                        v-for="(portInfo, idx) in op.ports" 
                        :key="idx"
                        :href="portInfo.url"
                        target="_blank"
                        class="port-badge"
                        :title="`Open ${portInfo.url}`"
                        @click.stop
                      >
                        {{ portInfo.port }}
                      </a>
                    </span>
                  </td>
                  <td class="op-status"><span class="status-badge" :class="`status-${op.status}`">{{ op.status }}</span></td>
                  <td class="op-actions">
                    <div class="action-buttons">
                      <button
                        @click.stop="stopOperation(op)"
                        :disabled="isJobCompleted || !canStop(op.status) || loadingOps.has(op.id)"
                        :class="{ 'is-loading': loadingOps.has(op.id) }"
                        class="action-btn stop-btn"
                        title="Stop operation"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="4" y="4" width="8" height="8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      <button
                        @click.stop="restartOperation(op)"
                        :disabled="isJobCompleted || !canRestart(op.status) || loadingOps.has(op.id)"
                        :class="{ 'is-loading': loadingOps.has(op.id) }"
                        class="action-btn restart-btn"
                        title="Restart operation"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13 8C13 10.7614 10.7614 13 8 13C5.23858 13 3 10.7614 3 8C3 5.23858 5.23858 3 8 3C9.44649 3 10.752 3.59668 11.6829 4.5625" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M11 2V4.5H8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="expandedOps.has(op.id)" class="op-details-row">
                  <td colspan="5" class="op-details-cell">
                    <div class="op-details-container">
                      <!-- Operation Information -->
                      <div class="op-info-panel">
                        <div class="op-info-section">
                          <h4 class="section-title">Operation Details</h4>
                          <div class="section-content">
                            <div class="info-item">
                              <span class="info-label">Last Started:</span>
                              <span class="info-value">{{ formatTimestamp(getOpState(op.id)?.startTime) }}</span>
                            </div>
                            
                            <div class="info-item">
                              <span class="info-label">Last Ended:</span>
                              <span class="info-value">{{ formatTimestamp(getOpState(op.id)?.endTime) }}</span>
                            </div>
                            
                          </div>
                        </div>
                        
                        <!-- Service Endpoints -->
                        <div class="op-info-section endpoints-section">
                          <h4 class="section-title">Service Endpoints</h4>
                          <div class="section-content endpoints-content">
                            <div v-if="op.ports && op.ports.length > 0" class="endpoints-list">
                              <div 
                                v-for="(portInfo, idx) in op.ports" 
                                :key="idx"
                                class="endpoint-item"
                              >
                                <div class="endpoint-row">
                                  <div class="endpoint-info">
                                    <span
                                      class="status-dot"
                                      :class="{
                                        'dot-online': portInfo.status === 'ONLINE',
                                        'dot-offline': portInfo.status === 'OFFLINE',
                                        'dot-unknown': portInfo.status === 'UNKNOWN',
                                      }"
                                      :title="portInfo.status === 'UNKNOWN' ? 'LOADING' : portInfo.status"
                                    ></span>
                                    <span class="endpoint-port">Port {{ portInfo.port }}</span>
                                  </div>
                                  <a
                                    :href="portInfo.url"
                                    target="_blank"
                                    class="endpoint-link"
                                    @click.stop
                                  >
                                    <span class="icon is-small">
                                      <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"
                                          fill="currentColor"
                                        />
                                      </svg>
                                    </span>
                                    <span class="endpoint-url">Open</span>
                                  </a>
                                </div>
                              </div>
                            </div>
                            <div v-else class="endpoints-empty">
                              <span class="has-text-grey-light">No endpoints available</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Logs -->
                      <div class="op-logs-panel">
                        <div class="logs-header">
                          <h4 class="logs-title">LOGS</h4>
                        </div>
                        <div v-if="getOpLogs(op.id)?.length" class="op-logs-content">
                          <div class="op-logs-viewer">
                            <div 
                              v-for="(log, index) in getOpLogs(op.id)" 
                              :key="index"
                              class="log-entry"
                            >
                              <template v-if="log.html">
                                <span v-html="log.content || log.log || log"></span>
                              </template>
                              <template v-else>
                                {{ log.content || log.log || log }}
                              </template>
                            </div>
                          </div>
                        </div>
                        <div v-else class="op-logs-empty">
                          <span class="has-text-grey-light">No logs available</span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import type { JobInfo, EndpointStatus } from "~/composables/jobs/types";

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
  job: any;
  isJobPoster: boolean;
  opIds?: string[];
  activeLogs?: AnyLogEntry[];
  selectOp?: (opId: string | null) => void;
  logsByOp?: Map<string, AnyLogEntry[]>;
  systemLogsMap?: AnyLogEntry[];
  jobInfo?: JobInfo | null;
}

const props = defineProps<Props>();

const isJobCompleted = computed(() => {
  try {
    if ((props as any)?.job?.isCompleted !== undefined) return Boolean((props as any).job.isCompleted);
    if ((props as any)?.job?.timeEnd) return true;
  } catch (_) {}
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
const clearedAtByOp = ref<Map<string, number>>(new Map());
let pollInterval: NodeJS.Timeout | null = null;

const { ensureAuth } = useAuthHeader();

const jobInfo = computed<JobInfo | null>(() => props.jobInfo ?? null);

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
        ? logs.filter(l => (l as any)?.timestamp ? (l as any).timestamp >= clearedAt : false)
        : logs;
    }
  }
  
  // Fall back to completed job results from IPFS/node results
  if (clearedAt) return [];
  
  const jobResults = props.job?.results?.opStates;
  if (jobResults && Array.isArray(jobResults)) {
    const entry = jobResults.find((r: any) => r.operationId === opId);
    if (entry?.logs && Array.isArray(entry.logs)) {
      return entry.logs.map((logEntry: any, index: number) => {
        const logText = logEntry.log || logEntry;
        const logType = logEntry.type || 'stdout';
        return {
          id: index,
          content: logText,
          log: logText,
          timestamp: entry.startTime + index,
          html: false,
          type: logType
        };
      });
    }
  }
  
  // Fallback to jobInfo.value.results if available
  const results = jobInfo.value?.results?.opStates;
  if (results && Array.isArray(results)) {
    const entry = results.find((r: any) => r.operationId === opId);
    if (entry?.logs) return entry.logs;
  }
  
  return null;
};

// Get operation state
const getOpState = (opId: string) => {
  // First check jobInfo for running job state
  const opStates = jobInfo.value?.operations?.opStates;
  if (opStates) {
    const state = opStates.find((state: any) => state.operationId === opId);
    if (state) return state;
  }
  
  // For completed jobs, use IPFS results
  const jobResults = props.job?.results?.opStates;
  if (jobResults && Array.isArray(jobResults)) {
    const entry = jobResults.find((r: any) => r.operationId === opId);
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
  const nodeAddress = (props.job.node as any)?.toString?.() || (props.job.node as any);
  return `https://${nodeAddress}.${config.public.nodeDomain}`;
};

const buildOperations = () => {
  try {
    const ops: Operation[] = [];
    
    // Use jobInfo when available
    const jobDefinition = jobInfo.value?.jobDefinition ?? (props.job?.jobDefinition || null);
    const endpointsData = jobInfo.value?.endpoints?.urls || {};
    
    // Derive operation statuses from jobInfo first, then fall back to completed IPFS results
    let operationStatuses: Record<string, string> = {};
    if (jobInfo.value?.operations?.all) {
      operationStatuses = jobInfo.value.operations.all;
    } else if (jobInfo.value?.operations?.opStates) {
      const opStates = jobInfo.value.operations.opStates;
      for (const opState of opStates) {
        operationStatuses[opState.operationId] = opState.status;
      }
    } else if (props.job?.results?.opStates && Array.isArray(props.job.results.opStates)) {
      for (const opState of props.job.results.opStates) {
        operationStatuses[opState.operationId] = opState.status || 'unknown';
      }
    }
    
    // Create a map of opId to endpoints
    const endpointsByOpId = new Map<string, Array<{ port: number; url: string; status: string }>>();
    for (const [hash, endpoint] of Object.entries(endpointsData)) {
      const ep = endpoint as any;
      if (ep.opId) {
        if (!endpointsByOpId.has(ep.opId)) {
          endpointsByOpId.set(ep.opId, []);
        }
        endpointsByOpId.get(ep.opId)!.push({
          port: ep.port,
          url: ep.url,
          status: ep.status || 'UNKNOWN',
        });
      }
    }
    
    if (jobDefinition && jobDefinition.ops) {
      for (const opDef of jobDefinition.ops) {
        const opId = opDef.id;
        const status = operationStatuses[opId] || 'unknown';
        const group = opDef.execution?.group || opId;
        
        ops.push({
          id: opId,
          name: opId,
          image: opDef.args?.image || '--',
          ports: endpointsByOpId.get(opId) || [],
          status: status,
          group: group,
        });
      }
    }
    
    operations.value = ops;
    loading.value = false;
    error.value = null;
  } catch (err: any) {
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

// Get status icon
const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'running':
      return 'fas fa-play-circle';
    case 'stopped':
      return 'fas fa-stop-circle';
    case 'failed':
      return 'fas fa-exclamation-circle';
    case 'finished':
      return 'fas fa-check-circle';
    case 'restarting':
    case 'stopping':
    case 'starting':
      return 'fas fa-spinner fa-spin';
    case 'waiting':
    case 'pending':
      return 'fas fa-clock';
    default:
      return 'fas fa-circle';
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
  try {
    const jobId = props.job.address;
    const baseUrl = getNodeUrl();
    const group = op.group || op.id;
    const url = `${baseUrl}/job/${jobId}/group/${group}/operation/${op.id}/stop`;
    const authHeader = await ensureAuth();
    
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
  }
};

// Restart operation
const restartOperation = async (op: Operation) => {
  loadingOps.value.add(op.id);
  try {
    // Mark the timestamp when we cleared logs for this operation
    // This allows getOpLogs to filter out old logs from before the restart
    clearedAtByOp.value.set(op.id, Date.now());

    const jobId = props.job.address;
    const baseUrl = getNodeUrl();
    const group = op.group || op.id;
    const url = `${baseUrl}/job/${jobId}/group/${group}/operation/${op.id}/restart`;
    const authHeader = await ensureAuth();
    
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
  try {
    const jobId = props.job.address;
    const baseUrl = getNodeUrl();
    const url = `${baseUrl}/job/${jobId}/group/${groupName}/stop`;
    const authHeader = await ensureAuth();
    
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
  }
};

// Restart entire group
const restartGroup = async (groupName: string) => {
  loadingGroups.value.add(groupName);
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
    const authHeader = await ensureAuth();
    
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
  }
};
</script>

<style lang="scss" scoped>
.groups-container {
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 8px;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #7a7a7a;
}

.error-state {
  color: #f14668;
}

.groups-table-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.group-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f5f5f5;
  border-radius: 6px;
  border-left: 4px solid #10e80c;
}

.group-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.group-name {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  text-transform: capitalize;
}

.group-count {
  font-size: 0.875rem;
  color: #7a7a7a;
  font-weight: 500;
}

.group-actions {
  display: flex;
  gap: 0.5rem;
}

.group-action-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: #ffffff;
  color: #1a1a1a;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  svg {
    display: block;
    flex-shrink: 0;
  }

  &:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #d0d0d0;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  &.is-loading {
    position: relative;
    
    svg {
      opacity: 0;
    }
    
    &:after {
      position: absolute;
      content: "";
      left: calc(50% - 8px);
      top: calc(50% - 8px);
      width: 16px;
      height: 16px;
      border: 2px solid #dbdbdb;
      border-radius: 50%;
      border-right-color: transparent;
      border-top-color: transparent;
      animation: spinAround 0.5s infinite linear;
    }
  }
}

.operations-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
  table-layout: fixed;

  thead {
    tr {
      border-bottom: 2px solid #e0e0e0;
    }

    th {
      padding: 0.875rem 1.25rem;
      text-align: center;
      font-weight: 600;
      font-size: 0.8125rem;
      text-transform: uppercase;
      color: #1a1a1a; // make headers black
      letter-spacing: 0.05em;
      
      &:nth-child(1) { width: 25%; } // ID
      &:nth-child(2) { width: 30%; } // Image
      &:nth-child(3) { width: 15%; } // Port(s)
      &:nth-child(4) { width: 15%; } // Status
      &:nth-child(5) { width: 15%; } // Actions (smaller now with icons)
    }
  }

  tbody {
    tr.op-row {
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s ease;
      cursor: pointer;

      &:hover {
        background-color: #f9f9f9;
      }

      &.is-expanded {
        background-color: #fafafa;
      }
    }

    tr.op-details-row {
      border-bottom: 1px solid #f0f0f0;

      &:hover {
        background-color: transparent;
      }
    }

    td {
      padding: 1rem 1.25rem;
      vertical-align: middle;
      text-align: center;
    }
  }
}

// Operation Details Container (two-column layout)
.op-details-cell {
  padding: 0 !important;
  background: transparent;
  text-align: left !important;
}

.op-details-container {
  display: grid;
  grid-template-columns: 30% 70%;
  gap: 0;
  background: #ffffff;
  height: 400px;
  max-height: 500px;
  overflow: hidden;
}

// Left panel: Operation Info
.op-info-panel {
  padding: 2rem;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100%;
  overflow: hidden; // Prevent panel from expanding
}

.op-info-section {
  .section-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: #1a1a1a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 1.45rem 0;
  }
  
  .section-content {
    padding: 0;
  }
  
  &.endpoints-section {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    
    .section-title {
      flex-shrink: 0;
    }
    
    .endpoints-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
      
      .endpoints-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .endpoints-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 80px;
        color: #999;
        font-size: 0.875rem;
      }
    }
  }
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e8e8e8;
  
  &:first-child {
    padding-top: 0;
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  .info-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #666;
  }
  
  .info-value {
    font-size: 0.875rem;
    color: #1a1a1a;
    font-family: monospace;
  }
}

.endpoint-item {
  padding: 0.5rem 0.75rem;
  background: #ffffff;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
}

.endpoint-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.endpoint-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  
  &.dot-online {
    background: #2e7d32;
  }
  
  &.dot-offline {
    background: #c62828;
  }
  
  &.dot-unknown {
    background: #ff9800;
  }
}

.endpoint-port {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1a1a1a;
  font-family: monospace;
}

.endpoint-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #10e80c;
  color: #ffffff;
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  &:hover {
    background: #0ec909;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(16, 232, 12, 0.2);
  }
  
  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .endpoint-url {
    color: #ffffff;
  }
}

.op-logs-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
  padding: 2rem;
  background: #ffffff;
}

.logs-header {
  margin-bottom: 0.75rem;
  background: #ffffff;
  flex-shrink: 0;
}

.logs-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1a1a1a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.op-name {
  font-weight: 500;
}

.op-id {
  color: #363636;
  font-family: monospace;
  font-size: 0.9375rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.expand-icon {
  transition: transform 0.2s ease;
  color: #7a7a7a;
  flex-shrink: 0;

  &.is-expanded {
    transform: rotate(180deg);
  }
}

.op-logs-content {
  background: #1a1a1a;
  padding: 0;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.op-logs-viewer {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
  line-height: 1.6;
  color: #c9d1d9;
  padding: 1rem;
}

.log-entry {
  margin: 0;
  padding: 0.25rem 0;
  word-wrap: break-word;
  
  :deep(.timestamp) {
    color: #8b949e;
    font-weight: 600;
    margin-right: 0.5rem;
  }
  
  :deep(.info) {
    color: #58a6ff;
  }
  
  :deep(.error) {
    color: #f85149;
  }
  
  :deep(.warning) {
    color: #d29922;
  }
  
  :deep(.success) {
    color: #56d364;
  }
}

.op-logs-empty {
  padding: 2rem;
  text-align: center;
  color: #999;
  font-size: 0.875rem;
  background: #1a1a1a;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.op-image {
  color: #363636;
  font-family: monospace;
  font-size: 0.9375rem;
}

.op-ports {
  color: #7a7a7a;
  font-family: monospace;
  font-size: 0.9375rem;
}

.port-badges {
  display: inline-flex;
  gap: 0.375rem;
  flex-wrap: wrap;
  justify-content: center;
}

.port-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #e8f9e7;
  color: #10e80c;
  border: 1px solid #10e80c;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  
  &:hover {
    background: #10e80c;
    color: #ffffff;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(16, 232, 12, 0.2);
  }
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;

  &.status-success,
  &.status-finished {
    background: #e8f5e9;
    color: #2e7d32;
  }

  &.status-failed {
    background: #ffebee;
    color: #c62828;
  }

  &.status-stopped,
  &.status-stopping,
  &.status-restarting {
    background: #fff3e0;
    color: #e65100;
  }

  &.status-pending {
    background: #fff8e1;
    color: #f57c00;
  }

  &.status-running,
  &.status-starting,
  &.status-waiting,
  &.status-init {
    background: #e3f2fd;
    color: #1565c0;
  }

  &.status-unknown {
    background: #f5f5f5;
    color: #616161;
  }
}

.action-buttons {
  display: inline-flex;
  gap: 0.5rem;
}

.action-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: #ffffff;
  color: #1a1a1a;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  svg {
    display: block;
    flex-shrink: 0;
  }

  &:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #d0d0d0;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  &.is-loading {
    position: relative;
    
    svg {
      opacity: 0;
    }
    
    &:after {
      position: absolute;
      content: "";
      left: calc(50% - 8px);
      top: calc(50% - 8px);
      width: 16px;
      height: 16px;
      border: 2px solid #dbdbdb;
      border-radius: 50%;
      border-right-color: transparent;
      border-top-color: transparent;
      animation: spinAround 0.5s infinite linear;
    }
  }
}

html.dark-mode {
  .groups-container {
    background: #2c2c2c;
  }

  .group-header {
    background: #1a1a1a;
    border-left-color: #10e80c;
  }

  .group-name {
    color: #ffffff;
  }

  .group-count {
    color: #b0b0b0;
  }

  .group-action-btn {
    background: #2c2c2c;
    border-color: #444;
    color: #ffffff;

    &:hover:not(:disabled) {
      background: #3a3a3a;
      border-color: #555;
    }
    
    &.is-loading {
      &:after {
        border-color: #666;
        border-right-color: transparent;
        border-top-color: transparent;
      }
    }
  }

  .operations-table {
    thead tr {
      border-bottom-color: #444;
    }

    thead th {
      color: #b0b0b0;
    }

    tbody tr.op-row {
      border-bottom-color: #333;

      &:hover {
        background-color: #2a2a2a;
      }

      &.is-expanded {
        background-color: #252525;
      }
    }

    tbody tr.op-details-row {
      border-bottom-color: #333;
    }
  }

  .op-details-container {
    background: #2a2a2a;
  }

  .op-info-panel {
    background: #2c2c2c;
    border-right-color: #444;
  }

  .op-info-section {
    .section-title {
      color: #ffffff;
    }
  }
  
  .op-logs-panel {
    background: #2c2c2c;
  }
  
  .logs-header {
    background: #2c2c2c;
    border-bottom-color: #444;
  }
  
  .logs-title {
    color: #ffffff;
  }

  .info-item {
    border-bottom-color: #333;
    
    &:first-child {
      padding-top: 0;
    }
    
    .info-label {
      color: #b0b0b0;
    }
    
    .info-value {
      color: #e0e0e0;
    }
  }

  .endpoint-item {
    background: #2a2a2a;
    border-color: #555;
  }
  
  .endpoints-empty {
    color: #666;
  }

  .endpoint-port {
    color: #e0e0e0;
  }

  .status-dot {
    &.dot-online {
      background: #66bb6a;
    }
    
    &.dot-offline {
      background: #ef5350;
    }
    
    &.dot-unknown {
      background: #ffa726;
    }
  }

  .endpoint-link {
    background: #10e80c;
    color: #1a1a1a;
    
    &:hover {
      background: #0ec909;
      box-shadow: 0 2px 4px rgba(16, 232, 12, 0.3);
    }
    
    .endpoint-url {
      color: #1a1a1a;
    }
  }

  .op-id {
    color: #e0e0e0;
  }

  .expand-icon {
    color: #b0b0b0;
  }

  .op-logs-content {
    background: #0d1117;
    border-color: #444;
  }

  .op-logs-viewer {
    color: #c9d1d9;
  }

  .log-entry {
    :deep(.timestamp) {
      color: #8b949e;
    }
    
    :deep(.info) {
      color: #58a6ff;
    }
    
    :deep(.error) {
      color: #f85149;
    }
    
    :deep(.warning) {
      color: #d29922;
    }
    
    :deep(.success) {
      color: #56d364;
    }
  }

  .op-logs-empty {
    color: #666;
    background: #0d1117;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-color: #444;
  }

  .op-image {
    color: #e0e0e0;
  }

  .op-ports {
    color: #b0b0b0;
  }

  .port-badge {
    background: rgba(16, 232, 12, 0.15);
    color: #10e80c;
    border-color: #10e80c;
    
    &:hover {
      background: #10e80c;
      color: #1a1a1a;
      box-shadow: 0 2px 4px rgba(16, 232, 12, 0.3);
    }
  }

  .status-badge {
    &.status-success,
    &.status-finished {
      background: rgba(46, 125, 50, 0.2);
      color: #66bb6a;
    }

    &.status-failed {
      background: rgba(198, 40, 40, 0.2);
      color: #ef5350;
    }

    &.status-stopped,
    &.status-stopping,
    &.status-restarting {
      background: rgba(230, 81, 0, 0.2);
      color: #ffa726;
    }

    &.status-pending {
      background: rgba(245, 124, 0, 0.2);
      color: #ffa726;
    }

    &.status-running,
    &.status-starting,
    &.status-waiting,
    &.status-init {
      background: rgba(21, 101, 192, 0.2);
      color: #42a5f5;
    }

    &.status-unknown {
      background: rgba(97, 97, 97, 0.2);
      color: #bdbdbd;
    }
  }

  .action-btn {
    background: #2c2c2c;
    border-color: #444;
    color: #ffffff;

    &:hover:not(:disabled) {
      background: #3a3a3a;
      border-color: #555;
    }
    
    &.is-loading {
      &:after {
        border-color: #666;
        border-right-color: transparent;
        border-top-color: transparent;
      }
    }
  }

  .loading-state,
  .empty-state {
    color: #b0b0b0;
  }
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

