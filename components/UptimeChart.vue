<template>
  <div style="height: 400px; position: relative;">
    <!-- <h3 class="title is-4">Node Uptime</h3> -->
    <p v-if="averageUptimeDisplay !== null" class="subtitle is-6 has-text-grey mt-1 mb-3">
      Uptime ({{ selectedPeriodLabel }}): {{ averageUptimeDisplay.toFixed(2) }}%
    </p>
    <div class="content" style="height: 100%;">
      <div class="field is-grouped is-justify-content-end" style="position: absolute; top: 12px; right: 12px; z-index: 1;">
        <div class="control">
          <div class="buttons has-addons">
            <button
              v-for="period in ['30d', '90d', 'all']"
              :key="period"
              class="button is-small"
              :class="{ 'is-primary': selectedPeriod === period }"
              @click="() => {
                selectedPeriod = period as '30d' | '90d' | 'all';
                refreshUptimeData();
              }"
            >
              {{ period === 'all' ? 'All time' : period }}
            </button>
          </div>
        </div>
      </div>
      <div v-if="!loadingUptime && chartData" style="height: 100%;">
        <Line
          v-if="chartData.labels.length"
          :data="chartData"
          :options="chartOptions"
          style="height: 100%;"
        />
        <p v-else class="has-text-centered mt-6">No uptime data for the selected period.</p>
      </div>
      <progress
        v-else-if="loadingUptime"
        class="progress is-small is-info"
        max="100"
      >
      </progress>
      <p v-else>No uptime data available.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler);

const props = defineProps<{
  nodeAddress: string;
}>();

const selectedPeriod = ref<'30d' | '90d' | 'all'>('30d');
const averageUptimeDisplay = ref<number | null>(null);

const selectedPeriodLabel = computed(() => {
  switch (selectedPeriod.value) {
    case '30d': return 'Last 30 Days';
    case '90d': return 'Last 90 Days';
    case 'all': return 'All Time';
    default: return '';
  }
});

// Calculate date range based on selected period
const uptimeEndpoint = computed(() => {
  if (!props.nodeAddress) return undefined;
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  let startDateString: string | undefined = undefined;

  if (selectedPeriod.value !== 'all') {
    const startDate = new Date(yesterday);
    if (selectedPeriod.value === '30d') {
      startDate.setDate(startDate.getDate() - 29); // 30 days total, ending yesterday
    } else if (selectedPeriod.value === '90d') {
      startDate.setDate(startDate.getDate() - 89); // 90 days total, ending yesterday
    }
    startDateString = formatDate(startDate);
  }

  const endDateString = formatDate(yesterday);
  
  let url = `/api/nodes/heartbeats/uptime/${props.nodeAddress}?endDate=${endDateString}`;
  if (startDateString) {
    url += `&startDate=${startDateString}`;
  }
  // If startDateString is undefined (for 'all' time), the startDate query param is omitted.
  
  return url;
});

const {
  data: uptimeData,
  pending: loadingUptime,
  refresh: refreshUptimeData
} = useAPI(() => {
  const endpoint = uptimeEndpoint.value;
  if (!endpoint) {
    return '';
  }
  return endpoint;
}, {
  default: () => [],
  immediate: true,
  watch: false
});

