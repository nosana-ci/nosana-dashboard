<template>
  <div class="box" style="margin-top: 1rem; height: auto; max-height: none;">
    <div class="columns is-multiline">
      <div class="column is-12">
        <div class="is-flex is-justify-content-space-between is-align-items-center mb-4">
          <div class="select status-select">
            <select v-model="currentState">
              <option v-for="filterState in filterStates" 
                :key="filterState.value === null ? 'null' : filterState.value" 
                :value="filterState.value"
              >
                {{ filterState.label }}
              </option>
            </select>
          </div>
          <nuxt-link to="/deploy" class="button has-background-white has-text-black" style="border: 1px solid black; transition: all 0.2s ease;">
            <PlusSymbolIcon class="plus-icon" style="width: 14px; height: 14px; margin-right: 0.5rem; transition: fill 0.2s ease;" />
            <span>Deploy Model</span>
          </nuxt-link>
        </div>

        <div :class="{'min-height-container': loadingJobs || loadingNodeJobs}">
          <table class="table is-fullwidth is-striped is-hoverable">
            <thead>
              <tr>
                <th>GPU</th>
                <th>Image</th>
                <th>Country</th>
                <th>Started</th>
                <th class="is-hidden-mobile">Duration</th>
                <th class="is-hidden-touch">Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loadingJobs || loadingNodeJobs">
                <td colspan="7" class="has-text-centered loading-cell">Loading deployments...</td>
              </tr>
              <tr v-else-if="displayedJobs.length === 0">
                <td colspan="7" class="has-text-centered">No deployments found</td>
              </tr>
              <template v-else>
                <tr v-for="job in displayedJobs" :key="job.address" class="is-clickable" @click="navigateToJob(job.address)">
                  <td>
                    <div class="is-flex is-align-items-center">
                      <img src="@/assets/img/icons/nvidia.svg" alt="Nvidia" class="mr-2" style="width: 20px; height: 20px;">
                      <span v-if="testgridMarkets && testgridMarkets.find((tgm: any) => tgm.address === job.market.toString())">
                        {{ testgridMarkets.find((tgm: any) => tgm.address === job.market.toString()).name }}
                      </span>
                      <span v-else class="is-family-monospace">{{ job.market.toString() }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="is-flex is-align-items-center">
                      <template v-if="getTemplateForJob(job)">
                        <div class="template-icon mr-2">
                          <img :src="getTemplateForJob(job)?.icon" :alt="getTemplateForJob(job)?.name">
                        </div>
                        <span>{{ getTemplateForJob(job)?.name }}</span>
                      </template>
                      <template v-else>
                        <template v-if="isGHCR(getJobImage(job))">
                          <div class="container-icon mr-2">
                            <img src="@/assets/img/icons/github.svg" alt="GitHub" class="github-icon" style="width: 16px; height: 16px;">
                          </div>
                        </template>
                        <template v-else>
                          <div class="container-icon mr-2">
                            <img src="/img/icons/type/docker.svg" alt="Docker" class="docker-icon" style="width: 16px; height: 16px;">
                          </div>
                        </template>
                        <span class="is-family-monospace">{{ getJobImage(job) }}</span>
                      </template>
                    </div>
                  </td>
                  <td>
                    <span v-if="nodeSpecs[job.node]">{{ formatCountry(nodeSpecs[job.node].country) }}</span>
                    <span v-else>-</span>
                  </td>
                  <td>
                    <span v-if="job.timeStart">{{ formatTimeAgo(job.timeStart) }}</span>
                    <span v-else>-</span>
                  </td>
                  <td class="is-hidden-mobile">
                    <span v-if="job.timeStart && job.timeEnd">
                      {{ formatDuration(job.timeEnd - job.timeStart) }}
                    </span>
                    <span v-else>-</span>
                  </td>
                  <td class="is-hidden-touch">
                    <JobPrice :job="job" :options="{ showPerHour: job.state === 1 || (!job.timeStart && !job.timeEnd) }" />
                  </td>
                  <td>
                    <div class="tag is-outlined" :class="{
                      'is-success': job.state === 2,
                      'is-info': job.state === 1,
                      'is-warning': job.state === 0,
                      'has-background-white has-text-black': job.state === 3,
                      'is-light': job.state !== 3
                    }" :style="job.state === 3 ? 'border: 1px solid black;' : ''">
                      <img class="mr-2 status-icon" :src="`/img/icons/status/${getStatusIcon(job.state)}.svg`" :style="job.state === 3 ? 'filter: brightness(0);' : ''" />
                      <span>{{ getStatusText(job.state) }}</span>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <nav v-if="totalPages > 1" class="pagination is-centered mt-4" role="navigation">
          <a class="pagination-previous" :class="{ 'is-disabled': currentPage === 1 }" @click="currentPage > 1 && changePage(currentPage - 1)">Previous</a>
          <a class="pagination-next" :class="{ 'is-disabled': currentPage === totalPages }" @click="currentPage < totalPages && changePage(currentPage + 1)">Next</a>
          <ul class="pagination-list">
            <li v-for="item in displayedPages" :key="item.page">
              <span v-if="item.isEllipsis" class="pagination-ellipsis">&hellip;</span>
              <a v-else
                class="pagination-link"
                :class="{ 'is-current': item.page === currentPage }"
                @click="changePage(item.page)"
              >
                {{ item.page }}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useWallet } from 'solana-wallets-vue';
