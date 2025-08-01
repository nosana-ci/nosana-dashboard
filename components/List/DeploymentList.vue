<template>
  <div class="deployment-list-container" ref="containerRef" :style="{ minHeight: dynamicMinHeight }">
  <div class="columns is-mobile is-vcentered">
    <div class="column">
      <h2 class="title" :class="{ 'is-5': small, 'is-4': !small }">
        {{ title ? title : 'Deployments' }}
      </h2>
    </div>
    <div v-if="jobs && jobs.length && (!small || (totalJobs && totalJobs > perPage))" class="column has-text-right">
      <span v-if="totalJobs && totalJobs > perPage">{{ (page - 1) * perPage + 1 }} -
        {{ Math.min(page * perPage, totalJobs) }} of</span>
      {{ totalJobs }} deployments
    </div>
  </div>
  <div class="is-flex is-flex-wrap-wrap state-filter">
    <div class="mr-2 my-2" v-if="!states || states.length >= 2">
      <a class="button is-primary is-outlined" :class="{
        'is-hovered': state === null,
        'is-small': small,
      }" @click="changeState(null)">
        <b><span>All</span></b>
      </a>
    </div>
    <div class="mr-2 my-2" v-if="!states || states.includes(2)">
      <a class="button is-success is-outlined" :class="{
        'is-hovered': state === 2,
        'is-small': small,
      }" @click="changeState(2)">
        <b><span>Completed</span></b>
      </a>
    </div>
    <div class="mr-2 my-2" v-if="!states || states.includes(1)">
      <a class="button is-info is-outlined" :class="{
        'is-hovered': state === 1,
        'is-small': small,
      }" @click="changeState(1)">
        <b><span>Running</span></b>
      </a>
    </div>
    <div class="mr-2 my-2" v-if="!states || states.includes(0)">
      <a class="button is-warning is-outlined" :class="{
        'is-hovered': state === 0,
        'is-small': small,
      }" @click="changeState(0)">
        <b><span>Queued</span></b>
      </a>
    </div>
    <div class="mr-2 my-2" v-if="!states || states.includes(3)">
      <a class="button is-dark is-outlined" :class="{
        'is-hovered': state === 3,
        'is-small': small,
      }" @click="changeState(3)">
        <b><span>Stopped</span></b>
      </a>
    </div>
  </div>

  <table class="table is-fullwidth is-striped is-hoverable mb-0" :class="{ 'is-small': small }">
    <thead>
      <tr>
        <th>Address</th>
        <th v-if="!small" class="is-hidden-touch">Host</th>
        <th>Started</th>
        <th class="is-hidden-mobile">Duration</th>
        <th v-if="!small" class="is-hidden-touch">Price</th>
        <th v-if="!small" class="is-hidden-touch">GPU</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="!jobs">
        <td colspan="5">Loading deployments..</td>
      </tr>
      <tr v-else-if="!jobs.length">
        <td colspan="5">No deployments</td>
      </tr>
      <tr v-for="job in jobs" v-else :key="job.address" class="clickable-row">
        <td>
          <a :href="`/jobs/${job.address}`" class="clickable-row-link">
            <span class="clickable-row-cell-content is-family-monospace address has-text-black">
              {{ job.address }}
            </span>
          </a>
        </td>
        <td v-if="!small" class="is-hidden-touch">
          <div class="clickable-row-cell-content is-family-monospace address">
            <span v-if="job.node.toString() === '11111111111111111111111111111111'">Unclaimed</span>
            <span v-else>
              {{ job.node }}
            </span>
          </div>
        </td>
        <td>
          <span class="clickable-row-cell-content">
            <UseTimeAgo v-if="job.timeStart" v-slot="{ timeAgo }" :time="new Date(job.timeStart * 1000)">
              {{ timeAgo }}
            </UseTimeAgo>
            <span v-else>-</span>
          </span>
        </td>
        <td class="is-family-monospace is-hidden-mobile">
          <span class="clickable-row-cell-content">
            <span v-if="job.timeStart && job.timeEnd">
              <SecondsFormatter :seconds="job.timeEnd - job.timeStart" :showSeconds="true" />
            </span>
            <span v-else-if="job.timeStart">
              <SecondsFormatter :seconds="Math.floor(timestamp / 1000) - job.timeStart" :showSeconds="true" />
            </span>
            <span v-else> - </span>
          </span>
        </td>
        <td v-if="!small" class="is-hidden-touch">
          <span class="clickable-row-cell-content">
            <!-- If job is Running (1) or Queued (0), show CURRENT market price -->
            <span v-if="job.state === 1 || job.state === 0">
              <CurrentMarketPrice
                :marketAddressOrData="job.market.toString()"
                :marketsData="testgridMarkets"
                :decimalPlaces="3" />
            </span>
            <!-- If job is Completed (2) or Stopped (3), show HISTORICAL job price -->
            <span v-else>
              <JobPrice
                :job="job"
                :options="{ showPerHour: false, decimalPlaces: 3 }"
                :marketsData="testgridMarkets" />
            </span>
          </span>
        </td>
        <td v-if="!small" class="is-hidden-touch">
          <span class="clickable-row-cell-content">
            <span v-if="
              testgridMarkets.find((tgm: any) => tgm.address === job.market.toString())
            ">
              {{
                testgridMarkets.find((tgm: any) => tgm.address === job.market.toString()).name
              }}
            </span>
            <span v-else class="is-family-monospace address">
              {{ job.market.toString() }}
            </span>
          </span>
        </td>
        <td>
          <div class="clickable-row-cell-content is-flex is-align-items-center">
            <JobStatus
              :status="job.state === 2 && job.jobStatus ? (job.jobStatus === 'success' ? 'SUCCESS' : 'FAILED') : job.state"
              :image-only="small"
            ></JobStatus>
            <span
              v-if="isHostPage && job.project === 'jobtF7TBbGWxFf4X7pJcG63fWbcpSzEizMrDxZ1t5i2' && (job.state === 1 || (job.state === 2 && job.timeStart && job.timeEnd))"
              class="tag is-small is-info ml-1"
              title="Benchmark job"
            >B</span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
  <pagination v-if="totalJobs && totalJobs > perPage" v-model="page" class="pagination is-centered mt-4"
    :total-page="Math.ceil(totalJobs / perPage)" :max-page="6">
  </pagination>
  <progress v-if="loadingJobs" class="progress is-small is-info my-0" max="100"></progress>
  </div>
