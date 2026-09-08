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
        <div
          v-if="isRunning"
          class="notification is-warning is-light is-size-7 mb-4"
        >
          Changing the market stops this deployment's running jobs and relists
          them on the new market.
        </div>

        <p v-if="loadingMarkets" class="has-text-grey">Loading GPUs…</p>
        <!-- Mounted only while open so each visit starts from the current
             market instead of a stale pick from last time. -->
        <ListDeployMarketList
          v-else-if="markets && modelValue"
          :markets="markets"
          :testgridMarkets="testgridMarkets"
          :select="true"
          :typeFilter="typeFilter"
          :jobDefinition="jobDefinition ?? undefined"
          :skipAutoSelection="true"
          :initialMarket="initialMarket"
          :showLogo="true"
          @selectedMarket="selectedMarket = $event"
        />
        <p v-else class="has-text-grey">Could not load available GPUs</p>
      </section>

      <footer class="modal-card-foot">
        <p class="has-text-grey is-size-7" style="flex: 1; min-width: 0">
          <template v-if="hasNewSelection">
            Move to
            <span class="has-text-weight-semibold">{{
              selectedMarketName
            }}</span>
          </template>
          <template v-else>Select a different GPU to move to</template>
        </p>
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
import { useMarkets } from "~/composables/useMarkets";
import { truncateMiddle } from "~/utils/solana";

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

const config = useRuntimeConfig();
const { markets, getMarkets, loadingMarkets } = useMarkets();

// Same market visibility as the create page: everything on devnet, premium
// on mainnet.
const typeFilter =
  config.public.network === "devnet" ? ["PREMIUM", "COMMUNITY"] : ["PREMIUM"];

const selectedMarket = ref<Market | null>(null);

const initialMarket = computed<Market | null>(
  () =>
    markets.value?.find(
      (m) => m.address?.toString() === props.currentMarket,
    ) ?? null,
);

// On-chain markets load lazily the first time the modal opens; every open
// resets the pick to the deployment's current market.
watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    if (!markets.value && !loadingMarkets.value) getMarkets();
    selectedMarket.value = initialMarket.value;
  },
  { immediate: true },
);

const isRunning = computed(() => {
  const status = props.deploymentStatus?.toUpperCase();
  return status === "RUNNING" || status === "STARTING";
});

const marketName = (address: string | undefined | null): string => {
  if (!address) return "-";
  const match = props.testgridMarkets?.find(
    (tgm: any) => tgm.address === address,
  );
  return match?.name || truncateMiddle(address);
};

const currentMarketName = computed(() => marketName(props.currentMarket));
const selectedMarketName = computed(() =>
  marketName(selectedMarket.value?.address?.toString()),
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
/* Reserve height so the body doesn't jump when the GPU grid arrives; Bulma
   has no min-height helper. */
.market-modal-body {
  min-height: 40vh;
}
</style>