import PlusSymbolIcon from '@/assets/img/icons/plus_symbol.svg?component';
import { useTemplates } from '~/composables/useTemplates';
import { useMarkets } from '~/composables/useMarkets';
import JobPrice from "~/components/Job/Price.vue";
import { computed } from 'vue';

const router = useRouter();
const { publicKey: walletPublicKey } = useWallet();
const { templates } = useTemplates();

const props = defineProps({
  itemsPerPage: {
    type: Number,
    default: 10
  }
});

const emit = defineEmits(['update:total-deployments']);

const currentPage = ref(1);
const currentState = ref<number | null>(null);

// Fix the type issue with filterStates
const filterStates = [
  { label: 'All', value: null as null },
  { label: 'Completed', value: 2 as number },
  { label: 'Running', value: 1 as number },
  { label: 'Queued', value: 0 as number },
  { label: 'Stopped', value: 3 as number }
];

const jobStateMapping: Record<number, string> = {
  0: "QUEUED",
  1: "RUNNING",
  2: "COMPLETED",
  3: "STOPPED",
};

// URL for posted jobs
const postedJobsUrl = computed(() => {
  const address = walletPublicKey.value?.toString();
  if (!address) return '';
  return `/api/jobs?limit=${props.itemsPerPage}&offset=${(currentPage.value - 1) * props.itemsPerPage}${currentState.value !== null ? `&state=${jobStateMapping[currentState.value as keyof typeof jobStateMapping]}` : ''}&poster=${address}`;
});

// URL for node jobs
const nodeJobsUrl = computed(() => {
  const address = walletPublicKey.value?.toString();
  if (!address) return '';
  return `/api/jobs?limit=${props.itemsPerPage}&offset=${(currentPage.value - 1) * props.itemsPerPage}${currentState.value !== null ? `&state=${jobStateMapping[currentState.value as keyof typeof jobStateMapping]}` : ''}&node=${address}`;
});

// Fetch jobs API calls
const { data: postedJobs, pending: loadingJobs, refresh: refreshPostedJobs } = useAPI(() => 
  walletPublicKey.value ? postedJobsUrl.value : '', { 
  default: () => ({ jobs: [], totalJobs: 0 })
});

const { data: nodeJobs, pending: loadingNodeJobs, refresh: refreshNodeJobs } = useAPI(() => 
  walletPublicKey.value ? nodeJobsUrl.value : '', { 
  default: () => ({ jobs: [], totalJobs: 0 })
});

// Combine jobs and remove duplicates
const combinedJobs = computed(() => {
  const allJobs = [
    ...(postedJobs.value?.jobs || []),
    ...(nodeJobs.value?.jobs || [])
  ];
  return allJobs.filter((job, index, self) =>
    index === self.findIndex((j) => j.address === job.address)
  );
});

