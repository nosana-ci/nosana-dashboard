<template>
  <TopBar :title="'Deployer Page'" :subtitle="'Details about this Model Deployer'">
  </TopBar>
  <div class="box">
    <!-- Quick Details Compact Grid -->
    <div class="content mb-5">
      <div class="columns is-multiline is-variable is-0 no-padding is-justify-content-flex-start mb-0">
        <!-- General Account Info -->
        <GeneralInfo :address="address" />
        
        <!-- Deployer Info (if deployer) -->
        <template v-if="isPoster">
          <!-- Deployments -->
          <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
            <div class="quick-detail-item">
              <span class="quick-detail-label">Deployments</span>
              <span class="quick-detail-value">
                <span v-if="loadingJobs">...</span>
                <span v-else-if="jobs">{{ jobs.totalJobs }}</span>
                <span v-else class="has-text-danger">Could not retrieve deployments</span>
              </span>
            </div>
          </div>
        </template>
        
        <template v-else>
          <!-- Not a deployer status -->
          <div class="column is-full" v-if="!loadingJobs">
            <div class="quick-detail-item">
              <span class="quick-detail-label">Deployer Status</span>
              <span class="quick-detail-value">Not a deployer</span>
            </div>
          </div>
          <div class="column is-full" v-else>
            <div class="quick-detail-item">
              <span class="quick-detail-label">Status</span>
              <span class="quick-detail-value">Checking if account is the model deployer..</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Deployment List -->
    <div v-if="isPoster">
      <DeploymentList
        :per-page="limit"
        :total-jobs="totalJobs"
        v-model:page="page"
        :loading-jobs="loadingJobs"
        title="Deployments Ran"
        :jobs="jobs?.jobs || []"
        :states="[1, 2]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import GeneralInfo from "~/components/Info/GeneralInfo.vue";
import DeploymentList from "~/components/List/DeploymentList.vue";
// Removed: import PosterInfo from "~/components/Poster/Info.vue"; // No longer needed
// Added: Import ExplorerJobList if it's not auto-imported by Nuxt
// import ExplorerJobList from '~/components/Explorer/JobList.vue'; // Assuming path, adjust if needed

const { params } = useRoute();

const address: Ref<string> = ref(params.id as string);

// Start: Moved script content from PosterInfo.vue
const page: Ref<number> = ref(1);
const state: Ref<number | null> = ref(null);
const jobStateMapping: any = {
  0: 'QUEUED',
  1: 'RUNNING',
  2: 'COMPLETED',
  3: 'STOPPED',
};
const limit: Ref<number> = ref(10);

const jobsUrl: ComputedRef<string> = computed(() => {
  // Use the existing 'address' ref directly
  return (
    `/api/jobs?limit=${limit.value}` +
    `&offset=${(page.value - 1) * limit.value}` +
    `${state.value !== null ? `&state=${jobStateMapping[state.value]}` : ''}` +
    `&poster=${address.value}` // Changed from props.address
  )
});

// Assuming useAPI is globally available or imported elsewhere
const { data: jobs, pending: loadingJobs } = useAPI(jobsUrl, { watch: [jobsUrl] });

const hasPostedJobs: ComputedRef<boolean> = computed(() => {
  // Ensure jobs.value exists before accessing its properties
  return !!(jobs.value && jobs.value.jobs && jobs.value.jobs.length > 0)
});

const isPoster: ComputedRef<boolean> = computed(() => { // Note: Changed from Boolean to boolean for consistency
  return hasPostedJobs.value
});

const totalJobs = computed(() => {
  return jobs.value?.totalJobs ?? undefined;
});
// End: Moved script content from PosterInfo.vue
</script>

<style lang="scss" scoped>
// Quick Details specific styling
.quick-detail-item {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  height: 100%;

  .quick-detail-label {
    font-size: 0.7rem;
    font-weight: 600;
    color: #7a7a7a;
    text-transform: uppercase;
    margin-bottom: 0.1rem;
  }

  .quick-detail-value {
    font-size: 0.85rem;
    font-weight: 500;
    color: #363636;
    word-break: break-word;

    .icon-text {
      color: #363636;
    }
  }
}

.no-padding {
  padding: 0 !important;
}

html.dark-mode {
  .quick-detail-item {
    .quick-detail-label {
      color: #b0b0b0;
    }

    .quick-detail-value,
    .quick-detail-value .icon-text {
      color: #ffffff;
    }
  }
}
</style> 