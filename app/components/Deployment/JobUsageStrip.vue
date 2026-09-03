<template>
  <!-- Only shown once the stats stream is actually delivering data. -->
  <div v-if="connected && usage" class="jmetrics">
    <div v-if="gpuLabel" class="mcell">
      <span class="ml">GPU</span>
      <span class="mv" :title="gpuLabel">{{ gpuLabel }}</span>
    </div>
    <div class="mcell">
      <span class="ml">CPU</span>
      <span class="mbar"><i :style="{ width: cpuBar + '%' }"></i></span>
      <span class="mv">{{ Math.round(usage.cpu) }}%</span>
    </div>
    <div class="mcell">
      <span class="ml">MEM</span>
      <span class="mbar"><i :style="{ width: memBar + '%' }"></i></span>
      <span class="mv">{{ memText }}</span>
    </div>
    <div class="mcell">
      <span class="ml">Net I/O</span>
      <span class="mv">↓ {{ fmtMb(usage.rx) }} · ↑ {{ fmtMb(usage.tx) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useJobUsageSnapshot } from "~/composables/jobs/useJobUsageSnapshot";

const props = defineProps<{ jobId: string; node: string }>();

const { connected, usage } = useJobUsageSnapshot(props.jobId, props.node);

// Static GPU spec (public endpoint) — the node's card + total VRAM.
const { data: nodeMetrics } = useAPI(`/nodes/${props.node}/metrics`, {
  default: () => null,
});

const gpuLabel = computed(() => {
  const g = (nodeMetrics.value as any)?.metrics?.gpu?.devices?.[0];
  if (!g?.name) return "";
  const vram = g.vram_total_mb
    ? ` · ${Math.round(g.vram_total_mb / 1024)} GB`
    : "";
  return `${g.name}${vram}`;
});

const cpuBar = computed(() => Math.min(100, usage.value?.cpu ?? 0));

// Memory ceiling = the node's total system RAM (falls back to the container
// limit until node metrics load).
const memMaxMb = computed(() => {
  const m = (nodeMetrics.value as any)?.metrics;
  const sys = m?.ram_mb ?? (m?.ram_gb ? m.ram_gb * 1024 : 0);
  return sys || usage.value?.memLimit || 0;
});

const memBar = computed(() => {
  const u = usage.value;
  const max = memMaxMb.value;
  if (!u || !max) return 0;
  return Math.min(100, (u.memUsage / max) * 100);
});

const memText = computed(() => {
  const u = usage.value;
  if (!u) return "—";
  const max = memMaxMb.value;
  const useGb = Math.max(u.memUsage, max) >= 1024;
  const unit = useGb ? "GB" : "MB";
  const f = (mb: number) =>
    useGb ? (mb / 1024).toFixed(1) : String(Math.round(mb));
  return max > 0
    ? `${f(u.memUsage)} / ${f(max)} ${unit}`
    : `${f(u.memUsage)} ${unit}`;
});

const fmtMb = (mb: number) =>
  mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
</script>

<style lang="scss" scoped>
.jmetrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 0.8rem;
}

.mcell {
  display: flex;
  align-items: center;
  gap: 9px;
  background: $grey-lightest;
  border-radius: 9px;
  padding: 8px 11px;
  min-width: 0;

  .ml {
    font-size: 0.62rem;
    letter-spacing: 0.05em;
    color: $grey;
    font-weight: 600;
    flex: none;
  }

  .mbar {
    flex: 1;
    min-width: 20px;
    height: 5px;
    border-radius: 3px;
    background: $grey-lighter;
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      width: 0;
      background: $info;
      border-radius: 3px;
      transition: width 0.5s ease;
    }
  }

  .mv {
    margin-left: auto;
    font-size: 0.75rem;
    color: $grey-dark;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

html.dark-mode .mcell {
  background: rgba($white, 0.05);

  .mbar {
    background: rgba($white, 0.1);
  }

  .mv {
    color: $grey-light;
  }
}

@media screen and (max-width: 768px) {
  .jmetrics {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