// Create a new computed property for the jobs actually displayed in the table
const displayedJobs = computed(() => {
  // Take the combined & deduplicated jobs and apply the itemsPerPage limit
  return combinedJobs.value.slice(0, props.itemsPerPage);
});

const totalJobs = computed(() => {
  const postedTotal = postedJobs.value?.totalJobs || 0;
  const nodeTotal = nodeJobs.value?.totalJobs || 0;
  // This calculation remains an approximation for pagination controls (Previous/Next enabling)
  // A more accurate total would require a dedicated API endpoint or fetching all jobs.
  return Math.max(postedTotal, nodeTotal); 
});

// Emit total jobs count when it changes
watch(totalJobs, (newValue) => {
  emit('update:total-deployments', newValue);
}, { immediate: true });

const totalPages = computed(() => Math.ceil(totalJobs.value / props.itemsPerPage));

const displayedPages = computed(() => {
  const pages = [];
  const maxVisiblePages = 5; // Number of pages to show on each side of current page
  
  if (totalPages.value <= maxVisiblePages * 2 + 1) {
    // If total pages is small enough, show all pages
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push({ page: i, isEllipsis: false });
    }
  } else {
    // Always add first page
    pages.push({ page: 1, isEllipsis: false });

    // Calculate range around current page
    let rangeStart = Math.max(2, currentPage.value - maxVisiblePages);
    let rangeEnd = Math.min(totalPages.value - 1, currentPage.value + maxVisiblePages);

    // Add ellipsis after first page if needed
    if (rangeStart > 2) {
      pages.push({ page: -1, isEllipsis: true });
    }

    // Add pages around current page
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push({ page: i, isEllipsis: false });
    }

    // Add ellipsis before last page if needed
    if (rangeEnd < totalPages.value - 1) {
      pages.push({ page: -1, isEllipsis: true });
    }

    // Always add last page
    pages.push({ page: totalPages.value, isEllipsis: false });
  }

  return pages;
});

const formatTimeAgo = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const { data: testgridMarkets, pending: loadingTestgridMarkets } = useAPI('/api/markets', { default: () => [] });

const { markets, getMarkets, loadingMarkets } = useMarkets();
if (!markets.value) {
  getMarkets();
}

const getStateButtonClass = (state: number | null) => {
  if (state === currentState.value) {
    return 'is-active';
  }
  switch (state) {
    case null: return 'is-outlined';
    case 2: return 'is-success is-outlined';
    case 1: return 'is-info is-outlined';
    case 0: return 'is-warning is-outlined';
    case 3: return 'is-dark is-outlined';
    default: return 'is-outlined';
  }
};

const getStatusClass = (state: number) => {
  switch (state) {
    case 2: return 'tag is-success';
    case 1: return 'tag is-info';
    case 0: return 'tag is-warning';
    case 3: return 'tag is-dark';
    default: return 'tag';
  }
};

const getStatusText = (state: number) => {
  switch (state) {
    case 2: return 'Completed';
    case 1: return 'Running';
    case 0: return 'Queued';
    case 3: return 'Stopped';
    default: return 'Unknown';
  }
};

const getStatusIcon = (state: number) => {
  switch (state) {
    case 2: return 'done';
    case 1: return 'running';
    case 0: return 'queued';
    case 3: return 'stopped';
    default: return 'stopped';
  }
};

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const navigateToJob = (address: string) => {
  router.push(`/jobs/${address}`);
};

// Store node specifications
const nodeSpecs = ref<Record<string, any>>({});

// Helper function to format country code to full name
const formatCountry = (countryCode: string) => {
  if (!countryCode) return "-";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
};

