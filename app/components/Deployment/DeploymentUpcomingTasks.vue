<template>
  <div class="mb-5">
    <div
      class="is-flex is-justify-content-space-between is-align-items-center mb-3"
    >
      <h2 class="title is-5 mb-0">Upcoming Tasks</h2>
      <button
        class="button is-small"
        @click="$emit('refresh')"
        :class="{ 'is-loading': tasksLoading }"
        :disabled="tasksLoading"
        data-tooltip="Refresh upcoming tasks"
      >
        <span class="icon is-small">
          <RefreshIcon />
        </span>
      </button>
    </div>

    <div class="box is-borderless">
      <div class="table-container">
        <table class="table is-fullwidth mb-0">
          <thead>
            <tr>
              <th>Status</th>
              <th>Task</th>
              <th>Due Date</th>
              <th>Deployment ID</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="tasks.length === 0 && !tasksLoading">
              <td colspan="5" class="has-text-centered has-text-grey py-6">
                No tasks yet
              </td>
            </tr>
            <tr v-else-if="tasksLoading">
              <td colspan="5" class="has-text-centered has-text-grey py-6">
                <span class="icon is-small mr-2">
                  <i class="fas fa-spinner fa-spin"></i>
                </span>
                Loading tasks...
              </td>
            </tr>
            <tr
              v-else
              v-for="(task, index) in tasks"
              :key="
                task.deploymentId
                  ? `${task.deploymentId}-${task.created_at}`
                  : `task-${index}`
              "
            >
              <td>
                <StatusTag status="QUEUED" />
              </td>
              <td>
                <span class="tag is-small category-tag">{{ task.task }}</span>
              </td>
              <td class="has-text-grey">
                {{ formatDate(task.due_at) }}
              </td>
              <td class="is-family-monospace has-text-grey">
                {{ task.deploymentId }}
              </td>
              <td class="has-text-grey">
                {{ formatDate(task.created_at) }}
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
import { formatDate } from "~/utils/formatDate";
import RefreshIcon from "@/assets/img/icons/refresh.svg?component";

defineProps<{
  tasks: any[];
  tasksLoading: boolean;
}>();

defineEmits<{
  refresh: [];
}>();
</script>
