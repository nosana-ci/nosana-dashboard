<template>
  <div class="system-usage-charts mb-5">
    <div class="is-flex is-align-items-center mb-3">
      <h2 class="title is-5 mb-0">System Usage</h2>
      <div class="select is-small ml-auto">
        <select
          :value="timeframe"
          @change="
            setTimeframe(Number(($event.target as HTMLSelectElement).value))
          "
        >
          <option :value="5 * 60">Last 5m</option>
          <option :value="15 * 60">Last 15m</option>
          <option :value="30 * 60">Last 30m</option>
          <option :value="60 * 60">Last 1h</option>
          <option :value="6 * 60 * 60">Last 6h</option>
          <option :value="24 * 60 * 60">Last 24h</option>
        </select>
      </div>
    </div>

    <div class="columns is-multiline mb-0">
      <div class="column is-6 pb-0">
        <TimeSeriesChart
          title="CPU"
          :series="cpuData.series"
          :loading="isLoading"
          y-suffix="%"
          :suggested-y-max="cpuData.max"
        />
      </div>
      <div class="column is-6 pb-0">
        <TimeSeriesChart
          title="Memory"
          :series="memory"
          :loading="isLoading"
          y-suffix=" MB"
          :legend-hint="['usage', 'limit']"
        />
      </div>
      <div class="column is-6 pb-0">
        <TimeSeriesChart
          title="Disk I/O"
          :series="disk"
          :loading="isLoading"
          y-suffix=" MB"
          :legend-hint="['read', 'write']"
        />
      </div>
      <div class="column is-6 pb-0">
        <TimeSeriesChart
          title="Network I/O"
          :series="network"
          :loading="isLoading"
          y-suffix=" MB"
          :legend-hint="['received', 'sent']"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { CPU_TIERS, type Series } from "~/composables/jobs/types";
import { useSystemUsage } from "~/composables/jobs/useSystemUsage";
import { pairedBin } from "~/composables/jobs/helpers/makePairedBin";
import TimeSeriesChart from "./TimeSeriesChart.vue";

const props = defineProps<{
  jobAddress: string;
  node: string;
  opIds: string[];
}>();

const { windowedByOp, isLoading, timeframe, setTimeframe } = useSystemUsage(
  props.jobAddress,
  props.node,
  props.opIds,
);

const cpuData = computed(() => {
  let peak = 0;
  const series: Series[] = props.opIds.map((id) => ({
    label: id,
    group: id,
    points: (windowedByOp.value[id] ?? []).map((s) => {
      peak = Math.max(peak, s.cpu.cpu_percent);
      return { x: s.timestamp, y: s.cpu.cpu_percent };
    }),
  }));
  const max = CPU_TIERS.find((t) => peak <= t) ?? peak;
  return { series, max };
});

const memory = computed(() =>
  pairedBin(
    props.opIds,
    windowedByOp.value,
    (s) => s.memory.memory_usage,
    (s) => s.memory.memory_limit,
  ),
);

const disk = computed(() =>
  pairedBin(
    props.opIds,
    windowedByOp.value,
    (s) => s.disk.read,
    (s) => s.disk.write,
  ),
);

const network = computed(() =>
  pairedBin(
    props.opIds,
    windowedByOp.value,
    (s) => s.network.received,
    (s) => s.network.sent,
  ),
);
</script>
