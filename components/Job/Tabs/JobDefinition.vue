<template>
  <div>
    <div class="p-1 py-4 has-background-white">
      <VueJsonPretty :data="jobDefinition" show-icon show-line-number />
    </div>
  </div>
</template>

<script setup lang="ts">
import VueJsonPretty from "vue-json-pretty";
import type { JobDefinition } from "@nosana/sdk";

interface Props {
  jobDefinition: JobDefinition;
}

const { jobDefinition } = defineProps<Props>();
</script>
