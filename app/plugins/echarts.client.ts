import { defineNuxtPlugin } from '#app';
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

export default defineNuxtPlugin((nuxtApp) => {
  // Register ECharts components
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

  // Register world map
  try {
    if (!echarts.getMap('world')) {
      echarts.registerMap('world', worldJson as any);
    }
  } catch (error) {
    console.error('Error registering world map:', error);
  }

  // Register VChart component globally
  nuxtApp.vueApp.component('v-chart', VChart);
}); 