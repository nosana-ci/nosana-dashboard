<template>
  <div v-if="endpoints.length > 0" class="mb-5">
    <h2 class="title is-5 mb-3">Endpoints</h2>
    <div class="ep-card">
      <EndpointRow
        v-for="endpoint in endpoints"
        :key="`${endpoint.opId}-${endpoint.port}`"
        :name="endpoint.opId"
        :port="endpoint.port"
        :url="endpoint.url"
        :status="statusOf(endpoint)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import EndpointRow, {
  type EndpointStatus,
} from "~/components/Common/EndpointRow.vue";

type Endpoint = {
  opId: string;
  port: number | string;
  url: string;
  online: boolean;
};

const props = defineProps<{
  endpoints: Endpoint[];
  /**
   * Deployment-wide, not per-op: it separates an endpoint that is still coming
   * up from one whose deployment is not running at all. It does not say that
   * this particular op has a job.
   */
  activeJobs: number;
}>();

/**
 * `online` means the node's proxy for this op has registered, so the URL
 * answers. Until it does, a deployment with a job is still on its way up —
 * without one there is nothing coming.
 */
const statusOf = (endpoint: Endpoint): EndpointStatus => {
  if (endpoint.online) return "online";
  return props.activeJobs > 0 ? "starting" : "inactive";
};
</script>

<style lang="scss" scoped>
.ep-card {
  background: $white;
  border: 1px solid $grey-lighter;
  border-radius: 14px;
  overflow: hidden;
  padding: 8px;
}

html.dark-mode .ep-card {
  background: $black-ter;
  border-color: rgba($white, 0.08);
}
</style>
