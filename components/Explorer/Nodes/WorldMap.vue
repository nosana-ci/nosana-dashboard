<template>
  <div class="box p-0">
    <div class="world-map-container">
      <div class="aspect-ratio-container">
        <v-chart
          v-if="chartOptions"
          ref="chartRef"
          :option="chartOptions"
          @mouseover="handleMouseOver"
          @mouseout="handleMouseOut"
          :autoresize="false"
          style="width: 100%; height: 100%"
        />
        <div v-else class="has-text-centered p-4">
          Loading world map data...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from "vue";
import { useAPI } from "~/composables/useAPI";
import VChart from "vue-echarts";
import * as echarts from "echarts/core";
import { MapChart, ScatterChart, EffectScatterChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  GeoComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import worldJson from "~/assets/world.json";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import NosanaLogo from "~/assets/img/token_icons/nosana-nos-logo.svg";

// Initialize libraries
countries.registerLocale(en);
echarts.use([
  TitleComponent,
  TooltipComponent,
  GeoComponent,
  VisualMapComponent,
  MapChart,
  ScatterChart,
  EffectScatterChart,
  CanvasRenderer,
]);
echarts.registerMap("world", worldJson as any);

// Add reactive dark mode state
const darkMode = ref(false);

// Update dark mode state and watch for changes
onMounted(() => {
  const updateDarkMode = () => {
    darkMode.value = document.documentElement.classList.contains("dark-mode");
  };

  // Initial state
  updateDarkMode();

  // Watch for class changes
  const observer = new MutationObserver(updateDarkMode);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
});

// Fetch node statistics
const { data: nodeStatsResponse } = await useAPI("/api/stats/nodes-country");

// Country name mappings for ECharts
const specialCases = {
  US: "United States",
  GB: "United Kingdom",
  RU: "Russia",
  CZ: "Czech Rep.",
  KR: "Korea",
  IR: "Iran",
  CN: "China",
  HK: "Hong Kong",
  TW: "Taiwan",
  TR: "Turkey",
  NO: "Norway",
  VN: "Vietnam",
} as const;

// Special coordinates for countries that need adjustment
const specialCoordinates: Record<string, [number, number]> = {
  Norway: [8, 62],
  Vietnam: [108, 15],
};

// Convert ISO2 country code to ECharts country name
function getEchartsCountryName(iso2: string): string {
  const name = countries.getName(iso2, "en");
  if (!name) return "";
  return specialCases[iso2 as keyof typeof specialCases] || name;
}

// Get coordinates for a country
const getCountryCoordinates = (
  countryName: string
): [number, number] | null => {
  if (countryName in specialCoordinates) {
    return specialCoordinates[countryName];
  }

  const feature = worldJson.features.find(
    (f) => f.properties.name === countryName
  );
  if (!feature) return null;

  if (feature.properties.cp) {
    const [lon, lat] = feature.properties.cp as [number, number];
    if (isCoordinateWithinFeature(lon, lat, feature)) {
      return [lon, lat];
    }
  }

  if (feature.geometry?.coordinates?.length > 0) {
    if (feature.geometry.type === "Polygon") {
      return calculatePolygonCentroid(
        feature.geometry.coordinates[0] as [number, number][]
      );
    } else if (feature.geometry.type === "MultiPolygon") {
      const largestPolygon = findLargestPolygon(feature.geometry.coordinates);
      if (largestPolygon) {
        return calculatePolygonCentroid(largestPolygon);
      }
    }
  }

  return null;
};

// Helper function to find the largest polygon by area
const findLargestPolygon = (polygons: any[]): [number, number][] | null => {
  let largestPolygon: [number, number][] | null = null;
  let maxArea = 0;

  for (const polygon of polygons) {
    if (!Array.isArray(polygon) || !Array.isArray(polygon[0])) continue;
    const coords = polygon[0] as [number, number][];
    const area = calculatePolygonArea(coords);
    if (area > maxArea) {
      maxArea = area;
      largestPolygon = coords;
    }
  }

  return largestPolygon;
};

// Calculate polygon area using the shoelace formula
const calculatePolygonArea = (coords: [number, number][]): number => {
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    area += coords[i][0] * coords[j][1];
    area -= coords[j][0] * coords[i][1];
  }
  return Math.abs(area) / 2;
};

