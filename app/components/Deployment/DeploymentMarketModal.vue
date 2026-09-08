<template>
  <div class="modal" :class="{ 'is-active': modelValue }">
    <div class="modal-background" @click="close"></div>
    <div class="modal-card is-app-modal is-medium">
      <header class="modal-card-head">
        <div
          class="is-flex is-align-items-center is-gap-2 is-flex-grow-1"
          style="min-width: 0"
        >
          <span class="app-modal-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <path
                d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"
              />
            </svg>
          </span>
          <div style="min-width: 0">
            <p class="modal-card-title title is-5 mb-0">Change Market</p>
            <p class="has-text-grey is-size-7">
              Current:
              <span class="has-text-weight-semibold">{{
                currentMarketName
              }}</span>
            </p>
          </div>
        </div>
        <button class="delete" aria-label="close" @click="close"></button>
      </header>

      <section class="modal-card-body market-modal-body">
        <!-- Mounted only while open so each visit starts from the current
             market instead of a stale pick from last time. -->
        <DeploymentMarketPicker
          v-if="modelValue"
          :currentMarket="currentMarket"
          :testgridMarkets="testgridMarkets"
          :jobDefinition="jobDefinition"
          @select="selectedMarket = $event"
        />
      </section>

      <footer class="modal-card-foot">
        <div class="modal-foot-summary foot-summary">
          <p class="has-text-grey is-size-7 mb-0">
            <template v-if="hasNewSelection">
              Move to
              <span class="has-text-weight-semibold">{{
                selectedMarketName
              }}</span>
            </template>
            <template v-else>Select a different GPU to move to</template>
          </p>
          <p v-if="isRunning" class="foot-warning is-size-7 mb-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
            <span>
              Changing the market stops this deployment's running jobs and
              relists them on the new market.
            </span>
          </p>
        </div>
        <div class="buttons mb-0">
          <button class="button" @click="close">Cancel</button>
          <button
            class="button is-success"
            :class="{ 'is-loading': actionLoading }"
            :disabled="actionLoading || !hasNewSelection"
            @click="confirm"
          >
            Update Market
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JobDefinition, Market } from "@nosana/kit";
import { marketName } from "~/utils/solana";

const props = defineProps<{
  modelValue: boolean;
  /** Address of the deployment's current market. */
  currentMarket: string;
  deploymentStatus: string;
  testgridMarkets: any[];
  jobDefinition: JobDefinition | null;
  actionLoading: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [market: Market];
}>();

const selectedMarket = ref<Market | null>(null);

// Every open resets the pick; the picker re-announces the current market as
// soon as it mounts.
watch(
  () => props.modelValue,
  (open) => {
    if (open) selectedMarket.value = null;
  },
  { immediate: true },
);

const isRunning = computed(() => {
  const status = props.deploymentStatus?.toUpperCase();
  return status === "RUNNING" || status === "STARTING";
});

const currentMarketName = computed(() =>
  marketName(props.currentMarket, props.testgridMarkets),
);
const selectedMarketName = computed(() =>
  marketName(selectedMarket.value?.address?.toString(), props.testgridMarkets),
);

const hasNewSelection = computed(() => {
  const address = selectedMarket.value?.address?.toString();
  return !!address && address !== props.currentMarket;
});

const close = () => emit("update:modelValue", false);

const confirm = () => {
  if (!selectedMarket.value || !hasNewSelection.value) return;
  emit("confirm", selectedMarket.value);
  close();
};
</script>

<style lang="scss" scoped>
@use "sass:color";

/* Reserve height so the body doesn't jump when the GPU grid arrives; Bulma
   has no min-height helper. */
.market-modal-body {
  min-height: 40vh;
}

.foot-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Plain tinted text rather than a notification block: the dark-mode
   .notification.is-warning.is-light override darkens the background while the
   text stays dark, which left the old banner unreadable. */
.foot-warning {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  line-height: 1.35;
  color: color.adjust($warning, $lightness: -24%);

  svg {
    width: 14px;
    height: 14px;
    flex: none;
    margin-top: 1px;
  }
}

html.dark-mode .foot-warning {
  color: $warning;
}
</style>