// Transform uptime data for chart
const chartData = computed(() => {
  const rawApiData = uptimeData.value;
  if (!rawApiData || !Array.isArray(rawApiData) || rawApiData.length === 0) {
    return { labels: [], datasets: [] };
  }

  const apiDataMap = new Map<string, number>();
  let earliestApiDate: Date | null = null;
  let latestApiDate: Date | null = null;

  rawApiData.forEach((item: any) => {
    if (item.dayStart && typeof item.uptimePercentage === 'number') {
      const itemDate = new Date(item.dayStart + 'T00:00:00Z');
      apiDataMap.set(item.dayStart, item.uptimePercentage);
      if (!earliestApiDate || itemDate < earliestApiDate) {
        earliestApiDate = itemDate;
      }
      if (!latestApiDate || itemDate > latestApiDate) {
        latestApiDate = itemDate;
      }
    }
  });

  // Explicitly check if earliestApiDate and latestApiDate were set (i.e., data was processed)
  if (apiDataMap.size === 0 || !earliestApiDate || !latestApiDate) {
    return { labels: [], datasets: [] }; // No valid data points found
  }
  
  // At this point, earliestApiDate and latestApiDate are guaranteed to be Date objects.
  const minApiDate: Date = earliestApiDate; 
  const maxApiDate: Date = latestApiDate;

  const labels: string[] = [];
  const dataPoints: number[] = [];
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0); // Normalize to UTC start of day

  let chartRangeStartDate: Date;
  const chartRangeEndDate: Date = new Date(yesterday); // Iterate up to and including yesterday

  // Determine the start date for the chart's X-axis based on selected period and available data
  if (selectedPeriod.value === 'all') {
    chartRangeStartDate = new Date(minApiDate);
  } else {
    let daysToSubtract = 0;
    if (selectedPeriod.value === '30d') {
      daysToSubtract = 29; // Show 30 days total (yesterday + 29 past days)
    } else { // 90d
      daysToSubtract = 89; // Show 90 days total
    }
    const periodStartDate = new Date(yesterday);
    periodStartDate.setUTCDate(yesterday.getUTCDate() - daysToSubtract);
    
    // Chart should not show leading empty space if data starts later than the period window
    chartRangeStartDate = periodStartDate > minApiDate! ? periodStartDate : new Date(minApiDate!);
    // And chart should not start before the calculated period start date
    if (chartRangeStartDate < periodStartDate) {
        chartRangeStartDate = periodStartDate;
    }
  }
  // Ensure chart range does not extend beyond yesterday or before minApiDate if data is sparse
  if (chartRangeStartDate > yesterday) chartRangeStartDate = new Date(yesterday);
  if (chartRangeEndDate < chartRangeStartDate) return { labels: [], datasets: [] }; // Invalid range

  // Iterate from chartRangeStartDate up to chartRangeEndDate (yesterday)
  let currentDateIter = new Date(chartRangeStartDate);
  while (currentDateIter <= chartRangeEndDate) {
    const dateStringKey = currentDateIter.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const displayLabel = currentDateIter.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      timeZone: 'UTC'
    });
    labels.push(displayLabel);

    // If the current iteration date is within the actual API data range (minApiDate to maxApiDate)
    // then check the map. If it's outside this actual data range but within our chart display window,
    // it implies a zero based on the period selection (e.g. 30d view, data only for last 10d).
    if (currentDateIter >= minApiDate! && currentDateIter <= maxApiDate!) {
        dataPoints.push(apiDataMap.get(dateStringKey) || 0); // Fill gaps with 0
    } else {
        // This covers days within the selected period (30d/90d) but outside actual data coverage
        dataPoints.push(0); 
    }
    
    currentDateIter.setUTCDate(currentDateIter.getUTCDate() + 1);
  }
  
  if (labels.length === 0) {
      averageUptimeDisplay.value = null; // Reset average if no data
      return { labels: [], datasets: [] };
  }

  // Calculate average uptime from displayed data points
  if (dataPoints.length > 0) {
    const sum = dataPoints.reduce((acc, val) => acc + val, 0);
    averageUptimeDisplay.value = sum / dataPoints.length;
  } else {
    averageUptimeDisplay.value = null;
  }

  const nosanaGreen = '#10E80C';
  const nosanaGreenFill = '#10E80C45'; // Semi-transparent for fill

  // Point colors based on uptime percentage
  const pointBackgroundColors = dataPoints.map(percentage => {
    if (percentage === 0) return '#e0e0e0'; // Grey for no data / 0% uptime
    if (percentage >= 95) return nosanaGreen;
    if (percentage >= 80) return '#f9d54b'; // Yellow
    return '#f14668'; // Red
  });

  const dataset = {
    label: 'Uptime %',
    data: dataPoints,
    borderColor: nosanaGreen,
    backgroundColor: nosanaGreenFill,
    fill: true,
    tension: 0.4, // For a smoother line
    pointBackgroundColor: pointBackgroundColors,
    pointBorderColor: 'white',
    pointRadius: 0, // Set to 0 to hide points
    pointHoverRadius: 0, // Set to 0 to hide points on hover
    pointHitRadius: 10, // Larger invisible radius for hover interaction
    borderWidth: 2, // Line thickness
  };

  return {
    labels,
    datasets: [dataset],
  };
});

// Chart options
const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 2,
    layout: {
      padding: {
        left: 5,
        right: 10,
        top: 10,
        bottom: 50
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        intersect: false,
        mode: 'index' as const,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          fontFamily: "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          size: 14,
          weight: 'normal' as const,
          lineHeight: 1.4
        },
        titleColor: '#ffffff',
        bodyFont: {
          fontFamily: "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          size: 13,
          lineHeight: 1.4
        },
        bodyColor: '#ffffff',
        padding: 12,
        cornerRadius: 4,
        displayColors: false,
        boxPadding: 4,
        callbacks: {
          title: function(tooltipItems: any) {
            return tooltipItems[0].label;
          },
          label: function(context: any) {
            const uptime = context.parsed.y;
            return `Uptime: ${uptime.toFixed(2)}%`;
          }
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            fontFamily: "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            size: 13,
            weight: 'normal' as const,
            lineHeight: 1.2
          },
          color: '#000000',
          padding: 8,
          maxTicksLimit: 10
        },
        border: {
          width: 0,
          color: 'transparent'
        }
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: '#e5e5e5',
          drawBorder: false,
          lineWidth: 0.5,
          tickLength: 4,
          display: true,
          drawTicks: true,
          drawOnChartArea: true,
          count: 5
        },
        border: {
          width: 0,
          color: 'transparent'
        },
        ticks: {
          callback: function(value: any) {
            return value + '%';
          },
          font: {
            fontFamily: "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            size: 12,
            weight: 'normal' as const,
            lineHeight: 1.2
          },
          color: '#000000',
          maxTicksLimit: 5,
          padding: 10
        }
      }
    },
    elements: {
      line: {
        tension: 0.4
      }
    },
    animation: {
      duration: 800
    }
  };
});

// Watch for prop changes and refresh data
watch([() => props.nodeAddress, selectedPeriod], ([newNodeAddress, newPeriod]) => {
  if (newNodeAddress && uptimeEndpoint.value) {
    nextTick(() => {
      refreshUptimeData();
    });
  }
}, { immediate: true });
</script>

<style scoped>
.buttons.has-addons .button {
  border-radius: 4px; 
}
.buttons.has-addons .button:not(:last-child) {
  border-right: none;
  margin-right: -1px;
}
.buttons.has-addons .button:first-child {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.buttons.has-addons .button:last-child {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.buttons.has-addons .button.is-primary {
  z-index: 1; 
}
</style> 