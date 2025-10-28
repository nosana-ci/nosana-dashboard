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
        :hideJobNavigation="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Views
import Job from "~/components/Job/Job.vue";
// Composables
import { useJobPage } from "~/composables/jobs/useJobPage";

const showSettingsModal = ref(false);
const { params } = useRoute();

const deploymentId = ref<string>(params.id as string);
const jobAddress = ref<string>(params.jobAddress as string);

const { job, modal, endpoints, nosPrice, isJobPoster, loading, jobInfo } = useJobPage(
  jobAddress.value
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