<template>
  <div
    class="is-flex is-align-items-center is-justify-content-space-between mb-4"
  >
    <div class="is-flex is-align-items-center">
      <template v-if="isJobPoster && job.state === 0">
        <div class="mr-4">
          <button
            @click="stopJob"
            :class="{ 'is-loading': loading }"
            class="button is-outlined"
          >
            Delist Job
          </button>
        </div>
      </template>
    </div>
    <div class="is-flex is-align-items-center">
      <template v-if="isJobPoster && job.isRunning">
        <div class="mr-4">
          <button
            @click="stopJob"
            :class="{ 'is-loading': loading }"
            class="button is-outlined"
          >
            Stop
          </button>
        </div>
        <div class="mr-4">
          <button
            @click="openExtendModal"
            :class="{ 'is-loading': loadingExtend }"
            class="button is-outlined"
          >
            Extend
          </button>
        </div>
      </template>
      <div class="mr-4">
        <button
          @click="repostJob"
          class="button is-outlined"
        >
          Redeploy
        </button>
      </div>
      <JobStatus
        :status="
          job.isCompleted && job.jobStatus
            ? job.jobStatus === 'success'
              ? 'SUCCESS'
              : 'FAILED'
            : job.state
        "
      >
      </JobStatus>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from "vue-toastification";

import JobStatus from "~/components/Job/Status.vue";
import { useNosanaWallet } from "~/composables/useNosanaWallet";
import { useDeployPageState } from "~/composables/useDeployPageState";

import { type Endpoints, type UseJob } from "~/composables/jobs/useJob";

interface Props {
  job: UseJob;
  isJobPoster: boolean;
  endpoints: Endpoints;
  openExtendModal: () => void;
}

const { job, isJobPoster, endpoints, openExtendModal } = defineProps<Props>();

const toast = useToast();
const router = useRouter();
const { generateAuthHeaders } = useNosanaWallet();

const loading = ref<boolean>(false);
const loadingExtend = ref<boolean>(false);

async function stopJob() {
  loading.value = true;

  // Ensure we can generate headers (will sign if needed); do not force time-bound headers
  try {
    await generateAuthHeaders({ key: 'Authorization' });
  } catch (error) {
    loading.value = false;
    toast.error("Failed to verify wallet.");
    return;
  }

  try {
    await job.stopJob();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('Job is already COMPLETED') && !message.includes('Job is already STOPPED')) {
       toast.error(`Failed to initiate stop/delist: ${message}`); 
    }
    console.error("Error calling job.stopJob():", error);
  } finally {
    loading.value = false;
  }
}

function repostJob() {
  // Use unified state persistence system
  const { saveState } = useDeployPageState();
  
  // Convert seconds to hours (keep decimal precision)
  const calculatedHours = job.timeout / 3600;
  
  // Save the current job configuration to deploy state
  saveState({
    selectedMarket: null, // Will be restored from market address
    selectedTemplate: null, // Will be determined from job definition
    jobDefinition: job.jobDefinition,
    hours: calculatedHours,
    gpuTab: 'simple',
    gpuTypeCheckbox: ['PREMIUM'],
    activeFilter: 'PREMIUM'
  }, 'redeploy');
  
  // Navigate to deploy page - state will be automatically restored
  router.push("/deploy");
}
</script>