// Helper function to fetch node specs
const fetchNodeSpecs = async (nodeAddress: string) => {
  if (!nodeAddress || nodeAddress === '11111111111111111111111111111111') return null;
  
  try {
    const { data } = await useAPI(`/api/nodes/${nodeAddress}/specs`);
    if (data.value) {
      return data.value;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching specs for node ${nodeAddress}:`, error);
    return null;
  }
};

// Watch for changes in combined jobs to fetch node specs
watch([combinedJobs, currentPage], async ([jobs]) => {
  if (!jobs) return;
  
  // Get unique node addresses that we haven't fetched yet
  const nodeAddresses = [...new Set(jobs.map(job => job.node))]
    .filter(address => !nodeSpecs.value[address] && address !== '11111111111111111111111111111111');
  
  // Fetch specs for each node in parallel
  const specsPromises = nodeAddresses.map(async (nodeAddress) => {
    const specs = await fetchNodeSpecs(nodeAddress);
    if (specs) {
      nodeSpecs.value[nodeAddress] = specs;
    }
  });
  
  await Promise.all(specsPromises);
}, { immediate: true });

// Add watcher for status filter changes
watch(() => currentState.value, () => {
  // Reset to first page when filter changes
  currentPage.value = 1;
  
  // Refresh the data
  refreshPostedJobs();
  refreshNodeJobs();
}, { immediate: false });

// Add watcher for page changes
watch(() => currentPage.value, () => {
  // Refresh the data when page changes
  refreshPostedJobs();
  refreshNodeJobs();
}, { immediate: false });

// Helper function to get job image from job definition
const getJobImage = (job: any) => {
  if (!job.jobDefinition?.ops?.length) return 'Unknown';
  const firstOp = job.jobDefinition.ops[0];
  if (firstOp.type === 'container/run' && firstOp.args?.image) {
    return firstOp.args.image;
  }
  return 'Unknown';
};

// Helper function to find template for a job
const getTemplateForJob = (job: any) => {
  if (!templates.value || !job.jobDefinition) return null;
  return templates.value.find(t => 
    JSON.stringify(t.jobDefinition) === JSON.stringify(job.jobDefinition)
  );
};

// Helper function to check if image is from GHCR
const isGHCR = (image: string) => {
  return image.startsWith('ghcr.io');
};
</script>

<style scoped>
.address {
  font-family: monospace;
  font-size: 0.9em;
}

.table td {
  vertical-align: middle;
}

.tag {
  min-width: 80px;
  justify-content: center;
}

.pagination-previous.is-disabled,
.pagination-next.is-disabled {
  opacity: 0.5;
  pointer-events: none;
}

@media screen and (max-width: 768px) {
  .address {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
  }
}

.template-icon {
  background-color: #ffffff;
  border: 1px solid #dbdbdb;
  width: 24px;
  height: 24px;
  border-radius: 100%;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.template-icon img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.dark-mode .template-icon {
  background-color: #2C2C2C;
  border-color: #363636;
}

.container-icon {
  background-color: #ffffff;
  border: 1px solid #dbdbdb;
  width: 24px;
  height: 24px;
  border-radius: 100%;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.dark-mode .container-icon {
  background-color: #2C2C2C;
  border-color: #363636;
}

.github-icon {
  position: relative;
  top: -1px;
}

.docker-icon {
  filter: invert(48%) sepia(90%) saturate(2299%) hue-rotate(188deg) brightness(97%) contrast(91%);
  width: 16px;
  height: 16px;
}

.dark-mode .docker-icon {
  filter: invert(48%) sepia(90%) saturate(2299%) hue-rotate(188deg) brightness(97%) contrast(91%);
}

.dark-mode img[src*="github.svg"] {
  filter: invert(1);
}

.dark-mode .tag img[src*="status/stopped.svg"] {
  filter: brightness(100) !important;
}

.button:hover {
  color: #10E80C !important;
  border-color: #10E80C !important;
}

.plus-icon {
  display: inline-flex;
  align-items: center;
  fill: currentColor;
  position: relative;
  top: -1px;
}

.button:hover .plus-icon {
  fill: #10E80C;
}

.status-icon {
  width: 14px;
  height: 14px;
}

.dark-mode .tag img[src*="status/stopped.svg"] {
  filter: brightness(100) !important;
}

.loading-cell {
  padding: 2rem 0;
}

.min-height-container {
  min-height: 430px;
}

/* Fix for option key type error */
select option {
  value: any;
}
</style> 