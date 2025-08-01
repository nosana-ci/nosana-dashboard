<template>
  <TopBar :title="'Host Page'" :subtitle="'Details about this Nosana Host'">
  </TopBar>
  <div class="box">
    <!-- Quick Details Compact Grid -->
    <div class="content mb-5">
      <div class="columns is-multiline is-variable is-0 no-padding is-justify-content-flex-start mb-0">
        <!-- General Account Info -->
        <GeneralInfo :address="address" />
        <!-- Host Info -->
        <HostInfo :address="address" />
      </div>
    </div>
  </div>
  
  <!-- Benchmark Histograms -->
  <div class="columns" v-if="nodeSpecs && benchmarkMarketId">
    <div class="column is-6">
      <NodeBenchmarkHistogram
        title="LLM Performance"
        type="llm"
        :node-id="address"
        :market-id="benchmarkMarketId"
        default-metric="averageTokensPerSecond"
        :metrics="[
          { value: 'averageTokensPerSecond', label: 'Tokens / Second' },
          { value: 'avgClockSpeed', label: 'Clock Speed (MHz)' },
          { value: 'avgWattage', label: 'Power Usage (W)' },
          { value: 'avgTemperature', label: 'Temperature (°C)' },
        ]"
        x-axis-label="Concurrent Users"
      />
    </div>
    <div class="column is-6">
      <NodeBenchmarkHistogram
        title="Image Generation Performance"
        type="image-gen"
        :node-id="address"
        :market-id="benchmarkMarketId"
        default-metric="imagesPerSecond"
        :metrics="[
          { value: 'imagesPerSecond', label: 'Images / Second' },
          { value: 'avgClockSpeed', label: 'Clock Speed (MHz)' },
          { value: 'avgWattage', label: 'Power Usage (W)' },
          { value: 'avgTemperature', label: 'Temperature (°C)' },
        ]"
        x-axis-label="Batch Size"
      />
    </div>
  </div>
  
  <!-- Deployments ran list moved from HostInfo to here -->
  <DeploymentList
    :per-page="limit"
    :total-jobs="totalJobs"
    v-model:page="page"
    v-model:state="state"
    :loading-jobs="loadingJobs"
    title="Deployments Ran"
    :jobs="jobs?.jobs || []"
    :states="[1, 2]"
  />
</template>

<script setup lang="ts">
import GeneralInfo from "~/components/Info/GeneralInfo.vue";
import HostInfo from "~/components/Info/HostInfo.vue";
import DeploymentList from "~/components/List/DeploymentList.vue";
import NodeBenchmarkHistogram from "~/components/BenchmarkHistogram.vue";
import { ref, computed, watch } from 'vue';
import type { Ref, ComputedRef } from 'vue';

const { params } = useRoute();
const address: Ref<string> = ref(params.id as string);

// Node Specs & Benchmark Market ID
const { data: nodeSpecs, pending: loadingSpecs } = useAPI(
  `/api/nodes/${address.value}/specs`,
  {
    // @ts-ignore
    disableToastOnError: true,
  }
);

// Create a ref to store the market relation result
const marketRelationId = ref<string | null>(null);

// Define a function to fetch the market relation
async function fetchMarketRelation() {
  if (
    nodeSpecs.value?.status === "ONBOARDED" &&
    nodeSpecs.value.marketAddress
  ) {
    try {
      const { data } = await useAPI(
        `/api/nodes/market-relation?market=${nodeSpecs.value.marketAddress}`
      );
      marketRelationId.value = data.value;
    } catch (err) {
      console.error("Error fetching market relation:", err);
    }
  }
}

watch(
  nodeSpecs,
  (newSpecs) => {
    if (newSpecs && newSpecs.status === "ONBOARDED" && newSpecs.marketAddress) {
      fetchMarketRelation();
    }
  },
  { immediate: true }
);

const benchmarkMarketId = computed(() => {
  if (!nodeSpecs.value || !nodeSpecs.value.marketAddress) {
    return undefined;
  }
  if (nodeSpecs.value.status === "ONBOARDED") {
    if (!marketRelationId.value) {
      return undefined;
    }
    return marketRelationId.value;
  }
  return nodeSpecs.value.marketAddress;
});

// Job list data - moved from HostInfo
const page: Ref<number> = ref(1);
const state: Ref<number | null> = ref(null);
const jobStateMapping: Record<number, string> = {
  0: "QUEUED",
  1: "RUNNING",
  2: "COMPLETED",
  3: "STOPPED",
};
const limit: Ref<number> = ref(10);
const jobsUrl: ComputedRef<string> = computed(() => {
  return `/api/jobs?limit=${limit.value}&offset=${
    (page.value - 1) * limit.value
  }${state.value !== null ? `&state=${jobStateMapping[state.value]}` : ""}${
    "&node=" + address.value
  }`;
});

interface JobsResponse {
  totalJobs: number;
  jobs: any[];
}

const { data: jobs, pending: loadingJobs } = useAPI(
  jobsUrl,
  { watch: [jobsUrl] }
);

const totalJobs = computed(() => {
  return jobs.value?.totalJobs ?? undefined;
});
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
