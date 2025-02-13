<template>
  <div class="box p-0">
    <h2 class="title is-5 p-4 mb-0">Global Host Distribution</h2>
    <div class="world-map-container">
      <div class="aspect-ratio-container">
        <v-chart
          v-if="chartOptions"
          :option="chartOptions"
          :autoresize="true"
          style="width: 100%; height: 100%;"
        />
        <div v-else class="has-text-centered p-4">Loading world map data...</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAPI } from '~/composables/useAPI';
import VChart from 'vue-echarts';
import * as echarts from 'echarts/core';
import { MapChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GeoComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import worldJson from '~/assets/world.json';
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';

// Initialize the library with English translations
countries.registerLocale(en);

echarts.use([
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GeoComponent,
  MapChart,
  CanvasRenderer
]);

echarts.registerMap('world', worldJson);

const { data: nodeStats } = await useAPI('/api/stats/nodes-country');

// Get all country names from the world map data for comparison
const echartsCountryNames = new Set(worldJson.features.map(f => f.properties.name));

// Debug function to check country name mappings
const debugCountryMappings = () => {
  if (!nodeStats.value || !Array.isArray(nodeStats.value)) return;
  
  console.log('Checking country mappings...');
  nodeStats.value
    .filter(item => item.country && 
            typeof item.country === 'string' && 
            item.country.length === 2 && 
            countries.isValid(item.country))
    .forEach(item => {
      const iso2 = item.country;
      const standardName = countries.getName(iso2, 'en');
      if (!echartsCountryNames.has(standardName)) {
        console.log(`Mismatch for ${iso2}:`, {
          iso2,
          standardName,
          hasNodes: item.totalNodes > 0
        });
      }
    });
};

// Run the debug check
debugCountryMappings();

// Special cases where ECharts map names differ from standard English names
const specialCases = {
  US: 'United States',
  GB: 'United Kingdom',
  RU: 'Russia',
  CZ: 'Czech Rep.',
  KR: 'Korea',
  IR: 'Iran',
  CN: 'China',
  HK: 'Hong Kong',
  TW: 'Taiwan',
  TR: 'Turkey'
} as const;

const getEchartsCountryName = (iso2: string): string => {
  const name = countries.getName(iso2, 'en');
  if (!name) return '';
  if (iso2 in specialCases) {
    return specialCases[iso2 as keyof typeof specialCases];
  }
  return name;
};

// Debug: Print all available country names in ECharts map
console.log('Available country names in ECharts map:', Array.from(echartsCountryNames));

const seriesData = computed(() => {
  if (!nodeStats.value || !Array.isArray(nodeStats.value)) return [];

  return nodeStats.value
    .filter(item => item.country && 
            typeof item.country === 'string' && 
            item.country.length === 2 && 
            countries.isValid(item.country))
    .map((item) => ({
      name: getEchartsCountryName(item.country),
      value: item.totalNodes || 0,
      totalNodes: item.totalNodes || 0,
      activeNodes: item.activeNodes || 0,
      offlineNodes: item.offlineNodes || 0,
    }));
});

const chartOptions = computed(() => {
  if (!seriesData.value.length) return null;

  const maxValue = Math.max(...seriesData.value.map((o) => o.value));
  
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const { name, data } = params;
        if (!data) return '';
        return `
          <div class="has-text-left">
            <strong>${name}</strong><br />
            Hosts: ${data.value || 0}
          </div>
        `;
      },
    },
    visualMap: {
      show: false,
      min: 0,
      max: maxValue > 0 ? maxValue : 10,
      inRange: {
        color: ['#d2fbd4', '#10E80C'],
      }
    },
    series: [
      {
        name: 'Total Hosts',
        type: 'map',
        map: 'world',
        roam: true,
        scaleLimit: {
          min: 1,
          max: 10,
        },
        data: seriesData.value,
        itemStyle: {
          areaColor: '#f3f3f3',
          borderColor: '#ddd'
        },
        label: {
          show: false
        },
        emphasis: {
          itemStyle: {
            areaColor: 'rgba(16, 232, 12, 0.3)'
          },
          label: {
            show: false
          }
        },
        select: {
          itemStyle: {
            areaColor: '#10E80C'
          }
        }
      }
    ]
  };
});
</script>

<style scoped>
.world-map-container {
  position: relative;
  width: 100%;
  margin: 0 auto;
}

.aspect-ratio-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
}

.aspect-ratio-container > * {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style> 