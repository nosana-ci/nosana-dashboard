<template>
  <p v-if="loadingMarkets" class="has-text-grey">Loading GPUs…</p>
  <ListDeployMarketList
    v-else-if="markets"
    :markets="markets"
    :testgridMarkets="testgridMarkets"
    :select="true"
    :typeFilter="typeFilter"
    :jobDefinition="jobDefinition ?? undefined"
    :skipAutoSelection="true"
    :initialMarket="initialMarket"
    :showLogo="true"
    @selectedMarket="emit('select', $event)"
  />
  <p v-else class="has-text-grey">Could not load available GPUs</p>
</template>

<script setup lang="ts">
import type { JobDefinition, Market } from "@nosana/kit";
import { useMarkets } from "~/composables/useMarkets";

// GPU picker shared by the change-market and duplicate dialogs. It owns the
// on-chain market fetch, so mounting it only while a picker is on screen keeps
// that work off every deployment page.
const props = defineProps<{
  /** Address of the market the picker starts on. */
  currentMarket: string;
  testgridMarkets: any[];
  jobDefinition: JobDefinition | null;
}>();

const emit = defineEmits<{ select: [market: Market | null] }>();

const config = useRuntimeConfig();
const { markets, getMarkets, loadingMarkets } = useMarkets();

// Same market visibility as the create page: everything on devnet, premium
// on mainnet.
const typeFilter =
  config.public.network === "devnet" ? ["PREMIUM", "COMMUNITY"] : ["PREMIUM"];

const initialMarket = computed<Market | null>(
  () =>
    markets.value?.find(
      (m) => m.address?.toString() === props.currentMarket,
    ) ?? null,
);

if (!markets.value && !loadingMarkets.value) getMarkets();

// The list only emits once its own selection changes, so an already-loaded
// market list would otherwise leave the caller thinking nothing is selected.
onMounted(() => {
  if (initialMarket.value) emit("select", initialMarket.value);
});
</script>
