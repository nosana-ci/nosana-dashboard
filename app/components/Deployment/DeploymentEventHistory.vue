<template>
  <div>
    <h2 class="title is-5 mb-3">History</h2>

    <div class="event-card">
      <div v-if="events.length === 0" class="event-empty">No events yet</div>
      <div v-else class="event-list">
        <div
          v-for="(event, index) in events"
          :key="index"
          class="tl-item"
          :class="eventKind(event)"
        >
          <span class="tl-node"></span>
          <div class="tl-body">
            <div class="tl-top">
              <span class="tl-title">{{
                event.type ? humanizeEventType(event.type) : event.message
              }}</span>
              <span v-if="event.category" class="tl-cat">{{
                event.category
              }}</span>
              <span class="tl-date">{{ formatDate(event.created_at) }}</span>
            </div>
            <div
              v-if="event.type"
              class="tl-msg"
              :class="{ 'is-family-monospace': event.message.length > 200 }"
            >
              {{ event.message }}
            </div>
            <a
              v-if="event.tx"
              :href="solscanTxUrl(event.tx, isDevnet)"
              target="_blank"
              class="tl-tx"
              title="View transaction"
            >
              TX ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DeploymentEventItem } from "@nosana/api";
import { formatDate } from "~/utils/formatDate";
import { humanizeEventType, eventKind } from "~/utils/deploymentEvents";
import { solscanTxUrl } from "~/utils/jobEvents";

defineProps<{
  events: DeploymentEventItem[];
}>();

const config = useRuntimeConfig();
const isDevnet = config.public.network === "devnet";
</script>

<style lang="scss" scoped>
.event-card {
  @include soft-panel;
  padding: 6px 18px 14px;
}

.event-empty {
  text-align: center;
  color: $text-muted;
  padding: 2.5rem 1rem;
}

.tl-item {
  position: relative;
  padding: 13px 0 13px 26px;
}

.tl-node {
  position: absolute;
  left: 0;
  top: 17px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: $status-neutral;
}

.tl-item.is-danger-kind .tl-node {
  background: $danger;
}
.tl-item.is-success-kind .tl-node {
  background: $success;
}
.tl-item.is-warning-kind .tl-node {
  background: $warning;
}
.tl-item.is-info-kind .tl-node {
  background: $info;
}
.tl-item.is-neutral-kind .tl-node {
  background: $status-neutral;
}

.tl-top {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.tl-title {
  font-family: $title-family;
  font-weight: 600;
  font-size: 0.9rem;
  color: $text;
}

.tl-cat {
  font-size: 0.65rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: $text-muted;
  border: 1px solid $border-soft;
  border-radius: 5px;
  padding: 1px 6px;
}

.tl-date {
  margin-left: auto;
  font-size: 0.75rem;
  color: $text-muted;
  white-space: nowrap;
}

.tl-msg {
  font-size: 0.85rem;
  color: $text-muted;
  margin-top: 3px;
  word-break: break-word;
}

.tl-tx {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: $text-muted;
  border: 1px solid $border-soft;
  border-radius: 6px;
  padding: 2px 8px;
  margin-top: 7px;
  text-decoration: none;
  transition:
    color 0.15s ease,
    border-color 0.15s ease;
}

.tl-tx:hover {
  color: $secondary;
  border-color: $secondary;
}

html.dark-mode .tl-title {
  color: $white;
}

html.dark-mode .tl-cat {
  border-color: rgba($white, 0.12);
}
</style>
