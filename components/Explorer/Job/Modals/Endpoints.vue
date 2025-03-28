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
                    <img src="~/assets/img/icons/info.svg" />
                  </span>
                </td>
                <td>
                  <a
                    v-if="endpoint.status !== 'OFFLINE'"
                    :href="endpoint.url"
                    target="_blank"
                    ><span>{{ endpoint.url }}</span
                    ><img
                      src="~assets/img/icons/external.png"
                      width="10px"
                      style="margin-left: 5px"
                  /></a>
                  <span v-else>{{ endpoint.url }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  </template>
</template>
<script setup lang="ts">
import type { Endpoints } from "~/composables/jobs/useJob";
import { useModal } from "~/composables/jobs/useModal";

interface Props {
  endpoints: Endpoints;
}

const { endpoints } = defineProps<Props>();

const { isOpen, close, open } = useModal();
</script>
