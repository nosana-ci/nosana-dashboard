<template>
  <div class="mb-5">
    <div class="as-head">
      <h2 class="title is-5 mb-0">Activity</h2>
    </div>

    <div class="as-card">
      <div v-if="!hasTasks && events.length === 0" class="as-empty">
        No activity yet
      </div>

      <template v-else>
        <!-- Scheduled tasks -->
        <template v-if="hasTasks">
          <div class="as-sub">Scheduled</div>
          <div
            v-for="(task, i) in scheduledTasks"
            :key="`t-${i}`"
            class="as-task"
            :class="taskKind(task.task)"
          >
            <span class="as-clock">
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
            <div class="as-task-main">
              <div class="as-task-title">{{ humanizeEventType(task.task) }}</div>
              <div class="as-task-sub">
                Created {{ formatTimeAgo(task.created_at) }}
              </div>
            </div>
            <span class="as-due">{{ formatTimeUntil(task.due_at) }}</span>
          </div>
        </template>

        <!-- Recent events -->
        <template v-if="recentEvents.length">
          <div v-if="hasTasks" class="as-divlabel">
            <span class="l"></span>Recent<span class="l"></span>
          </div>
          <div class="as-actlist">
            <div
              v-for="(event, i) in recentEvents"
              :key="`e-${i}`"
              class="as-act"
              :class="eventKind(event)"
            >
              <span class="as-adot"></span>
              <div class="as-act-main">
                <div class="as-act-top">
                  <span class="as-act-title">{{
                    event.type ? humanizeEventType(event.type) : event.message
                  }}</span>
                  <span class="as-act-time">{{
                    formatTimeAgo(event.created_at)
                  }}</span>
                </div>
                <div v-if="event.type && event.message" class="as-act-msg">
                  {{ event.message }}
                </div>
                <a
                  v-if="event.tx"
                  :href="solscanTxUrl(event.tx, isDevnet)"
                  target="_blank"
                  class="as-txlink"
                  @click.stop
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <path d="M15 3h6v6M10 14 21 3" />
                  </svg>
                  View on Solscan
                </a>
              </div>
            </div>
          </div>
        </template>

        <button class="as-foot" @click="$emit('viewAll')">
          View full history
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeploymentEventItem } from "@nosana/api";
import { formatTimeAgo, formatTimeUntil } from "~/utils/relativeTime";
import { humanizeEventType, eventKind, taskKind } from "~/utils/deploymentEvents";
import { solscanTxUrl } from "~/utils/jobEvents";

const props = defineProps<{
  events: DeploymentEventItem[];
  tasks?: any[];
}>();

defineEmits<{ viewAll: [] }>();

const config = useRuntimeConfig();
const isDevnet = config.public.network === "devnet";

const hasTasks = computed(() => (props.tasks?.length ?? 0) > 0);
const scheduledTasks = computed(() => (props.tasks ?? []).slice(0, 3));
const recentEvents = computed(() => props.events.slice(0, 4));
</script>

<style lang="scss" scoped>
.as-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.as-card {
  background: $white;
  border: 1px solid $grey-lighter;
  border-radius: 14px;
  overflow: hidden;
  padding: 6px 0 0;
}

.as-empty {
  text-align: center;
  color: $grey;
  padding: 2.25rem 1rem;
  font-size: 0.9rem;
}

/* ---- Scheduled ---- */
.as-sub {
  font-size: 0.7rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: $grey;
  padding: 12px 18px 4px;
}

.as-task {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 11px 18px;
  position: relative;
}

.as-task + .as-task::before {
  content: "";
  position: absolute;
  top: 0;
  left: 18px;
  right: 18px;
  height: 1px;
  background: $grey-lightest;
}

.as-clock {
  flex: none;
  display: inline-flex;
  color: $warning;

  svg {
    width: 17px;
    height: 17px;
  }
}

.as-task-main {
  min-width: 0;
  flex: 1;
}

.as-task-title {
  font-family: $title-family;
  font-weight: 600;
  font-size: 0.85rem;
  color: $text;
}

.as-task-sub {
  font-size: 0.72rem;
  color: $grey;
  margin-top: 1px;
}

.as-due {
  flex: none;
  margin-left: auto;
  font-size: 0.8rem;
  font-weight: 600;
  color: $warning;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* Scheduled task tone: list = green, extend = orange (the default above),
   stop = red. */
.as-task.is-success-kind .as-clock,
.as-task.is-success-kind .as-due {
  color: $success;
}
.as-task.is-danger-kind .as-clock,
.as-task.is-danger-kind .as-due {
  color: $danger;
}

/* ---- Recent divider ---- */
.as-divlabel {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px 4px;
  font-size: 0.68rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: $grey;

  .l {
    flex: 1;
    height: 1px;
    background: $grey-lightest;
  }
}

/* ---- Recent events ---- */
.as-actlist {
  padding: 2px 0 0;
}

.as-act {
  display: flex;
  gap: 12px;
  padding: 12px 18px;
  position: relative;
  align-items: flex-start;
}

.as-act + .as-act::before {
  content: "";
  position: absolute;
  top: 0;
  left: 18px;
  right: 18px;
  height: 1px;
  background: $grey-lightest;
}

.as-adot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
  flex: none;
  background: $grey-light;
}

.as-act.is-info-kind .as-adot {
  background: $info;
}
.as-act.is-success-kind .as-adot {
  background: $success;
}
.as-act.is-warning-kind .as-adot {
  background: $warning;
}
.as-act.is-danger-kind .as-adot {
  background: $danger;
}
.as-act.is-neutral-kind .as-adot {
  background: $grey;
}

.as-act-main {
  min-width: 0;
  flex: 1;
}

.as-act-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.as-act-title {
  font-family: $title-family;
  font-weight: 600;
  font-size: 0.85rem;
  color: $text;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.as-act-time {
  margin-left: auto;
  flex: none;
  font-size: 0.72rem;
  color: $grey;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.as-act-msg {
  font-size: 0.78rem;
  color: $grey-dark;
  margin-top: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.as-txlink {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: $grey;
  margin-top: 6px;
  text-decoration: none;
  transition: color 0.15s ease;

  svg {
    width: 12px;
    height: 12px;
  }

  &:hover {
    color: $secondary;
  }
}

/* ---- Footer link ---- */
.as-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  border: 0;
  border-top: 1px solid $grey-lighter;
  background: none;
  cursor: pointer;
  color: $grey-dark;
  font-size: 0.78rem;
  font-weight: 500;
  padding: 12px 0;
  margin-top: 6px;
  transition: color 0.15s ease;

  svg {
    width: 13px;
    height: 13px;
  }

  &:hover {
    color: $secondary;
  }
}

/* ---- Dark mode ---- */
html.dark-mode .as-card {
  background: $black-ter;
  border-color: rgba($white, 0.08);
}

html.dark-mode .as-task + .as-task::before,
html.dark-mode .as-act + .as-act::before,
html.dark-mode .as-divlabel .l {
  background: rgba($white, 0.07);
}

html.dark-mode .as-task-title,
html.dark-mode .as-act-title {
  color: $white;
}

html.dark-mode .as-act-msg {
  color: $grey-light;
}

html.dark-mode .as-foot {
  border-top-color: rgba($white, 0.08);
  color: $grey-light;
}

html.dark-mode .as-foot:hover,
html.dark-mode .as-txlink:hover {
  color: $secondary;
}
</style>
