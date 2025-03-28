<template>
  <div class="p-1 py-4 has-background-white-bis">
    <div v-if="job.isRunning" class="has-text-grey">Waiting for results...</div>
    <div v-else-if="!job.jobResult" class="has-text-grey">
      This container did not have a results regex
    </div>
    <VueJsonPretty v-else :data="job.jobResult" show-icon show-line-number />
  </div>
</template>
<script setup lang="ts">
import VueJsonPretty from "vue-json-pretty";

import "vue-json-pretty/lib/styles.css";
import type { UseJob } from "~/composables/jobs/useJob";

interface Props {
  job: UseJob;
}

const { job } = defineProps<Props>();
</script>
