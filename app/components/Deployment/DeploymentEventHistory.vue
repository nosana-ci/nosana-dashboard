<template>
  <div>
    <h2 class="title is-5 mb-3">History</h2>

    <div class="box is-borderless">
      <div class="table-container">
        <table class="table is-fullwidth mb-0">
          <thead>
            <tr>
              <th>Type</th>
              <th>Category</th>
              <th>Message</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="events.length === 0">
              <td colspan="5" class="has-text-centered has-text-grey py-6">
                No events yet
              </td>
            </tr>
            <tr v-else v-for="(event, index) in events" :key="index">
              <td>
                <span class="tag is-small category-tag">{{ event.type }}</span>
              </td>
              <td>
                <span class="tag is-small category-tag">{{
                  event.category
                }}</span>
              </td>
              <td>
                <span
                  :class="{
                    'is-family-monospace': event.message.length > 200,
                  }"
                >
                  {{ event.message }}
                </span>
              </td>
              <td class="has-text-grey">
                {{ formatDate(event.created_at) }}
              </td>
              <td>
                <a
                  v-if="event.tx"
                  :href="`https://solscan.io/tx/${event.tx}`"
                  target="_blank"
                  class="button is-small is-light"
                  title="View transaction"
                >
                  TX ↗
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeploymentEventItem } from "@nosana/api";
import { formatDate } from "~/utils/formatDate";

defineProps<{
  events: DeploymentEventItem[];
}>();
</script>
