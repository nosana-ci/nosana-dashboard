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

    <div class="task-card">
      <div v-if="tasks.length === 0 && !tasksLoading" class="task-empty">
        No tasks yet
      </div>
      <div v-else-if="tasksLoading" class="task-empty">
        <span class="icon is-small mr-2">
          <i class="fas fa-spinner fa-spin"></i>
        </span>
        Loading tasks...
      </div>
      <template v-else>
        <div
          v-for="(task, index) in tasks"
          :key="
            task.deploymentId
              ? `${task.deploymentId}-${task.created_at}`
              : `task-${index}`
          "
          class="task-row"
          :class="taskKind(task.task)"
        >
          <span class="task-clock">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </span>
          <div class="task-main">
            <div class="task-title">
              <span class="task-kind">{{ task.task }}</span>
            </div>
            <div class="task-sub">Created {{ formatDate(task.created_at) }}</div>
          </div>
          <span class="task-due">{{ formatDate(task.due_at) }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from "~/utils/formatDate";
import { taskKind } from "~/utils/deploymentEvents";
import RefreshIcon from "@/assets/img/icons/refresh.svg?component";

defineProps<{
  tasks: any[];
  tasksLoading: boolean;
}>();

defineEmits<{
  refresh: [];
}>();
</script>

<style lang="scss" scoped>
.task-card {
  background: $white;
  border: 1px solid $grey-lighter;
  border-radius: 14px;
  overflow: hidden;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
}

.task-row + .task-row {
  border-top: 1px solid $grey-lightest;
}

.task-clock {
  display: inline-flex;
  flex: none;
  color: $warning;

  svg {
    width: 18px;
    height: 18px;
  }
}

.task-main {
  min-width: 0;
  flex: 1;
}

.task-kind {
  font-family: $title-family;
  font-weight: 600;
  font-size: 0.72rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: $warning;
  background: rgba($warning, 0.14);
  border-radius: 6px;
  padding: 2px 9px;
}

.task-sub {
  font-size: 0.8rem;
  color: $grey;
  margin-top: 4px;
}

.task-due {
  margin-left: auto;
  font-size: 0.85rem;
  font-weight: 600;
  color: $warning;
  white-space: nowrap;
}

/* Task tone: list = green, extend = orange (the default above), stop = red. */
.task-row.is-success-kind {
  .task-clock,
  .task-due {
    color: $success;
  }
  .task-kind {
    color: $success;
    background: rgba($success, 0.14);
  }
}
.task-row.is-danger-kind {
  .task-clock,
  .task-due {
    color: $danger;
  }
  .task-kind {
    color: $danger;
    background: rgba($danger, 0.14);
  }
}

.task-empty {
  text-align: center;
  color: $grey;
  padding: 2.5rem 1rem;
}

html.dark-mode .task-card {
  background: $black-ter;
  border-color: rgba($white, 0.08);
}

html.dark-mode .task-row + .task-row {
  border-top-color: rgba($white, 0.06);
}
</style>
