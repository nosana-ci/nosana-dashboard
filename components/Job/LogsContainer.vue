<template>
  <div class="job-logs-container">
    <div v-if="job" class="logs-wrapper">      
      <!-- Logs Content -->
      <div class="logs-content-wrapper">
        <JobLogsView
          :job="job"
          :isJobPoster="isJobPoster"
          :loading="loading"
          :isConnecting="isConnecting"
          :logConnectionEstablished="logConnectionEstablished"
          :systemLogs="systemLogs"
          :containerLogs="containerLogs"
          :progressBars="progressBars"
          :resourceProgressBars="resourceProgressBars"
          :activeLogs="activeLogs"
          :opIds="opIds"
          :filters="filters"
          :selectOp="selectOp"
          :toggleType="toggleType"
        />
      </div>
    </div>
    <div v-else-if="loading" class="has-text-centered p-4">
      Loading job logs...
    </div>
    <div v-else class="has-text-centered p-4">
      Job not found
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import JobLogsView from './Tabs/SystemLogs.vue';
import { useJob } from '~/composables/jobs/useJob';
import { useFLogs } from '~/composables/jobs/useFLogs';
import { useWallet } from 'solana-wallets-vue';

interface Props {
  jobId: string;
  deploymentId?: string;
}

const props = defineProps<Props>();

// Use the existing useJob composable 
const { job, loading, endpoints, pausePolling } = useJob(props.jobId);

// Pause job polling since we only need the initial job data for logs
// The flog system handles live updates via WebSocket
onMounted(() => {
  pausePolling();
});

// Authentication setup (use DM header when deploymentId is provided)
const { hasAuth, ensureAuth } = useAuthHeader();
const getAuth = async () => {
  if (props.deploymentId) return ensureAuth({ deploymentId: props.deploymentId });
  return ensureAuth();
};

// Check if user is job poster
const { status, data: userData } = useAuth();
const { connected, publicKey } = useWallet();

// Consider DM-vault auth on deployment page equivalent to poster for viewing logs
const isJobPoster = computed(() => {
  if (!job.value) return false;
  
  // Check for credit users
  if (status.value === 'authenticated' && userData.value?.generatedAddress) {
    return userData.value.generatedAddress === job.value.project?.toString();
  }
  
  // Check for wallet users  
  if (connected.value && publicKey.value) {
    return publicKey.value.toString() === job.value.project?.toString();
  }
  
  // If viewing from a deployment context and we can fetch DM auth, allow logs
  if (props.deploymentId) return true;
  return false;
});

// Connection logic (matching main branch pattern)
const hasRealNode = computed(() => Boolean(job.value?.node && job.value.node !== '11111111111111111111111111111111'));
// Allow connection when running and node is real; auth is enforced server-side with DM header
const shouldConnect = computed(() => Boolean(job.value?.isRunning) && hasRealNode.value);

// Use flog system for logs (matching main branch exact pattern)
const {
  tabs: flogTabs,
  activeTab: flogActiveTab,
  setActiveTab: setFlogActiveTab,
  activeLogs: flogActiveLogs,
  isConnecting,
  connectionEstablished: logConnectionEstablished,
  progressBars: flogProgressBarsRef,
  resourceProgressBars: flogResourceBarsRef,
} = useFLogs(
  props.jobId,
  computed(() => job.value?.node),
  shouldConnect,
  getAuth
);

// Map to expected interface for JobLogsView
const activeLogs = flogActiveLogs;
const progressBars = computed(() => flogProgressBarsRef.value as unknown as Map<string, any>);
const resourceProgressBars = flogResourceBarsRef;
const opIds = computed(() => flogTabs.value.filter(t => t !== 'system'));
const filters = computed(() => ({ 
  value: { 
    opId: flogActiveTab.value === 'system' ? null : flogActiveTab.value, 
    types: new Set(['container','info','error']) 
  } 
}));
const selectOp = (opId: string | null) => {
  setFlogActiveTab(opId ?? 'system');
};
const toggleType = () => {};

// Legacy logs (empty for flog-only mode)
const systemLogs = ref([]);
const containerLogs = ref([]);

// Copy functionality
const logsTextForCopy = computed(() => {
  return activeLogs.value?.map(log => log.content).join('\n') || '';
});

const copyToClipboard = async (text: string | undefined, type: string) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

</script>

<style lang="scss" scoped>
.job-logs-container {
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.logs-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.logs-content-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}


:deep(.logs-tab-container) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.logs-container) {
  flex: 1;
  min-height: 400px;
}

</style>