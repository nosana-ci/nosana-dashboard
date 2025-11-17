<template>
  <div :class="{ 'min-height-container': loadingJobs || loadingNodeJobs }">
    <div class="table-container">
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
            <td colspan="7" class="has-text-centered py-6">
              Loading deployments...
            </td>
          </tr>
          <tr v-else-if="displayedJobs.length === 0">
            <td colspan="7" class="has-text-centered">No deployments found</td>
          </tr>
          <template v-else>
            <tr
              v-for="job in displayedJobs"
              :key="job.address"
              class="clickable-row"
            >
              <td>
                <NuxtLink
                  :to="`/jobs/${job.address}`"
                  class="clickable-row-link"
                >
                  <div
                    class="clickable-row-cell-content is-flex is-align-items-center"
                  >
                    <NvidiaIcon
                      alt="Nvidia"
                      class="mr-2"
                      style="width: 20px; height: 20px"
                    />
                    <span
                      v-if="
                        testgridMarkets &&
                        testgridMarkets.find(
                          (tgm: any) => tgm.address === job.market.toString()
                        )
                      "
                    >
                      {{
                        testgridMarkets.find(
                          (tgm: any) => tgm.address === job.market.toString()
                        ).name
                      }}
                    </span>
                    <span v-else class="is-family-monospace">{{
                      job.market.toString()
                    }}</span>
                  </div>
                </NuxtLink>
              </td>
              <td>
                <div
                  class="clickable-row-cell-content is-flex is-align-items-center"
                >
                  <template v-if="getTemplateForJob(job)">
                    <div class="template-icon mr-2">
                      <img
                        :src="getTemplateForJob(job)?.icon"
                        :alt="getTemplateForJob(job)?.name"
                      />
                    </div>
                    <span>{{ getTemplateForJob(job)?.name }}</span>
                  </template>
                  <template v-else>
                    <template v-if="isGHCR(getJobImage(job))">
                      <div class="container-icon mr-2">
                        <GithubIcon
                          alt="GitHub"
                          class="github-icon"
                          style="width: 16px; height: 16px"
                        />
                      </div>
                    </template>
                    <template v-else>
                      <div class="container-icon mr-2">
                        <img
                          src="/img/icons/type/docker.svg"
                          alt="Docker"
                          class="docker-icon"
                          style="width: 16px; height: 16px"
                        />
                      </div>
                    </template>
                    <span class="is-family-monospace">{{
                      getJobImage(job)
                    }}</span>
                  </template>
                </div>
              </td>
              <td>
                <span class="clickable-row-cell-content">
                  <span v-if="nodeSpecs[job.node]">{{
                    formatCountry(nodeSpecs[job.node].country)
                  }}</span>
                  <span v-else>-</span>
                </span>
              </td>
              <td>
                <span class="clickable-row-cell-content">
                  <span v-if="job.timeStart">{{
                    formatTimeAgo(job.timeStart)
                  }}</span>
                  <span v-else>-</span>
                </span>
              </td>
              <td class="is-hidden-mobile">
                <span class="clickable-row-cell-content">
                  <span v-if="job.timeStart && job.timeEnd">
                    <SecondsFormatter
                      :seconds="job.timeEnd - job.timeStart"
                      :showSeconds="true"
                    />
                  </span>
                  <span v-else>-</span>
                </span>
              </td>
              <td class="is-hidden-touch">
                <span class="clickable-row-cell-content">
                  <JobPrice
                    :job="job"
                    :options="{
                      showPerHour:
                        job.state === 1 || (!job.timeStart && !job.timeEnd),
                    }"
                    :marketsData="testgridMarkets"
                  />
                </span>
              </td>
              <td>
                <div class="clickable-row-cell-content">
                  <div
                    class="tag is-outlined status-tag"
                    :class="{
                      'is-success': job.state === 2,
                      'is-info': job.state === 1,
                      'is-warning': job.state === 0,
                      'is-dark': job.state === 3,
                      'is-light': ![0, 1, 2, 3].includes(job.state),
                    }"
                  >
                    <component
                      class="mr-2 status-icon"
                      :is="getStatusIconComponent(job.state)"
                    />
                    <span>{{ getStatusText(job.state) }}</span>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>

  <Pagination
    v-if="totalPages > 1"
    v-model="currentPage"
    class="pagination is-centered mt-4"
    :total-page="totalPages"
    :max-page="6"
  />
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useWallet } from "solana-wallets-vue";
import NvidiaIcon from "@/assets/img/icons/nvidia.svg?component";
import GithubIcon from "@/assets/img/icons/github.svg?component";
import PlusSymbolIcon from "@/assets/img/icons/plus_symbol.svg?component";
import RunningIcon from "@/assets/img/icons/status/running.svg?component";
import StoppedIcon from "@/assets/img/icons/status/stopped.svg?component";
import FailedIcon from "@/assets/img/icons/status/failed.svg?component";
import QueuedIcon from "@/assets/img/icons/status/queued.svg?component";
import DoneIcon from "@/assets/img/icons/status/done.svg?component";
import { useTemplates } from "~/composables/useTemplates";
import { useMarkets } from "~/composables/useMarkets";
import JobPrice from "~/components/Job/Price.vue";
import SecondsFormatter from "~/components/SecondsFormatter.vue";
import { computed, type PropType } from "vue";
import { useStatus } from "~/composables/useStatus";

