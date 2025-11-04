<template>
  <button @click="open" class="button is-success">View Services</button>
  <template v-if="isOpen">
    <div class="modal is-active">
      <div class="modal-background" @click="close"></div>
      <div class="modal-card" style="width: auto">
        <header class="modal-card-head">
          <p class="modal-card-title">Services</p>
          <button class="delete" aria-label="close" @click="close"></button>
        </header>
        <section class="modal-card-body">
          <div class="table-container">
            <table class="table is-fullwidth is-striped">
            <thead>
              <tr>
                <th>Op ID</th>
                <th>Port</th>
                <th>Status</th>
                <th>URL</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(endpoint, name) in [...endpoints.values()]"
                :key="name"
              >
                <td>{{ endpoint.opId }}</td>
                <td>{{ endpoint.port }}</td>
                <td>
                  {{ endpoint.status }}
                  <span
                    v-if="endpoint.hasHealthCheck"
                    class="has-tooltip-arrow ml-1"
                    style="vertical-align: middle"
                    data-tooltip="No health check provided."
                  >
                    <InfoIcon />
                  </span>
                </td>
                <td>
                  <a
                    v-if="endpoint.status !== 'OFFLINE'"
                    :href="endpoint.url"
                    target="_blank"
                    ><span class="endpoint-url">{{ endpoint.url }}</span
                    ><img
                      src="~assets/img/icons/external.png"
                      width="10px"
                      style="margin-left: 5px"
                  /></a>
                  <span v-else class="endpoint-url">{{ endpoint.url }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </section>
      </div>
    </div>
  </template>
</template>
<script setup lang="ts">
import type { Endpoints } from "~/composables/jobs/useJob";
import { useModal } from "~/composables/jobs/useModal";
import InfoIcon from '@/assets/img/icons/info.svg?component';

interface Props {
  endpoints: Endpoints;
}

const { endpoints } = defineProps<Props>();

const { isOpen, close, open } = useModal();
</script>

<style lang="scss" scoped>
// Responsive endpoint URLs
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
