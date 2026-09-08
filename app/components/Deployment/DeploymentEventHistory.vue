<template>
  <div>
    <h2 class="title is-5 mb-3">History</h2>

    <div class="event-card">
      <div v-if="events.length === 0" class="event-empty">No events yet</div>
      <div v-else class="timeline">
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
  background: $white;
  border: 1px solid $grey-lighter;
  border-radius: 14px;
  overflow: hidden;
  padding: 6px 18px 14px;
}

.event-empty {
  text-align: center;
  color: $grey;
  padding: 2.5rem 1rem;
}

.timeline {
  position: relative;
}

.timeline::before {
  content: "";
  position: absolute;
  left: 5px;
  top: 20px;
  bottom: 20px;
  width: 1.5px;
  background: $grey-lighter;
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
  background: $white;
  border: 2px solid $grey;
  box-shadow: 0 0 0 3px $white;
}

.tl-item.is-danger-kind .tl-node {
  border-color: $danger;
}
.tl-item.is-success-kind .tl-node {
  border-color: $success;
}
.tl-item.is-warning-kind .tl-node {
  border-color: $warning;
}
.tl-item.is-info-kind .tl-node {
  border-color: $info;
}
.tl-item.is-neutral-kind .tl-node {
  border-color: $grey;
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
  color: $grey;
  border: 1px solid $grey-lighter;
  border-radius: 5px;
  padding: 1px 6px;
}

.tl-date {
  margin-left: auto;
  font-size: 0.75rem;
  color: $grey;
  white-space: nowrap;
}

.tl-msg {
  font-size: 0.85rem;
  color: $grey;
  margin-top: 3px;
  word-break: break-word;
}

.tl-tx {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: $grey;
  border: 1px solid $grey-lighter;
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

html.dark-mode .event-card {
  background: $black-ter;
  border-color: rgba($white, 0.08);
}

html.dark-mode .timeline::before {
  background: rgba($white, 0.1);
}

html.dark-mode .tl-node {
  background: $black-ter;
  box-shadow: 0 0 0 3px $black-ter;
}

html.dark-mode .tl-title {
  color: $white;
}

html.dark-mode .tl-cat {
  border-color: rgba($white, 0.12);
}
</style>
