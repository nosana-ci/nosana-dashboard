<template>
  <div class="box p-0">
    <h2 class="title is-5 p-4 mb-0">Global Host Distribution</h2>
    <div class="world-map-container">
      <v-chart
        v-if="chartOptions"
        :option="chartOptions"
        :autoresize="true"
        style="width: 100%; height: 450px;"
      />
      <div v-else class="has-text-centered p-4">Loading world map data...</div>
    </div>
  </div>
</template>

<script setup lang="ts">

import { computed, ref, onMounted } from 'vue';
import { useAPI } from '~/composables/useAPI';
import { useIntervalFn } from '@vueuse/core';
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

// Register required components
echarts.use([
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  GeoComponent,
  MapChart,
  CanvasRenderer
]);

// Register the world map
echarts.registerMap('world', worldJson);

// Debug: Check map data for US name
console.log('World map features:', worldJson.features.map(f => f.properties.name));

// Register globally in main.ts or here locally if you prefer:
defineComponent({
  components: {
    VChart,
  },
});

const mapOption = {
  map: 'world',
  nameMap: {
    'United States': 'USA',
    'United States of America': 'USA',
    'USA': 'USA'
  }
};

/**
 * Complete ISO 3166-1 alpha-2 to ECharts country name mapping
 */
const iso2ToEchartsName = {
  // North America
  US: 'USA',
  CA: 'Canada',
  MX: 'Mexico',
  BB: 'Barbados',
  CR: 'Costa Rica',
  
  // South America
  AR: 'Argentina',
  BR: 'Brazil',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Peru',
  VE: 'Venezuela',
  UY: 'Uruguay',
  
  // Europe
  AT: 'Austria',
  BE: 'Belgium',
  BG: 'Bulgaria',
  HR: 'Croatia',
  CY: 'Cyprus',
  CZ: 'Czech Republic',
  DK: 'Denmark',
  EE: 'Estonia',
  FI: 'Finland',
  FR: 'France',
  DE: 'Germany',
  GR: 'Greece',
  HU: 'Hungary',
  IS: 'Iceland',
  IE: 'Ireland',
  IT: 'Italy',
  LV: 'Latvia',
  LI: 'Liechtenstein',
  LT: 'Lithuania',
  LU: 'Luxembourg',
  MT: 'Malta',
  NL: 'Netherlands',
  NO: 'Norway',
  PL: 'Poland',
  PT: 'Portugal',
  RO: 'Romania',
  RS: 'Serbia',
  SK: 'Slovakia',
  SI: 'Slovenia',
  ES: 'Spain',
  SE: 'Sweden',
  CH: 'Switzerland',
  GB: 'United Kingdom',
  UA: 'Ukraine',
  BY: 'Belarus',
  
  // Asia
  CN: 'China',
  HK: 'Hong Kong',
  IN: 'India',
  ID: 'Indonesia',
  IL: 'Israel',
  IR: 'Iran',
  JP: 'Japan',
  KR: 'South Korea',
  KW: 'Kuwait',
  MY: 'Malaysia',
  PH: 'Philippines',
  SG: 'Singapore',
  LK: 'Sri Lanka',
  TW: 'Taiwan',
  TH: 'Thailand',
  AE: 'United Arab Emirates',
  VN: 'Vietnam',
  BD: 'Bangladesh',
  BH: 'Bahrain',
  GE: 'Georgia',
  KH: 'Cambodia',
  PK: 'Pakistan',
  
  // Oceania
  AU: 'Australia',
  NZ: 'New Zealand',
  NC: 'New Caledonia',
  
  // Africa
  EG: 'Egypt',
  KE: 'Kenya',
  LY: 'Libya',
  MA: 'Morocco',
  NG: 'Nigeria',
  ZA: 'South Africa',
  TN: 'Tunisia',
  
  // Others
  RU: 'Russia',
  TR: 'Turkey',
  JE: 'Jersey'
} as const;

const { data: nodeStats, pending: loading, error, refresh } = await useAPI('/api/stats/nodes-country');

// Add debug logging
const debug = ref(false);

const seriesData = computed(() => {
  if (!nodeStats.value || !Array.isArray(nodeStats.value)) {
    console.log('No node stats data available:', nodeStats.value);
    return [];
  }

  // Log total counts for debugging
  const totalCounts = nodeStats.value.reduce((acc, item) => {
    acc.total += item.totalNodes || 0;
    acc.active += item.activeNodes || 0;
    acc.offline += item.offlineNodes || 0;
    return acc;
  }, { total: 0, active: 0, offline: 0 });
  
  console.log('Total node counts:', totalCounts);

  // Debug US data specifically
  const usData = nodeStats.value.find(item => item.country === 'US');
  if (usData) {
    console.log('Found US data:', {
      raw: usData,
      mapped: iso2ToEchartsName['US'],
      total: usData.totalNodes
    });
  } else {
    console.log('No US data found in nodeStats');
  }

  const filteredData = nodeStats.value
    .filter(item => {
      const isValid = item.country && 
             typeof item.country === 'string' && 
             item.country.length === 2 && 
             iso2ToEchartsName[item.country as keyof typeof iso2ToEchartsName] && 
             !/parse error|not found|Segmentation fault/.test(item.country);
      
      if (debug.value) {
        if (isValid && item.totalNodes > 0) {
          console.log('Processing country:', item.country, '→', {
            name: iso2ToEchartsName[item.country as keyof typeof iso2ToEchartsName],
            total: item.totalNodes,
            active: item.activeNodes,
            offline: item.offlineNodes
          });
        } else if (!isValid) {
          console.log('Filtered out country:', item.country);
        }
      }
      return isValid;
    })
    .map((item) => {
      const mappedName = iso2ToEchartsName[item.country as keyof typeof iso2ToEchartsName];
      // Debug each mapping for US
      if (item.country === 'US') {
        console.log('Mapping US data:', {
          from: item.country,
          to: mappedName,
          value: item.totalNodes
        });
      }
      return {
        name: mappedName,
        value: item.totalNodes || 0,
        totalNodes: item.totalNodes || 0,
        activeNodes: item.activeNodes || 0,
        offlineNodes: item.offlineNodes || 0,
      };
    });

  // Debug final US entry
  const finalUsEntry = filteredData.find(item => item.name === 'USA');
  if (finalUsEntry) {
    console.log('Final US entry in series data:', finalUsEntry);
  } else {
    console.log('No US entry in final series data');
  }

  return filteredData;
});

const chartOptions = computed(() => {
  if (!seriesData.value.length) {
    console.log('No series data available');
    return null;
  }

  const maxValue = Math.max(...seriesData.value.map((o) => o.value));
  console.log('Max value for visualMap:', maxValue);
  
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const { name, value, data } = params;
        console.log('Tooltip params:', { name, value, data });
        // Return empty string for countries without data
        if (!data) return '';
        return `
          <div class="has-text-left">
            <strong>${name}</strong><br />
            Hosts: ${value || 0}
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
          min: 0.3,
          max: 15
        },
        zoom: 0.7,
        center: [0, 20],
        aspectScale: 0.85,
        left: 0,
        right: 0,
        boundingCoords: [[-180, 90], [180, -90]],
        data: seriesData.value,
        nameMap: {
          'United States': 'USA',
          'United States of America': 'USA',
          'USA': 'USA'
        },
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

// Initialize debug and refresh data
onMounted(() => {
  debug.value = true;
  refresh();
});
</script>

<style scoped>
.world-map-container {
  position: relative;
  width: 100%;
  margin: 0 auto;
}
</style> 