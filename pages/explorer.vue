<template>
  <div>
    <TopBar
      :title="'Explorer'"
      :subtitle="'Overview'"
      ref="topBar"
      v-model="showSettingsModal"
    ></TopBar>
    <div class="box has-background-white-ter">
      <Search />
    </div>
    <JobStats />
    <JobTimestamps />
    <div class="columns mt-4 is-multiline">
      <div class="column is-6">
        <div class="box is-flex is-flex-direction-column">
          <JobLatest />
        </div>
      </div>
      <div class="column is-6">
        <div class="box is-flex is-flex-direction-column">
          <h2 class="title is-5">GPUs</h2>
          <MarketQueues></MarketQueues>
          <div class="has-text-right mt-auto pt-2">
            <nuxt-link to="/markets" class="button is-text">
              <span>All GPUs</span>
              <span class="icon"> &#8250; </span>
            </nuxt-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Search from "~/components/Search.vue";
import JobStats from "~/components/Job/Stats.vue";
import JobTimestamps from "~/components/Job/Timestamps.vue";
import JobLatest from "~/components/Job/Latest.vue";
import MarketQueues from "~/components/Market/Queues.vue";

const showSettingsModal = ref(false);
</script>
