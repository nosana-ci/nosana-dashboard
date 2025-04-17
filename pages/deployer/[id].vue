<template>
  <TopBar :title="'Deployer Page'" :subtitle="'Details about this Model Deployer'">
  </TopBar>
  <div class="box">
    <!-- General Account Info -->
    <GeneralInfo :address="address" />
    <!-- Deployer Specifications (if deployer) -->
    <div>
      <div v-if="!isPoster">
        <div v-if="loadingJobs">
          Checking if account is the model deployer..
        </div>
        <div v-else>
          <!-- Not a deployer-->
        </div>
      </div>
      <div v-else>
        <table class="table is-fullwidth two-column-labels">
          <tbody>
            <tr>
              <td colspan="2" class="has-background-light">
                <h4 class="title is-5 mb-0">Deployer Info</h4>
              </td>
            </tr>
            <tr>
              <td>Deployments</td>
              <td v-if="loadingJobs">...</td>
              <td v-else-if="jobs">
                <span>{{ jobs.totalJobs }}</span>
              </td>
              <td v-else class="has-text-danger">Could not retrieve deployments</td>
            </tr>
          </tbody>
        </table>

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