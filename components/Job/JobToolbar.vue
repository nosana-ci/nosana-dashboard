<template>
  <div
    class="is-flex is-align-items-center is-justify-content-space-between mb-4"
  >
    <div class="is-flex is-align-items-center">
      <template v-if="isJobPoster && job.isRunning">
        <div class="mr-4">
          <EndpointsModal v-if="endpoints.size" :endpoints="endpoints" />
        </div>
        <div class="mr-4">
          <button
            @click="stopJob"
            :class="{ 'is-loading': loading }"
            class="button is-danger"
          >
            Stop Deployment
          </button>
        </div>
        <div class="mr-4">
          <button
            @click="openExtendModal"
            :class="{ 'is-loading': loadingExtend }"
            class="button is-warning"
          >
            Extend Deployment
          </button>
        </div>
      </template>
      <template v-if="isJobPoster && job.state === 0">
        <div class="mr-4">
          <button
            @click="stopJob"
            :class="{ 'is-loading': loading }"
            class="button is-warning"
          >
            Delist Job
          </button>
        </div>
      </template>
    </div>
    <div class="is-flex is-align-items-center">
      <div class="mr-4">
        <button
          @click="repostJob"
          class="button is-primary is-small is-outlined"
        >
          Repost
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

import EndpointsModal from "~/components/Job/Modals/Endpoints.vue";
import JobStatus from "~/components/Job/Status.vue";
import { useNosanaWallet } from "~/composables/useNosanaWallet";

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
const { isVerified, signMessage } = useNosanaWallet();

const loading = ref<boolean>(false);
const loadingExtend = ref<boolean>(false);

async function stopJob() {
  loading.value = true;

  if (!isVerified.value) {
    try {
      await signMessage(true);
    } catch (error) {
      loading.value = false;
      toast.error("Failed to verify wallet.");
      return;
    }
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
  // Generate a unique repost ID with timestamp
  const repostId = `repost-${Date.now()}`;
  
  // Store job information in localStorage
  localStorage.setItem(repostId, JSON.stringify({
    jobAddress: job.address,
    jobTimeout: (job.timeout / 3600).toFixed(2),
    marketAddress: job.market.toString(),
    timestamp: Date.now()
  }));
  
  // Navigate with minimal URL parameters
  router.push({
    path: "/deploy",
    query: {
      repostId: repostId
    },
  });
}
</script>