</template>

<script setup lang="ts">
import type { Job } from '@nosana/sdk';
import { UseTimeAgo } from '@vueuse/components';
import type { PropType } from 'vue';
import { computed, nextTick } from 'vue';
import JobStatus from "~/components/Job/Status.vue";
import JobPrice from "~/components/Job/Price.vue";
import CurrentMarketPrice from "~/components/Market/CurrentPrice.vue";
import SecondsFormatter from "~/components/SecondsFormatter.vue";
import { useAPI } from "~/composables/useAPI";

// Fetch stats data needed for CurrentMarketPrice
const { data: stats, pending: loadingStats } = useAPI('/api/stats');

// Extended job type to include additional properties
interface ExtendedJob extends Job {
  address: string;
  usdRewardPerHour: number;
  jobStatus?: string;
}

// Fetch markets data for centralized pricing
const { data: testgridMarkets, pending: loadingTestgridMarkets } = await useAPI('/api/markets', { default: () => [] });


const timestamp = useTimestamp({ interval: 1000 });
const route = useRoute();
const isHostPage = computed(() => route.path.startsWith('/host/'));
const props = defineProps({
  jobs: {
    type: Array as PropType<Array<ExtendedJob>>,
    default: undefined,
  },
  states: {
    type: Array<number>,
    default: undefined
  },
  totalJobs: {
    type: Number,
    default: undefined,
  },
  title: {
    type: String,
    default: undefined,
  },
  small: {
    type: Boolean,
    default: false,
  },
  perPage: {
    type: Number,
    required: true,
  },
  loadingJobs: {
    type: Boolean,
    default: false,
  },
  select: {
    type: Boolean,
    default: false,
  },
});
const state = defineModel<number | null>('state', { default: null });
const changeState = (newState: number | null) => {
  page.value = 1;
  state.value = newState;
}
const page = defineModel<number>('page', { default: 1 })

// Dynamic height management to prevent layout shift during loading
const containerRef = ref<HTMLElement>()
const dynamicMinHeight = ref<string>('auto')

// Capture height before loading starts and maintain it during loading
watch(() => props.loadingJobs, (isLoading, wasLoading) => {
  if (!containerRef.value) return
  
  if (isLoading && !wasLoading) {
    // Loading started - capture current height
    const currentHeight = containerRef.value.offsetHeight
    if (currentHeight > 0) {
      dynamicMinHeight.value = `${currentHeight}px`
    }
  } else if (!isLoading && wasLoading) {
    // Loading finished - reset to auto after a brief delay to ensure smooth transition
    nextTick(() => {
      dynamicMinHeight.value = 'auto'
    })
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.table {
  white-space: nowrap;

  .address {
    max-width: 150px;
  }

  &.is-small {
    white-space: normal;
  }
}

@include touch {
  .table {
    white-space: normal;
  }
}

@include until-widescreen {
  .table {
    font-size: 12px;

    .address {
      max-width: 70px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

// Prevent box height changes during loading states
.deployment-list-container {
  // Height is now managed dynamically via JavaScript
}
</style> 