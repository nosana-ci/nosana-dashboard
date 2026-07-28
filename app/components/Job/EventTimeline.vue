<template>
  <div>
    <h2 class="title is-5 mb-3">Activity</h2>

    <div class="box is-borderless">
      <p
        v-if="!items.length"
        class="has-text-grey has-text-centered py-5 mb-0 is-size-7"
      >
        No on-chain events recorded for this job yet.
      </p>

      <ol v-else class="event-timeline">
        <li v-for="item in items" :key="item.key" class="event">
          <span class="event-marker" :class="`is-${item.tone}`"></span>

          <div class="event-body">
            <div class="event-heading">
              <span class="event-title">{{ item.title }}</span>
              <a
                :href="solscanTxUrl(item.event.signature, isDevnet)"
                target="_blank"
                rel="noopener"
                class="event-tx is-size-7"
                :title="item.event.signature"
              >
                {{ shortAddress(item.event.signature) }}
                <span class="icon is-small borderless">
                  <ArrowSquareUpRightIcon />
                </span>
              </a>
            </div>

            <p class="event-time is-size-7">
              <template v-if="item.event.blockTime">
                {{ formatEventTimestamp(item.event.blockTime) }}
                <span class="has-text-grey"
                  >({{ formatEventTimeAgo(item.event.blockTime) }})</span
                >
              </template>
              <template v-else>
                Slot {{ item.event.slot ?? "unknown" }}
              </template>
            </p>

            <p v-if="item.detail" class="event-detail is-size-7 mb-0">
              {{ item.detail.label }}
              <a
                v-if="item.detail.href"
                :href="item.detail.href"
                target="_blank"
                rel="noopener"
                class="has-text-link is-family-monospace"
                :title="item.detail.value"
              >
                {{ item.detail.text }}
              </a>
              <span v-else>{{ item.detail.text }}</span>
            </p>
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
  shortAddress,
  solscanTxUrl,
  type JobEvent,
  type MarketRef,
} from "~/utils/jobEvents";
import ArrowSquareUpRightIcon from "@/assets/img/icons/arrow-square-up-right.svg?component";

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
.event-timeline {
  list-style: none;
  margin: 0;
  padding: 0;
}

.event {
  display: flex;
  gap: 0.75rem;
  padding-bottom: 1.25rem;
  position: relative;

  // Rail connecting the markers.
  &:not(:last-child)::before {
    background-color: $grey-lighter;
    bottom: 0.25rem;
    content: "";
    left: 0.28rem;
    position: absolute;
    top: 0.9rem;
    width: 1px;
  }

  &:last-child {
    padding-bottom: 0;
  }
}

.event-marker {
  background-color: $grey-light;
  border-radius: 50%;
  flex: 0 0 auto;
  height: 0.625rem;
  margin-top: 0.3rem;
  width: 0.625rem;
  z-index: 1;

  &.is-success {
    background-color: $secondary;
  }
  &.is-info {
    background-color: $info;
  }
  &.is-warning {
    background-color: $warning;
  }
  &.is-danger {
    background-color: $danger;
  }
}

.event-body {
  min-width: 0;
}

.event-heading {
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.event-title {
  font-weight: $weight-semibold;
}

.event-tx {
  color: $grey;
  font-family: $family-monospace;

  &:hover {
    color: $link;
  }

  .icon {
    vertical-align: middle;
  }
}

.event-time,
.event-detail {
  color: $text-dark;
  margin-bottom: 0;
}

html.dark-mode {
  .event:not(:last-child)::before {
    background-color: $grey-dark;
  }

  .event-title {
    color: $white;
  }

  .event-time,
  .event-detail {
    color: $grey-light;
  }
}
</style>
