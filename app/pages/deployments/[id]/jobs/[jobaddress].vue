<template>
  <div />
</template>

<script setup lang="ts">
// The job panel on the deployment page replaced this page. Old links land
// on the deployment with the panel open on that job.
definePageMeta({
  middleware: (to) =>
    navigateTo(
      {
        path: `/deployments/${to.params.id as string}`,
        query: { job: to.params.jobaddress as string, view: "details" },
      },
      { replace: true },
    ),
});
</script>
