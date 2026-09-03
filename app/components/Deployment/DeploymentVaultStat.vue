<template>
  <div>
    <span class="k">Vault</span>
    <span class="v">${{ usd.toFixed(0) }}</span>
    <span class="s">{{ balance.NOS }} NOS</span>
  </div>
</template>

<script setup lang="ts">
import type { Deployment } from "@nosana/kit";
import { useDeploymentVault } from "~/composables/useDeploymentVault";

const props = defineProps<{ deployment: Deployment }>();

const { balance } = useDeploymentVault(props.deployment);

const { data: stats } = useAPI("/stats");
const nosPrice = computed(() => stats.value?.price || 0);
const usd = computed(() => (balance.value?.NOS || 0) * nosPrice.value);
</script>

<style lang="scss" scoped>
/* Layout (padding/flex/gap/divider) comes from the parent band's `.stat`
   rule via Vue's scope forwarding onto this component's root. These rules
   only theme the label/value/sub text. */
.k {
  font-size: 12px;
  color: $grey;
  margin-bottom: 7px;
}

.v {
  font-family: $title-family;
  font-size: 23px;
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.s {
  font-size: 12px;
  color: $grey;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: auto;
  padding-top: 8px;
}

html.dark-mode .v {
  color: $white;
}

html.dark-mode .k,
html.dark-mode .s {
  color: $grey-light;
}
</style>