const router = useRouter();
const { publicKey: walletPublicKey } = useWallet();
const { templates } = useTemplates();
const { status, data: userData } = useAuth();

const activeAddress = computed(() => {
  if (status.value === "authenticated" && userData.value?.generatedAddress) {
    return userData.value.generatedAddress;
  }
  if (walletPublicKey.value) {
    return walletPublicKey.value.toString();
  }
  return null;
});

const props = defineProps({
  itemsPerPage: {
    type: Number,
    default: 10,
  },
  jobType: {
    type: String,
    default: "combined", // 'posted', 'node', or 'combined'
    validator: (value: string) =>
      ["posted", "node", "combined"].includes(value),
  },
  statusFilter: {
    type: [String, null] as PropType<string | null>,
    default: null,
  },
});

const emit = defineEmits(["update:total-deployments"]);

const currentPage = ref(1);

// Convert string status filter to number for backwards compatibility
const currentState = computed(() => {
  if (props.statusFilter === null) return null;
  return parseInt(props.statusFilter) || null;
});

const jobStateMapping: Record<number, string> = {
  0: "QUEUED",
  1: "RUNNING",
  2: "COMPLETED",
  3: "STOPPED",
};

// URL for posted jobs
const postedJobsUrl = computed(() => {
  const address = activeAddress.value;
  if (!address) return "";
  return `/api/jobs?limit=${props.itemsPerPage}&offset=${(currentPage.value - 1) * props.itemsPerPage}${currentState.value !== null ? `&state=${jobStateMapping[currentState.value as keyof typeof jobStateMapping]}` : ""}&poster=${address}`;
});

// URL for node jobs
const nodeJobsUrl = computed(() => {
  const address = activeAddress.value;
  if (!address) return "";
  return `/api/jobs?limit=${props.itemsPerPage}&offset=${(currentPage.value - 1) * props.itemsPerPage}${currentState.value !== null ? `&state=${jobStateMapping[currentState.value as keyof typeof jobStateMapping]}` : ""}&node=${address}`;
});

// Fetch jobs API calls
const {
  data: postedJobs,
  pending: loadingJobs,
  refresh: refreshPostedJobs,
} = useAPI(
  () => {
    return activeAddress.value ? postedJobsUrl.value : "";
  },
  {
    default: () => ({ jobs: [], totalJobs: 0 }),
  }
);

const {
  data: nodeJobs,
  pending: loadingNodeJobs,
  refresh: refreshNodeJobs,
} = useAPI(() => (activeAddress.value ? nodeJobsUrl.value : ""), {
  default: () => ({ jobs: [], totalJobs: 0 }),
});

// Combine jobs and remove duplicates
const combinedJobs = computed(() => {
  switch (props.jobType) {
    case "posted":
      return postedJobs.value?.jobs || [];
    case "node":
      return nodeJobs.value?.jobs || [];
    case "combined":
    default:
      const allJobs = [
        ...(postedJobs.value?.jobs || []),
        ...(nodeJobs.value?.jobs || []),
      ];
      return allJobs.filter(
        (job, index, self) =>
          index === self.findIndex((j) => j.address === job.address)
      );
  }
});

// Create a new computed property for the jobs actually displayed in the table
const displayedJobs = computed(() => {
  // Take the combined & deduplicated jobs and apply the itemsPerPage limit
  return combinedJobs.value.slice(0, props.itemsPerPage);
});

const totalJobs = computed(() => {
  switch (props.jobType) {
    case "posted":
      return postedJobs.value?.totalJobs || 0;
    case "node":
      return nodeJobs.value?.totalJobs || 0;
    case "combined":
    default:
      const postedTotal = postedJobs.value?.totalJobs || 0;
      const nodeTotal = nodeJobs.value?.totalJobs || 0;
      return Math.max(postedTotal, nodeTotal);
  }
});

