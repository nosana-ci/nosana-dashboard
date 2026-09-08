<template>
  <div>
    <p v-if="loadingJob" class="has-text-grey py-5 has-text-centered" role="status">
      Loading access options…
    </p>
    <div
      v-else-if="jobError"
      class="notification is-danger is-light"
      role="alert"
    >
      <p>{{ jobError }}</p>
      <button type="button" class="button is-small is-quiet mt-3" @click="loadJob">
        Try again
      </button>
    </div>
    <JobAccessContent
      v-else-if="resolvedJob && node"
      :key="jobAddress"
      :job-address="jobAddress"
      :node="node"
      :project-address="projectAddress"
      :job-definition="resolvedJob.jobDefinition"
      :is-running="
        resolvedJob.state === JobState.RUNNING ||
        resolvedJob.state === 'RUNNING'
      "
      :deployment-id="deploymentId"
      :ssh-public-keys="sshPublicKeys"
      :ssh-keys-loading="loadingKeys"
      :ssh-keys-error="keysError"
      @retry-ssh-keys="loadKeys"
    />
    <div v-else class="notification is-info is-light">
      This job no longer has an assigned node. Try another running job.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeploymentNodeJob } from "@nosana/api";
import { JobState } from "@nosana/kit";
import { useDeploymentSshKeys } from "~/composables/useDeploymentSshKeys";
import { useLatestRequest } from "~/composables/useLatestRequest";
import { NULL_ADDRESS } from "~/utils/solana";
import JobAccessContent from "~/components/Job/AccessContent.vue";

const props = defineProps<{
  deploymentId: string;
  jobAddress: string;
  projectAddress: string;
}>();

const { nosana } = useKit();
const {
  sshPublicKeys,
  loading: loadingKeys,
  error: keysError,
  reload: loadKeys,
} = useDeploymentSshKeys(() => props.deploymentId);
const resolvedJob = shallowRef<DeploymentNodeJob | null>(null);
const loadingJob = ref(false);
const jobError = ref("");
const requests = useLatestRequest();

const node = computed(() => {
  const value = resolvedJob.value?.node;
  return value && value !== NULL_ADDRESS ? value : "";
});

const loadJob = async () => {
  const request = requests.begin();
  resolvedJob.value = null;
  jobError.value = "";
  loadingJob.value = false;
  const jobId = props.jobAddress;
  if (!requests.isCurrent(request) || !jobId) return;
  loadingJob.value = true;
  try {
    const deployment = await nosana.value.api.deployments.get(
      props.deploymentId,
    );
    if (!requests.isCurrent(request)) return;
    const job = await deployment.getJob(jobId);
    if (requests.isCurrent(request)) resolvedJob.value = job;
  } catch (error) {
    if (requests.isCurrent(request)) {
      jobError.value =
        error instanceof Error
          ? error.message
          : "Could not load this job’s access options.";
    }
  } finally {
    if (requests.isCurrent(request)) loadingJob.value = false;
  }
};

watch(
  [() => props.jobAddress, () => props.deploymentId, () => nosana.value.api],
  () => {
    void loadJob();
  },
  { immediate: true, flush: "sync" },
);</script>
