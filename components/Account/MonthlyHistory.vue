<template>
  <div class="box" style="height: 100%; position: relative;">
    <div class="content" style="height: 100%;">
      <div class="field is-grouped is-justify-content-end" style="position: absolute; top: 12px; right: 12px; z-index: 1;">
        <div class="control">
          <div class="buttons has-addons">
            <button 
              v-for="period in ['3', '6', '12']" 
              :key="period"
              class="button is-small"
              :class="{ 'is-primary': selectedMonths === period }"
              @click="$emit('update:selectedMonths', period)"
            >
              {{ `${period}M` }}
            </button>
          </div>
        </div>
      </div>
      <div v-if="!loadingHistory && monthlyHistory" style="height: 315px;">
        <Bar
          v-if="chartData && chartData.labels.length"
          :data="chartData"
          :options="chartOptions"
          style="padding-top: 10px"
        />
      </div>
      <progress
        v-else-if="loadingHistory"
        class="progress is-small is-info"
        max="100"
      >
      </progress>
      <p v-else>No historic data.</p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Bar } from 'vue-chartjs';
const props = defineProps({
  chartData: Object,
  chartOptions: Object,
  loadingHistory: Boolean,
  monthlyHistory: Object,
  selectedMonths: String
});
</script> 