// Emit total jobs count when it changes
watch(
  totalJobs,
  (newValue) => {
    emit("update:total-deployments", newValue);
  },
  { immediate: true }
);

const totalPages = computed(() =>
  Math.ceil(totalJobs.value / props.itemsPerPage)
);

const formatTimeAgo = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const { data: testgridMarkets } = useAPI("/api/markets", { default: () => [] });

const { markets, getMarkets } = useMarkets();
if (!markets.value) {
  getMarkets();
}

const getStatusIconComponent = (state: number) => {
  switch (state) {
    case 2:
      return DoneIcon;
    case 1:
      return RunningIcon;
    case 0:
      return QueuedIcon;
    case 3:
      return StoppedIcon;
    default:
      return StoppedIcon;
  }
};

// Store node specifications
const nodeSpecs = ref<Record<string, any>>({});

// Helper function to format country code to full name
const formatCountry = (countryCode: string) => {
  if (!countryCode) return "-";
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ||
      countryCode
    );
  } catch {
    return countryCode;
  }
};

// Helper function to fetch node specs
const fetchNodeSpecs = async (nodeAddress: string) => {
  if (!nodeAddress || nodeAddress === "11111111111111111111111111111111")
    return null;

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
watch(
  [combinedJobs, currentPage],
  async ([jobs]) => {
    if (!jobs) return;

    // Get unique node addresses that we haven't fetched yet
    const nodeAddresses = [...new Set(jobs.map((job) => job.node))].filter(
      (address) =>
        !nodeSpecs.value[address as string] &&
        address !== "11111111111111111111111111111111"
    );

    // Fetch specs for each node in parallel
    const specsPromises = nodeAddresses.map(async (nodeAddress) => {
      const specs = await fetchNodeSpecs(nodeAddress as string);
      if (specs) {
        nodeSpecs.value[nodeAddress as string] = specs;
      }
    });

    await Promise.all(specsPromises);
  },
  { immediate: true }
);

// Add watcher for status filter changes
watch(
  () => currentState.value,
  () => {
    // Reset to first page when filter changes
    currentPage.value = 1;

    // Refresh the data
    refreshPostedJobs();
    refreshNodeJobs();
  },
  { immediate: false }
);

// Add watcher for page changes
watch(
  () => currentPage.value,
  () => {
    // Refresh the data when page changes
    refreshPostedJobs();
    refreshNodeJobs();
  },
  { immediate: false }
);

// Helper function to get job image from job definition
const getJobImage = (job: any) => {
  if (!job.jobDefinition?.ops?.length) return "Unknown";
  const firstOp = job.jobDefinition.ops[0];
  if (firstOp.type === "container/run" && firstOp.args?.image) {
    return firstOp.args.image;
  }
  return "Unknown";
};

// Helper function to find template for a job
const getTemplateForJob = (job: any) => {
  if (!templates.value || !job.jobDefinition) return null;
  return templates.value.find(
    (t) => JSON.stringify(t.jobDefinition) === JSON.stringify(job.jobDefinition)
  );
};

// Helper function to check if image is from GHCR
const isGHCR = (image: string) => {
  return image.startsWith("ghcr.io");
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
  background-color: #0a0a0a;
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
  background-color: #0a0a0a;
  border-color: #363636;
}

.github-icon {
  position: relative;
  top: -1px;
}

.docker-icon {
  filter: invert(48%) sepia(90%) saturate(2299%) hue-rotate(188deg)
    brightness(97%) contrast(91%);
  width: 16px;
  height: 16px;
}

.dark-mode .docker-icon {
  filter: invert(48%) sepia(90%) saturate(2299%) hue-rotate(188deg)
    brightness(97%) contrast(91%);
}

.dark-mode img[src*="github.svg"] {
  filter: invert(1);
}

.dark-mode .tag img[src*="status/stopped.svg"] {
  filter: brightness(100) !important;
}

.button:hover {
  color: #10e80c !important;
  border-color: #10e80c !important;
}

.plus-icon {
  display: inline-flex;
  align-items: center;
  fill: currentColor;
  position: relative;
  top: -1px;
}

.button:hover .plus-icon {
  fill: #10e80c;
}

.dark-mode .tag img[src*="status/stopped.svg"] {
  filter: brightness(100) !important;
}

.min-height-container {
  min-height: 430px;
}

/* Fix for option key type error */
select option {
  value: any;
}
</style>
