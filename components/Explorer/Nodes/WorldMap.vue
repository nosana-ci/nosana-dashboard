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
import { MapChart, ScatterChart, EffectScatterChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GeoComponent,
  VisualMapComponent
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
  GeoComponent,
  VisualMapComponent,
  MapChart,
  ScatterChart,
  EffectScatterChart,
  CanvasRenderer
]);

// Register world map with type assertion
echarts.registerMap('world', worldJson as any);

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

function getEchartsCountryName(iso2: string): string {
  const name = countries.getName(iso2, 'en');
  if (!name) return '';
  if (iso2 in specialCases) {
    return specialCases[iso2 as keyof typeof specialCases];
  }
  return name;
}

// Debug: Print all available country names in ECharts map
console.log('Available country names in ECharts map:', Array.from(echartsCountryNames));

// Convert country name to coordinates
const getCountryCoordinates = (countryName: string): [number, number] | null => {
  const feature = worldJson.features.find(f => f.properties.name === countryName);
  if (!feature) return null;
  
  // First try to use the centroid coordinates if available
  if (feature.properties.cp) {
    return feature.properties.cp as [number, number];
  }
  
  // If no centroid, calculate the center of the largest polygon
  if (feature.geometry && feature.geometry.coordinates && feature.geometry.coordinates.length > 0) {
    if (feature.geometry.type === 'Polygon') {
      const coords = feature.geometry.coordinates[0] as [number, number][];
      const lats = coords.map(c => c[1]);
      const longs = coords.map(c => c[0]);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLong = (Math.min(...longs) + Math.max(...longs)) / 2;
      return [centerLong, centerLat];
    } else if (feature.geometry.type === 'MultiPolygon') {
      // Find the largest polygon by area (approximated by number of coordinates)
      let largestPolygon: [number, number][] | null = null;
      let maxSize = 0;
      
      for (const polygon of feature.geometry.coordinates) {
        if (!Array.isArray(polygon) || !Array.isArray(polygon[0])) continue;
        const currentSize = polygon[0].length;
        if (currentSize > maxSize) {
          maxSize = currentSize;
          largestPolygon = polygon[0] as [number, number][];
        }
      }
      
      if (!largestPolygon) return null;
      
      const lats = largestPolygon.map(c => c[1]);
      const longs = largestPolygon.map(c => c[0]);
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLong = (Math.min(...longs) + Math.max(...longs)) / 2;
      
      // Handle cases where the largest polygon might cross the international date line
      if (Math.abs(Math.max(...longs) - Math.min(...longs)) > 180) {
        // Adjust coordinates that are on the other side of the date line
        const adjustedLongs = longs.map(lon => lon < 0 ? lon + 360 : lon);
        const centerLongAdjusted = (Math.min(...adjustedLongs) + Math.max(...adjustedLongs)) / 2;
        return [centerLongAdjusted > 180 ? centerLongAdjusted - 360 : centerLongAdjusted, centerLat];
      }
      
      return [centerLong, centerLat];
    }
  }
  
  return null;
};

const seriesData = computed(() => {
  if (!nodeStats.value || !Array.isArray(nodeStats.value)) return [];
  
  return nodeStats.value
    .filter(item =>
      item.country &&
      typeof item.country === 'string' &&
      item.country.length === 2 &&
      countries.isValid(item.country) &&
      item.activeNodes > 0  // Only include countries with active hosts
    )
    .map(item => {
      const countryName = getEchartsCountryName(item.country);
      const coords = getCountryCoordinates(countryName);
      if (!coords) return null;
      
      return {
        name: countryName,
        value: [...coords, item.activeNodes],  // No need for || 0 since we filtered for > 0
        totalNodes: item.totalNodes || 0,
        activeNodes: item.activeNodes,
        offlineNodes: item.offlineNodes || 0,
      };
    })
    .filter(item => item !== null);
});

// UPDATED chartOptions for scatter-based styling
const chartOptions = computed(() => {
  if (!seriesData.value.length) return null;

  const tooltipFormatter = (params: any) => {
    const { name } = params;
    const data = seriesData.value.find(item => item.name === name) || params.data;
    if (!data) return '';
    return `
      <div class="has-text-left">
        <strong>${name}</strong><br />
        Hosts: ${data.activeNodes || 0}
      </div>
    `;
  };

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: tooltipFormatter
    },
    geo: {
      map: 'world',
      roam: true,
      scaleLimit: { min: 1, max: 10 },
      tooltip: {
        show: true,
        trigger: 'item',
        formatter: tooltipFormatter
      },
      itemStyle: {
        areaColor: '#f3f3f3',
        borderColor: '#ddd'
      },
      emphasis: {
        itemStyle: {
          areaColor: '#10E80C',
          opacity: 1
        },
        label: {
          show: false
        }
      },
      label: {
        show: false
      },
      select: {
        disabled: true
      }
    },
    series: [
      {
        name: 'Hosts',
        type: 'scatter',
        coordinateSystem: 'geo',
        data: seriesData.value,
        symbolSize: (val: any) => {
          const nodeCount = Array.isArray(val) ? val[2] : 0;
          const size = Math.sqrt(nodeCount) * 5;
          return size < 5 ? 5 : size;
        },
        itemStyle: {
          color: '#10E80C'
        },
        silent: true,
        emphasis: {
          disabled: true,
          scale: false,
          focus: 'none',
          itemStyle: {
            opacity: 1
          }
        },
        blur: {
          itemStyle: {
            opacity: 1
          }
        },
        label: {
          show: false
        },
        hoverAnimation: false,
        tooltip: {
          show: false
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