<template>
  <div class="is-size-7">
    <div class="is-flex is-justify-content-space-between mb-1">
      <span class="has-text-grey">Credits</span>
      <span>${{ amount.toFixed(2) }}</span>
    </div>
    <div class="is-flex is-justify-content-space-between">
      <span class="has-text-grey">Service fee ({{ feeBps / 100 }}%)</span>
      <span>${{ (total - amount).toFixed(2) }}</span>
    </div>
    <hr class="my-2" />
    <div
      class="is-flex is-justify-content-space-between has-text-weight-semibold"
    >
      <span>Total</span>
      <span>${{ total.toFixed(2) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { purchaseTotalUsd } from "~/utils/purchaseFee";

const props = defineProps<{
  amount: number;
  feeBps: number;
}>();

const total = computed(() => purchaseTotalUsd(props.amount, props.feeBps));
</script>
