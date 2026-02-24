<template>
  <div v-if="endpoints.length > 0" class="mb-5">
    <h2 class="title is-5 mb-3">Endpoints</h2>
    <div class="box is-borderless">
      <div class="table-container">
        <table class="table is-fullwidth mb-0" style="table-layout: fixed">
          <thead>
            <tr>
              <th style="width: 25%">Operation</th>
              <th style="width: 10%">Port</th>
              <th style="width: 12%">Status</th>
              <th style="width: 53%">URL</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="endpoint in endpoints"
              :key="`${endpoint.opId}-${endpoint.port}`"
              :style="{
                opacity: isActiveOrStarting ? '1' : '0.5',
              }"
            >
              <td>{{ endpoint.opId }}</td>
              <td>{{ endpoint.port }}</td>
              <td>
                <StatusTag
                  :status="isActiveOrStarting ? 'ACTIVE' : 'INACTIVE'"
                />
              </td>
              <td>
                <a
                  v-if="isActiveOrStarting"
                  :href="endpoint.url"
                  target="_blank"
                  class="has-text-link endpoint-url"
                  >{{ endpoint.url }} ↗</a
                >
                <span
                  v-else
                  class="has-text-grey-light"
                  style="text-decoration: line-through"
                >
                  {{ endpoint.url }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatusTag from "~/components/Common/StatusTag.vue";

defineProps<{
  endpoints: { opId: string; port: number | string; url: string }[];
  isActiveOrStarting: boolean;
}>();
</script>

<style lang="scss" scoped>
.endpoint-url {
  word-break: break-all;
  display: inline-block;
  max-width: 100%;
  overflow-wrap: break-word;
}

@media screen and (max-width: 768px) {
  .endpoint-url {
    font-size: 0.75rem;
    max-width: 300px;
    min-width: 200px;
  }
}

@media screen and (max-width: 480px) {
  .endpoint-url {
    font-size: 0.7rem;
    max-width: 250px;
    min-width: 180px;
  }
}
</style>
