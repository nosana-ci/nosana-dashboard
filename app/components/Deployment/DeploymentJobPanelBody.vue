<template>
  <p v-if="loading" class="section-empty" role="status">Loading job…</p>
  <p v-else-if="!job" class="section-empty">Job not found or delisted.</p>
  <Job
    v-else
    mode="panel"
    :job="job"
    :modal="modal"
    :endpoints="endpoints"
    :nosPrice="nosPrice"
    :isJobPoster="isJobPoster"
    :jobInfo="jobInfo"
    :deploymentId="deploymentId"
    :sshPublicKeys="sshPublicKeys"
    :sshKeysLoading="sshKeysLoading"
    :sshKeysError="sshKeysError"
    :hideFields="{ marketAddress: true, price: true, gpuPoolName: true }"
    :panel-tab="view"
    :panel-active="active"
    :auto-connect-op="autoConnectOp"
    :deployment-endpoints="deploymentEndpoints"
  />
</template>

<script setup lang="ts">
import Job from "~/components/Job/Job.vue";
import { useDeploymentJobPage } from "~/composables/jobs/useDeploymentJobPage";

// One replica's data, mounted once and kept while the panel is open so its
// streams and shells survive switching to another replica.
const props = defineProps<{
  deploymentId: string;
  jobAddress: string;
  view: "details" | "containers" | "activity";
  active: boolean;
  autoConnectOp: string;
  /** The deployment's endpoint status, shown on the container cards. Named
   *  apart from the job's own `endpoints` map below. */
  deploymentEndpoints: Array<{
    opId: string;
    port: number | string;
    online: boolean;
  }>;
}>();

const {
  job,
  modal,
  endpoints,
  nosPrice,
  isJobPoster,
  loading,
  jobInfo,
  sshPublicKeys,
  sshKeysLoading,
  sshKeysError,
} = useDeploymentJobPage(props.deploymentId, props.jobAddress);
</script>
