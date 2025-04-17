<template>
  <div>
    <TopBar
      :title="'Deployment Page'"
      :subtitle="'Find information about your deployment here'"
      ref="topBar"
      v-model="showSettingsModal"
    />

    <div class="box">
      <Job
        v-if="job"
        :job="job"
        :modal="modal"
        :endpoints="endpoints"
        :nosPrice="nosPrice"
        :isJobPoster="isJobPoster"
      />
      <div v-else-if="loading">Loading job..</div>
      <div v-else>Job not found</div>
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
