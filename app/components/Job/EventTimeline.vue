<template>
  <div>
    <h2 class="title is-5 mb-3">Activity</h2>

    <div class="lc-card">
      <p v-if="!items.length" class="lc-empty">
        No on-chain events recorded for this job yet.
      </p>

      <ol v-else class="lifecycle">
        <li
          v-for="(item, i) in items"
          :key="item.key"
          class="lc-stage"
          :class="[`is-${item.tone}`, { 'is-current': i === items.length - 1 }]"
        >
          <!-- Marker + connecting rail -->
          <div class="lc-rail">
            <span class="lc-node">
              <svg
                v-if="item.tone === 'success'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <svg
                v-else-if="item.tone === 'danger'"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              <span v-else class="lc-dot"></span>
            </span>
          </div>

          <!-- Stage content -->
          <div class="lc-content">
            <div class="lc-top">
              <span class="lc-title">{{ item.title }}</span>
              <span
                class="lc-time"
                :title="
                  item.event.blockTime
                    ? formatEventTimestamp(item.event.blockTime)
                    : ''
                "
              >
                <template v-if="item.event.blockTime">{{
                  formatEventTimeAgo(item.event.blockTime)
                }}</template>
                <template v-else>Slot {{ item.event.slot ?? "—" }}</template>
              </span>
            </div>

            <p v-if="item.detail" class="lc-detail">
              <span class="lc-detail-label">{{ item.detail.label }}</span>
              <a
                v-if="item.detail.href"
                :href="item.detail.href"
                target="_blank"
                rel="noopener"
                class="lc-detail-link"
                :title="item.detail.value"
              >
                {{ item.detail.text }}
              </a>
              <span v-else class="lc-detail-val">{{ item.detail.text }}</span>
            </p>

            <a
              :href="solscanTxUrl(item.event.signature, isDevnet)"
              target="_blank"
              rel="noopener"
              class="lc-tx"
              :title="item.event.signature"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                />
                <path d="M15 3h6v6M10 14 21 3" />
              </svg>
              View on Solscan
            </a>
          </div>
        </li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  buildJobTimeline,
  formatEventTimeAgo,
  formatEventTimestamp,
  solscanTxUrl,
  type JobEvent,
  type MarketRef,
} from "~/utils/jobEvents";

const props = defineProps<{
  events: JobEvent[];
  // Used to name the market a job was posted to instead of only showing its
  // address; addresses are shown as-is when it isn't provided.
  markets?: MarketRef[] | null;
}>();

const config = useRuntimeConfig();
const isDevnet = config.public.network === "devnet";

const items = computed(() => buildJobTimeline(props.events, props.markets));
</script>

<style lang="scss" scoped>
/* Card surface matches the redesigned deployment/job detail cards. A narrow
   timeline reads far better capped than stretched across the full page width. */
.lc-card {
  max-width: 620px;
  background: $white;
  border: 1px solid $grey-lighter;
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow:
    0 1px 3px rgba($black, 0.06),
    0 14px 38px -6px rgba($black, 0.14);
}

html.dark-mode .lc-card {
  background: $black-ter;
  border-color: rgba($white, 0.1);
  box-shadow:
    0 1px 3px rgba($black, 0.4),
    0 16px 40px -8px rgba($black, 0.6);
}

.lc-empty {
  text-align: center;
  color: $grey;
  padding: 1.75rem 1rem;
  margin: 0;
  font-size: 0.85rem;
}

/* ---- Lifecycle timeline ---- */
.lifecycle {
  list-style: none;
  margin: 0;
  padding: 0;
}

.lc-stage {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 15px;
  position: relative;
  padding-bottom: 22px;
  align-items: start;
}

.lc-stage:last-child {
  padding-bottom: 0;
}

/* The rail joins one stage's node to the next, so the lifecycle reads as one
   continuous progression from top (oldest) to bottom (newest). */
.lc-stage:not(:last-child)::before {
  content: "";
  position: absolute;
  left: 15px;
  transform: translateX(-50%);
  top: 30px;
  bottom: -3px;
  width: 2px;
  background: $grey-lighter;
}

html.dark-mode .lc-stage:not(:last-child)::before {
  background: rgba($white, 0.12);
}

.lc-rail {
  display: flex;
  justify-content: center;
}

.lc-node {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex: none;
  z-index: 1;
  /* A card-coloured ring lifts the node cleanly off the rail behind it. */
  border: 3px solid $white;
  background: rgba($grey, 0.16);
  color: $grey;
}

html.dark-mode .lc-node {
  border-color: $black-ter;
}

.lc-node svg {
  width: 13px;
  height: 13px;
}

.lc-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: currentColor;
}

/* The newest event is the job's current state — mark it with a soft tinted ring. */
.lc-stage.is-current .lc-node::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid currentColor;
  opacity: 0.4;
}

/* Tone colours (shared with the status pill palette). */
.lc-stage.is-success .lc-node {
  background: rgba($success, 0.16);
  color: $success;
}
.lc-stage.is-info .lc-node {
  background: rgba($info, 0.16);
  color: $info;
}
.lc-stage.is-warning .lc-node {
  background: rgba($warning, 0.2);
  color: $warning;
}
.lc-stage.is-danger .lc-node {
  background: rgba($danger, 0.16);
  color: $danger;
}
.lc-stage.is-grey .lc-node {
  background: rgba($grey, 0.16);
  color: $grey;
}

/* ---- Content ---- */
.lc-content {
  min-width: 0;
  padding-top: 3px;
}

.lc-top {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.lc-title {
  font-family: $title-family;
  font-weight: 600;
  font-size: 0.92rem;
  color: $text;
}

.lc-time {
  margin-left: auto;
  flex: none;
  font-size: 0.72rem;
  color: $grey;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.lc-detail {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: $grey-dark;
}

.lc-detail-label {
  color: $grey;
  margin-right: 6px;
}

.lc-detail-link {
  font-family: $family-monospace;
  color: $link;

  &:hover {
    text-decoration: underline;
  }
}

.lc-tx {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  color: $grey;
  margin-top: 7px;
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

html.dark-mode {
  .lc-title {
    color: $white;
  }

  .lc-detail {
    color: $grey-light;
  }

  .lc-tx:hover {
    color: $secondary;
  }
}
</style>
