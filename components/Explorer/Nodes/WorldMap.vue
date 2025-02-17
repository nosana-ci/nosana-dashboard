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
  TR: 'Turkey',
  NO: 'Norway',
  VN: 'Vietnam'
} as const;

// Special coordinates for certain countries
const specialCoordinates: Record<string, [number, number]> = {
  Norway: [8, 62],  // Adjusted coordinates for Norway
  Vietnam: [108, 15]  // Adjusted coordinates for Vietnam, moved lower right
};

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
  // First check if we have special coordinates for this country
  if (countryName in specialCoordinates) {
    return specialCoordinates[countryName];
  }

  const feature = worldJson.features.find(f => f.properties.name === countryName);
  if (!feature) return null;
  
  // First try to use the centroid coordinates if available and valid
  if (feature.properties.cp) {
    const [lon, lat] = feature.properties.cp as [number, number];
    // Verify the coordinates are within the country's bounds
    if (isCoordinateWithinFeature(lon, lat, feature)) {
      return [lon, lat];
    }
  }
  
  // Calculate centroid for the largest polygon
  if (feature.geometry && feature.geometry.coordinates && feature.geometry.coordinates.length > 0) {
    if (feature.geometry.type === 'Polygon') {
      return calculatePolygonCentroid(feature.geometry.coordinates[0] as [number, number][]);
    } else if (feature.geometry.type === 'MultiPolygon') {
      // Find the largest polygon by area
      let largestPolygon: [number, number][] | null = null;
      let maxArea = 0;
      
      for (const polygon of feature.geometry.coordinates) {
        if (!Array.isArray(polygon) || !Array.isArray(polygon[0])) continue;
        const coords = polygon[0] as [number, number][];
        const area = calculatePolygonArea(coords);
        if (area > maxArea) {
          maxArea = area;
          largestPolygon = coords;
        }
      }
      
      if (largestPolygon) {
        return calculatePolygonCentroid(largestPolygon);
      }
    }
  }
  
  return null;
};

// Helper function to calculate polygon area using the shoelace formula
const calculatePolygonArea = (coords: [number, number][]): number => {
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    area += coords[i][0] * coords[j][1];
    area -= coords[j][0] * coords[i][1];
  }
  return Math.abs(area) / 2;
};

// Helper function to calculate the true centroid of a polygon
const calculatePolygonCentroid = (coords: [number, number][]): [number, number] => {
  let area = 0;
  let cx = 0;
  let cy = 0;
  
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const factor = (coords[i][0] * coords[j][1] - coords[j][0] * coords[i][1]);
    area += factor;
    cx += (coords[i][0] + coords[j][0]) * factor;
    cy += (coords[i][1] + coords[j][1]) * factor;
  }
  
  area /= 2;
  const areaFactor = 1 / (6 * area);
  
  return [
    cx * areaFactor,
    cy * areaFactor
  ];
};

// Helper function to check if a point is within a feature
const isCoordinateWithinFeature = (lon: number, lat: number, feature: any): boolean => {
  if (feature.geometry.type === 'Polygon') {
    return isPointInPolygon([lon, lat], feature.geometry.coordinates[0]);
  } else if (feature.geometry.type === 'MultiPolygon') {
    return feature.geometry.coordinates.some((polygon: any) => 
      isPointInPolygon([lon, lat], polygon[0])
    );
  }
  return false;
};

// Helper function to check if a point is within a polygon using ray casting algorithm
const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
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
    const data = seriesData.value.find(item => item.name === name);
    if (data) {
      return `
        <div class="has-text-left">
          <strong>${name}</strong><br />
          Hosts: ${data.activeNodes}
        </div>
      `;
    }
    // For countries without hosts, just show the name
    return `
      <div class="has-text-left">
        <strong>${name}</strong>
      </div>
    `;
  };

  return {
    backgroundColor: '#f9f9f9',  // Light gray tint for the sea
    tooltip: {
      trigger: 'item',
      formatter: tooltipFormatter,
      show: true
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
        areaColor: '#e8e8e8',  // Lighter gray for unselected countries
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
          const size = Math.sqrt(nodeCount) * 3;
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