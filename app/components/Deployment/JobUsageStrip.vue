<template>
  <!-- Only shown once the stats stream is actually delivering data. Compact
       chips: a ring gauge for each bounded figure, text for I/O; the panel
       has the charts for detail. -->
  <div v-if="connected && usage" class="jmetrics">
    <span v-for="cell in cells" :key="cell.label" class="mcell">
      <svg
        v-if="cell.pct !== undefined"
        class="mring"
        viewBox="0 0 16 16"
        role="img"
        :aria-label="`${cell.label} ${Math.round(cell.pct)} percent`"
      >
        <circle class="mring-track" cx="8" cy="8" r="6" />
        <circle
          v-if="cell.pct > 0"
          class="mring-fill"
          cx="8"
          cy="8"
          r="6"
          :stroke-dasharray="`${(cell.pct / 100) * RING} ${RING}`"
        />
      </svg>
      <span class="ml">{{ cell.label }}</span>
      <span class="mv">{{ cell.value }}</span>
    </span>
  </div>
</template>

<script setup lang="ts">
import { useJobUsageSnapshot } from "~/composables/jobs/useJobUsageSnapshot";

const props = defineProps<{ jobId: string; node: string; deploymentId: string }>();

const { connected, usage } = useJobUsageSnapshot(props.jobId, props.deploymentId);

// Read for the memory ceiling; the card itself is shown in the panel header.
const { metrics: nodeMetrics } = useNodeGpu(() => props.node);

// VRAM ceiling = the devices the job's processes sit on, as the sidecar
// reports them; an idle job sits on none, so the node's card total stands in.
const vramMaxMb = computed(() => {
  const g = usage.value?.gpu;
  if (!g) return 0;
  if (g.memLimit > 0) return g.memLimit;
  const devices: Array<{ vram_total_mb?: number }> =
    (nodeMetrics.value as any)?.metrics?.gpu?.devices ?? [];
  return devices.reduce((sum, d) => sum + (d.vram_total_mb ?? 0), 0);
});

// Same "used / total" form as MEM, in GB once either side reaches it.
const vramText = computed(() => {
  const g = usage.value?.gpu;
  if (!g) return "—";
  const max = vramMaxMb.value;
  const useGb = Math.max(g.memUsage, max) >= 1024;
  const unit = useGb ? "GB" : "MB";
  const f = (mb: number) =>
    useGb ? (mb / 1024).toFixed(1) : String(Math.round(mb));
  return max > 0
    ? `${f(g.memUsage)} / ${f(max)} ${unit}`
    : `${f(g.memUsage)} ${unit}`;
});

// Memory ceiling = the node's total system RAM (falls back to the container
// limit until node metrics load).
const memMaxMb = computed(() => {
  const m = (nodeMetrics.value as any)?.metrics;
  const sys = m?.ram_mb ?? (m?.ram_gb ? m.ram_gb * 1024 : 0);
  return sys || usage.value?.memLimit || 0;
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

/** Circumference of the 16px ring (r = 6), for the dash that draws its fill. */
const RING = 2 * Math.PI * 6;

const pct = (used: number, max: number) =>
  max > 0 ? Math.min(100, (used / max) * 100) : 0;

// GPU first when the node reports it; a ring only where the figure has a
// ceiling (the GPU percent is summed over devices, so full = every device).
const cells = computed(() => {
  const u = usage.value;
  if (!u) return [];
  const g = u.gpu;
  return [
    ...(g
      ? [
          {
            label: "GPU",
            value: `${Math.round(g.percent)}%`,
            pct: pct(g.percent, 100 * Math.max(1, g.devices)),
          },
          {
            label: "VRAM",
            value: vramText.value,
            pct: pct(g.memUsage, vramMaxMb.value),
          },
        ]
      : []),
    { label: "CPU", value: `${Math.round(u.cpu)}%`, pct: Math.min(100, u.cpu) },
    {
      label: "MEM",
      value: memText.value,
      pct: pct(u.memUsage, memMaxMb.value),
    },
    {
      label: "Net I/O",
      value: `↓ ${fmtMb(u.rx)} · ↑ ${fmtMb(u.tx)}`,
      pct: undefined as number | undefined,
    },
  ];
});
</script>

<style lang="scss" scoped>
.jmetrics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 0.8rem;
}

/* The chips share the row's width (each grows from its own content), so the
   strip spans the same width as the row above it; the value sits at the
   chip's right edge. */
.mcell {
  display: inline-flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 7px;
  background: $surface-sunken;
  border-radius: 7px;
  padding: 5px 9px;
  white-space: nowrap;

  .ml {
    font-size: 0.62rem;
    letter-spacing: 0.05em;
    color: $text-muted;
    font-weight: 600;
  }

  .mv {
    margin-left: auto;
    font-size: 0.75rem;
    color: $grey-dark;
    font-variant-numeric: tabular-nums;
  }

  .mring {
    flex: none;
    width: 16px;
    height: 16px;
    transform: rotate(-90deg);
  }

  .mring-track,
  .mring-fill {
    fill: none;
    stroke-width: 2.5;
  }

  .mring-track {
    stroke: $surface-track;
  }

  .mring-fill {
    stroke: $secondary;
    stroke-linecap: round;
    transition: stroke-dasharray 0.5s ease;
  }
}

html.dark-mode .mcell {
  background: rgba($white, 0.05);

  .mv {
    color: $grey-light;
  }

  .mring-track {
    stroke: rgba($white, 0.12);
  }
}
</style>
