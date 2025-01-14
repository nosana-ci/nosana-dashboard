<template>
  <div class="columns is-mobile is-vcentered">
    <div class="column">
      <h2 class="title" :class="{ 'is-5': small, 'is-4': !small }">
        {{ title ? title : 'Jobs' }}
      </h2>
    </div>
    <div v-if="jobs && jobs.length && (!small || (totalJobs && totalJobs > perPage))" class="column has-text-right">
      <span v-if="totalJobs && totalJobs > perPage">{{ (page - 1) * perPage + 1 }} -
        {{ Math.min(page * perPage, totalJobs) }} of</span>
      {{ totalJobs }} jobs
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
        <th v-if="!small" class="is-hidden-touch">Market</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="!jobs">
        <td colspan="5">Loading jobs..</td>
      </tr>
      <tr v-else-if="!jobs.length">
        <td colspan="5">No jobs</td>
      </tr>
      <nuxt-link v-for="job in jobs" v-else :key="job.address" :to="`/jobs/${job.address}`" custom>
        <template #default="{ navigate }">
          <tr class="is-clickable remove-greyscale-on-hover" @click="navigate">
            <td>
              <nuxt-link :to="`/jobs/${job.address}`" class="is-family-monospace address has-text-black">
                {{ job.address }}
              </nuxt-link>
            </td>
            <td v-if="!small" class="is-hidden-touch">
              <div class="is-family-monospace address">
                <span v-if="job.node.toString() === '11111111111111111111111111111111'">Unclaimed</span>
                <span v-else>
                  {{ job.node }}
                </span>
              </div>
            </td>

            <td>
              <UseTimeAgo v-if="job.timeStart" v-slot="{ timeAgo }" :time="new Date(job.timeStart * 1000)">
                {{ timeAgo }}
              </UseTimeAgo>
              <span v-else>-</span>
            </td>
            <td class="is-family-monospace is-hidden-mobile">
              <span v-if="job.timeStart && job.timeEnd">
                {{ fmtMSS(job.timeEnd - job.timeStart) }}
              </span>
              <span v-else-if="job.timeStart">
                {{ fmtMSS(Math.floor(timestamp / 1000) - job.timeStart) }}
              </span>
              <span v-else> - </span>
            </td>
            <td v-if="!small" class="is-hidden-touch">
              <span v-if="job.timeEnd && job.timeStart && !job.timeout">
                <span v-if="stats && stats[0] && stats[0].price">
                  $
                  {{
                    ((job.price / 1e6) * Math.min(job.timeEnd - job.timeStart, job.timeout ? job.timeout :
                      7200) * stats[0].price).toFixed(2)
                  }}
                </span>
                <span v-else>

                  {{
                    ((job.price / 1e6) * Math.min(job.timeEnd - job.timeStart, job.timeout ? job.timeout :
                      7200)).toFixed(6)
                  }}
                  NOS</span>
              </span>
              <span v-else>
                <span v-if="stats && stats[0] && stats[0].price">
                  ${{ ((job.price / 1e6) * 3600 * stats[0].price).toFixed(2) }} / h
                </span>
                <span v-else>
                  {{ (job.price / 1e6) }}
                  NOS/s
                </span>
              </span>
            </td>
            <td v-if="!small" class="is-hidden-touch">
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

            </td>
            <td>
              <ExplorerJobStatus
                :status="job.state === 2 && job.jobStatus ? (job.jobStatus === 'success' ? 'SUCCESS' : 'FAILED') : job.state"
                :image-only="small">
              </ExplorerJobStatus>
            </td>
          </tr>
        </template>
      </nuxt-link>
    </tbody>
  </table>
  <pagination v-if="totalJobs && totalJobs > perPage" v-model="page" class="pagination is-centered mt-4"
    :total-page="Math.ceil(totalJobs / perPage)" :max-page="6">
  </pagination>
  <progress v-if="loadingJobs" class="progress is-small is-info my-0" max="100"></progress>
</template>

<script setup lang="ts">
import type { Job } from '@nosana/sdk';
import { UseTimeAgo } from '@vueuse/components';

const { data: testgridMarkets, pending: loadingTestgridMarkets } = await useAPI('/api/markets', { default: () => [] });

const { data: stats, pending: loadingStats } = await useAPI('/api/stats');

const timestamp = useTimestamp({ interval: 1000 });
const fmtMSS = (s: number) => {
  return (s - (s %= 60)) / 60 + (s > 9 ? 'm:' : 'm:0') + s + 's';
};
const props = defineProps({
  jobs: {
    type: Array<Job & { address: string }>,
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
});
const state: Ref<number | null> = defineModel('state', { default: null });
const changeState = (newState: number | null) => {
  page.value = 1;
  state.value = newState;
}
const page: Ref<number> = defineModel('page', { default: 1 })
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
</style>
