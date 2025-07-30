<template>
  <div class="box" style="height: 100%;">
    <div class="content is-flex is-flex-direction-column is-justify-content-center" style="height: 100%;">
      <div class="is-flex is-flex-direction-column" style="flex: 1; display: flex; justify-content: center;">
        <p class="heading mb-1" style="font-size: 0.7rem;">Current month cost</p>
        <p class="title is-4 mb-1" v-if="!loadingSpending">
          ${{ spentThisMonth.toFixed(2) }}
        </p>
        <p class="title is-4 mb-1" v-else>-</p>
        <p class="has-text-grey is-size-7 mb-0" v-if="pctChangeSoFar != null">
          <slot name="arrow-up" v-if="pctChangeSoFar >= 0" />
          <slot name="arrow-down" v-else />
          {{ pctChangeSoFar.toFixed(2) }}% compared to last month for same period
        </p>
      </div>
      <div class="is-flex is-justify-content-center my-3">
        <div style="width: 100%; height: 1px; background-color: #dbdbdb;"></div>
      </div>
      <div class="is-flex is-flex-direction-column" style="flex: 1; display: flex; justify-content: center;">
        <p class="heading mb-1" style="font-size: 0.7rem;">Forecasted month end cost</p>
        <p class="title is-4 mb-1" v-if="!loadingSpending">
          ${{ forecastAmount.toFixed(2) }}
        </p>
        <p class="title is-4 mb-1" v-else>-</p>
        <p class="has-text-grey is-size-7 mb-0" v-if="pctChangeForecastFromLastMonth != null">
          <slot name="arrow-up" v-if="pctChangeForecastFromLastMonth >= 0" />
          <slot name="arrow-down" v-else />
          {{ pctChangeForecastFromLastMonth.toFixed(2) }}% compared to last month's total cost
        </p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps({
  spentThisMonth: Number,
  forecastAmount: Number,
  pctChangeSoFar: Number,
  pctChangeForecastFromLastMonth: Number,
  loadingSpending: Boolean
});
</script> 