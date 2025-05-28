<template>
  <div>
    <TopBar
      :title="'Deployment Page'"
      :subtitle="'Find information about your deployment here'"
      ref="topBar"
      v-model="showSettingsModal"
    />

    <div>
      <Job
        v-if="job"
        :job="job"
        :modal="modal"
        :endpoints="endpoints"
        :nosPrice="nosPrice"
        :isJobPoster="isJobPoster"
      />
      <div v-else-if="loading" class="loading-message">Loading job..</div>
      <div v-else class="not-found-message">Job not found</div>
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

const jobId = ref<string>(params.id as string);

const { job, modal, endpoints, nosPrice, isJobPoster, loading } = useJobPage(
  jobId.value
);
</script>

<style lang="scss" scoped>
.loading-message,
.not-found-message {
  color: #363636;
  padding: 1rem;
  text-align: center;
}

html.dark-mode {
  .loading-message,
  .not-found-message {
    color: #ffffff;
  }
}
</style>
