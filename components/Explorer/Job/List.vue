<template>
  <div class="columns is-mobile is-vcentered">
    <div class="column">
      <h2 class="title" :class="{ 'is-5': small, 'is-4': !small }">
        {{ title ? title : 'Inferences' }}
      </h2>
    </div>
    <div v-if="!limit && filteredJobs && filteredJobs.length" class="column has-text-right">
      <span v-if="filteredJobs && filteredJobs.length > perPage">{{ (page - 1) * perPage + 1 }} -
        {{ Math.min(page * perPage, filteredJobs.length) }} of</span>
      {{ filteredJobs.length }} inferences
    </div>
  </div>
  <div class="is-flex is-flex-wrap-wrap state-filter">
    <div class="mr-2 my-2">
      <a href="#" class="button is-dark is-outlined" :class="{
        'is-hovered': state === null,
        'is-small': small,
      }" @click="state = null">
        <b><span>All</span></b>
      </a>
    </div>
    <div class="mr-2 my-2">
      <a href="#" class="button is-success is-outlined" :class="{
        'is-hovered': state === 2,
        'is-small': small,
      }" @click="state = 2">
        <b><span>Completed</span></b>
      </a>
    </div>
    <div class="mr-2 my-2">
      <a href="#" class="button is-info is-outlined" :class="{
        'is-hovered': state === 1,
        'is-small': small,
      }" @click="state = 1">
        <b><span>Running</span></b>
      </a>
    </div>
    <div class="mr-2 my-2">
      <a href="#" class="button is-warning is-outlined" :class="{
        'is-hovered': state === 0,
        'is-small': small,
      }" @click="state = 0">
        <b><span>Queued</span></b>
      </a>
    </div>
  </div>

  <table class="table is-fullwidth is-striped is-hoverable mb-0" :class="{ 'is-small': small }">
    <thead>
      <tr>
        <th>Address</th>
        <th>Started</th>
        <th class="is-hidden-mobile">Duration</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="!filteredJobs">
        <td colspan="5">Loading inferences..</td>
      </tr>
      <tr v-else-if="!filteredJobs.length">
        <td colspan="5">No inferences</td>
      </tr>
      <nuxt-link v-for="job in paginatedJobs" v-else :key="job.pubkey" :to="`/jobs/${job.pubkey}`" custom>
        <template #default="{ navigate }">
          <tr class="is-clickable remove-greyscale-on-hover" @click="navigate">
            <td>
              <div class="is-family-monospace address">
                {{ job.address }}
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
            <td>
              <ExplorerJobStatus :status="job.state" :image-only="small"></ExplorerJobStatus>
            </td>
          </tr>
        </template>
      </nuxt-link>
    </tbody>
  </table>
  <pagination v-if="filteredJobs && filteredJobs.length > perPage" v-model="page" class="pagination is-centered mt-4"
    :total-page="Math.ceil(filteredJobs.length / perPage)" :max-page="10">
  </pagination>
  <progress v-if="loadingJobs" class="progress is-small is-info my-0" max="100"></progress>
</template>

<script setup lang="ts">
import { UseTimeAgo } from '@vueuse/components';

const timestamp = useTimestamp({ interval: 1000 });
const fmtMSS = (s: number) => {
  return (s - (s %= 60)) / 60 + (s > 9 ? 'm:' : 'm:0') + s + 's';
};
const props = defineProps({
  jobs: {
    type: Array<{
      pubkey: any;
      timeStart: number;
      timeEnd: number;
      state: number;
    }>,
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
  limit: {
    type: Number,
    default: null,
  },
  loadingJobs: {
    type: Boolean,
    default: false,
  },
});
const state: Ref<number | null> = ref(null);

const page: Ref<number> = ref(1);
const perPage: Ref<number> = ref(25);

const jobStateMapping: any = {
  0: 'QUEUED',
  1: 'RUNNING',
  2: 'COMPLETED',
  3: 'STOPPED',
};

const filteredJobs = computed(() => {
  if (!props.jobs || !props.jobs.length) return props.jobs;
  let filteredJobs =
    state.value !== null
      ? props.jobs.filter((j) => {
        // check if running
        return (
          j.state === state.value || j.state === jobStateMapping[state.value]
        );
      })
      : props.jobs;
  if (props.limit) {
    filteredJobs = filteredJobs.slice(0, props.limit);
  }
  return filteredJobs;
});

const paginatedJobs = computed(() => {
  if (!filteredJobs.value || !filteredJobs.value.length)
    return filteredJobs.value;
  return filteredJobs.value.slice(
    (page.value - 1) * perPage.value,
    page.value * perPage.value,
  );
});
</script>

<style lang="scss" scoped>
@keyframes flash {
  50% {
    background-color: $primary;
  }
}

.flash {
  animation: flash 2s ease-out;
  animation-iteration-count: 1;
}

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