// Calculate the centroid of a polygon
const calculatePolygonCentroid = (
  coords: [number, number][]
): [number, number] => {
  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const factor = coords[i][0] * coords[j][1] - coords[j][0] * coords[i][1];
    area += factor;
    cx += (coords[i][0] + coords[j][0]) * factor;
    cy += (coords[i][1] + coords[j][1]) * factor;
  }

  area /= 2;
  const areaFactor = 1 / (6 * area);

  return [cx * areaFactor, cy * areaFactor];
};

// Check if a point is within a feature's boundaries
const isCoordinateWithinFeature = (
  lon: number,
  lat: number,
  feature: any
): boolean => {
  if (feature.geometry.type === "Polygon") {
    return isPointInPolygon([lon, lat], feature.geometry.coordinates[0]);
  } else if (feature.geometry.type === "MultiPolygon") {
    return feature.geometry.coordinates.some((polygon: any) =>
      isPointInPolygon([lon, lat], polygon[0])
    );
  }
  return false;
};

// Check if a point is within a polygon using ray casting
const isPointInPolygon = (
  point: [number, number],
  polygon: [number, number][]
): boolean => {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

// Define types for node statistics
interface NodeStatsItem {
  country: string;
  running: number;
  queue: number;
  offline: number;
  total: number;
}

interface NodeSeriesItem {
  name: string;
  value: [number, number, number]; // [longitude, latitude, count]
  total: number;
  running: number;
  queue: number;
  offline: number;
}

// Prepare data for the map visualization
const seriesData = computed(() => {
  if (
    !nodeStatsResponse.value?.data ||
    !Array.isArray(nodeStatsResponse.value.data)
  )
    return [];

  return nodeStatsResponse.value.data
    .filter(
      (item: NodeStatsItem) =>
        item.country &&
        typeof item.country === "string" &&
        item.country.length === 2 &&
        countries.isValid(item.country) &&
        item.running + item.queue > 0 // Check if there are any active nodes (running + queue)
    )
    .map((item: NodeStatsItem) => {
      const countryName = getEchartsCountryName(item.country);
      const coords = getCountryCoordinates(countryName);
      if (!coords) return null;

      return {
        name: countryName,
        value: [...coords, item.running + item.queue], // Use sum of running and queue for visualization
        total: item.total,
        running: item.running,
        queue: item.queue,
        offline: item.offline,
      } as NodeSeriesItem;
    })
    .filter((item: NodeSeriesItem | null) => item !== null);
});

// Chart configuration
const chartOptions = computed(() => {
  if (!seriesData.value.length) return null;

  const tooltipFormatter = (params: any) => {
    const { name } = params;
    const data = seriesData.value.find((item: NodeSeriesItem) => item.name === name);
    if (data) {
      return `
        <div style="background-color: ${darkMode.value ? "#1a1a1a" : "black"}; padding: 12px 20px; border-radius: 4px;">
          <div style="color: #888888; margin-bottom: 0;">${name}</div>
          <div style="margin-top: 4px; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center;">
              <img src="${NosanaLogo}" width="18" height="18" style="filter: brightness(0) saturate(100%) invert(89%) sepia(11%) saturate(6356%) hue-rotate(55deg) brightness(97%) contrast(108%);" />
              <span style="color: white; font-size: 20px; margin-left: 8px;">${data.running + data.queue}</span>
              <span style="color: #888888; margin-left: 8px;">online hosts</span>
            </div>
            <div style="color: #10E80C; font-size: 14px;">
              ${data.running} running • ${data.queue} available
            </div>
          </div>
        </div>
      `;
    }
    return `
      <div style="background-color: ${darkMode.value ? "#1a1a1a" : "black"}; padding: 12px 20px; border-radius: 4px;">
        <div style="color: #888888;">${name}</div>
      </div>
    `;
  };

  return {
    backgroundColor: darkMode.value ? "#121212" : "#f9f9f9",
    tooltip: {
      trigger: "item",
      formatter: tooltipFormatter,
      show: true,
      backgroundColor: "transparent",
      borderWidth: 0,
      padding: 0,
    },
    geo: {
      map: "world",
      roam: true,
      scaleLimit: { min: 1, max: 10 },
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      aspectScale: 1,
      boundingCoords: [
        [-180, 90],
        [180, -60],
      ],
      silent: false,
      tooltip: {
        show: true,
        trigger: "item",
        formatter: tooltipFormatter,
      },
      itemStyle: {
        areaColor: darkMode.value ? "#2c2c2c" : "#d4d4d4",
        borderColor: darkMode.value ? "#3a3a3a" : "#ffffff",
      },
      emphasis: {
        itemStyle: {
          areaColor: "#10E80C",
          opacity: 1,
        },
        label: {
          show: false,
        },
      },
      label: {
        show: false,
      },
      select: {
        disabled: true,
      },
    },
    series: [
      {
        name: "Hosts",
        type: "scatter",
        coordinateSystem: "geo",
        data: seriesData.value,
        symbolSize: (val: any) => {
          const nodeCount = Array.isArray(val) ? val[2] : 0;
          const size = Math.sqrt(nodeCount) * 3;
          return size < 5 ? 5 : size;
        },
        itemStyle: {
          color: "#10E80C",
          borderColor: "#10E80C",
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: "#10E80C",
        },
        silent: false,
        emphasis: {
          scale: false,
          itemStyle: {
            opacity: 0,
            shadowBlur: 0,
          },
        },
        focus: "none",
        select: {
          disabled: true,
        },
        selectedMode: false,
        label: {
          show: false,
        },
        hoverAnimation: false,
        tooltip: {
          show: true,
          formatter: tooltipFormatter,
        },
        triggerEvent: true,
        geoIndex: 0,
      },
    ],
  };
});

const chartRef = ref();

// Initialize chart with fixed size
onMounted(() => {
  // Wait for the chart to be mounted
  nextTick(() => {
    if (chartRef.value?.chart) {
      // Set fixed size to ensure the map doesn't resize with the viewport
      chartRef.value.chart.resize({
        width: 1800,
        height: 900 // 42% of 2000px
      });
      
      // Disable the resize observer to prevent automatic resizing
      chartRef.value.chart.setOption({
        animation: false
      });
    }
  });
});

// Event handlers for map interactions
const handleMouseOver = (params: any) => {
  if (params.componentSubType === "scatter") {
    chartRef.value?.chart?.dispatchAction({
      type: "highlight",
      geoIndex: 0,
      name: params.name,
    });
  }
};

const handleMouseOut = (params: any) => {
  if (params.componentSubType === "scatter") {
    chartRef.value?.chart?.dispatchAction({
      type: "downplay",
      geoIndex: 0,
      name: params.name,
    });
  }
};
</script>

<style scoped>
.world-map-container {
  position: relative;
  width: 100%;
  height: 100%;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  overflow: hidden;
}

.aspect-ratio-container {
  position: relative;
  width: 1800px;
  min-width: 1800px;
  height: 900px;
  background: transparent;
  overflow: hidden;

}

.aspect-ratio-container > * {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
}

.box {
  background: transparent !important;
  box-shadow: none;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border-radius: 0;
  overflow: hidden;
}

:deep(.echarts) {
  background: transparent !important;
  overflow: hidden;
}
</style>
