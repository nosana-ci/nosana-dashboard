<template>
  <div>
    <TopBar
      title="Job Overview"
      subtitle="Find information about your job here"
      ref="topBar"
      v-model="showSettingsModal"
    />

    <Loader v-if="loading" />
    <div v-else-if="!job" class="box">
      <div class="notification is-danger">
        <p>Job not found</p>
      </div>
    </div>

    <div v-else>
      <Job
        :job="job"
        :modal="modal"
        :endpoints="endpoints"
        :nosPrice="nosPrice"
        :isJobPoster="isJobPoster"
        :jobInfo="jobInfo"
        :deploymentId="deploymentId"
        :hideFields="{ marketAddress: true, price: true, gpuPoolName: true }"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
// Views
import Job from "~/components/Job/Job.vue";
import { useDeploymentJobPage } from "~/composables/jobs/useDeploymentJobPage";
const showSettingsModal = ref(false);
const { params } = useRoute();

const jobId = ref<string>(params.jobaddress as string);
const deploymentId = ref<string | null>(params.id as string || null);

const { job, modal, endpoints, nosPrice, isJobPoster, loading, jobInfo } = useDeploymentJobPage(
  deploymentId.value as string,
  jobId.value
);
</script>

<style lang="scss" scoped>
.loading-message,
.not-found-message {
  color: $text;
  padding: 1rem;
  text-align: center;
}

html.dark-mode {
  .loading-message,
  .not-found-message {
    color: $white;
  }
}
</style>


