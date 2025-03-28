<template>
  <div
    class="is-flex is-align-items-center is-justify-content-space-between mb-4"
  >
    <div class="is-flex is-align-items-center">
      <template v-if="isJobPoster && job.isRunning">
        <div
          v-if="
            endpoints.size && [...endpoints.values()][0].status !== 'UNKNOWN'
          "
          class="mr-4"
        >
          <a
            :href="[...endpoints.values()][0].url"
            target="_blank"
            class="button is-success"
          >
            Visit Service
          </a>
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
      <ExplorerJobStatus
        :status="
          job.isCompleted && job.jobStatus
            ? job.jobStatus === 'success'
              ? 'SUCCESS'
              : 'FAILED'
            : job.state
        "
      >
      </ExplorerJobStatus>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from "vue-toastification";
import { type Endpoints, type UseJob } from "~/composables/jobs/useJob";
import { useNosanaWallet } from "~/composables/useNosanaWallet";

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
    toast.success("Job stopped successfully.");
  } catch (error) {
    toast.error("Failed to stop job.");
  } finally {
    loading.value = false;
  }
}

function repostJob() {
  router.push({
    path: "/jobs/create",
    query: {
      fromRepost: "true",
      jobAddress: job.address,
      jobTimeout: (job.timeout / 3600).toFixed(2),
      step: "deploy-model",
      marketAddress: job.market.toString(),
    },
  });
}
</script>
