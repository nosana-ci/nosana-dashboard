<template>
  <div class="mb-5">
    <h2 class="title is-5 mb-3">Deployment details</h2>
    <div class="dep-card details">
      <div class="stat-band" :class="{ 'has-vault': hasVault }">
        <!-- GPU -->
        <div class="stat">
          <span class="k">GPU</span>
          <span class="v sm" :title="gpuName">{{ gpuName }}</span>
          <span
            v-if="deployment.market && gpuName !== deployment.market"
            class="gpu-addr"
            >{{ truncateMiddle(deployment.market) }}</span
          >
        </div>

        <!-- Strategy -->
        <div class="stat">
          <span class="k">Strategy</span>
          <span class="v sm">{{ formatStrategy(deployment.strategy) }}</span>
          <span class="s" :title="scheduleTitle"
            ><template v-if="isScheduled && scheduleHuman"
              >{{ scheduleHuman }}<span class="sep">|</span></template
            >{{ timeoutDisplay }} timeout</span
          >
        </div>

        <!-- Revision -->
        <div class="stat">
          <span class="k">Revision</span>
          <span class="v">{{ deployment.active_revision }}</span>
          <span class="s">Active</span>
        </div>

        <!-- Replicas -->
        <div class="stat">
          <span class="k">Replicas</span>
          <span class="v"
            >{{ deployment.active_jobs ?? 0 }}
            <span class="u">/ {{ deployment.replicas }}</span></span
          >
          <span class="rbar"
            ><i :style="{ width: replicaFill + '%' }"></i
          ></span>
        </div>

        <!-- Vault (wallet mode only; the composable runs only when mounted) -->
        <DeploymentVaultStat
          v-if="hasVault"
          :deployment="deployment"
          class="stat"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Deployment } from "@nosana/kit";
import DeploymentVaultStat from "~/components/Deployment/DeploymentVaultStat.vue";
import { parseCronExpression } from "~/utils/parseCronExpression";
import { truncateMiddle } from "~/utils/solana";

const props = defineProps<{
  deployment: Deployment;
  hasVault: boolean;
  deploymentVault: any;
  deploymentSchedule: string | null;
  testgridMarkets: any[];
}>();

const formatStrategy = (strategy: string | undefined | null): string => {
  if (!strategy) return "-";
  return strategy
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const gpuName = computed(() => {
  const match = props.testgridMarkets?.find(
    (tgm: any) => tgm.address === props.deployment?.market,
  );
  return match?.name || props.deployment?.market || "-";
});

const replicaFill = computed(() => {
  const target = props.deployment?.replicas || 0;
  const active = props.deployment?.active_jobs ?? 0;
  if (!target) return 0;
  return Math.min(100, Math.round((active / target) * 100));
});


// Container timeout (stored in minutes) → "1h", "1h 30m", or "45m" — no trailing 0m.
const timeoutDisplay = computed(() => {
  const mins = props.deployment?.timeout || 0;
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
});

// Scheduled deployments show their cadence beside the timeout.
const isScheduled = computed(
  () => props.deployment?.strategy?.toUpperCase() === "SCHEDULED",
);
const scheduleHuman = computed(() =>
  props.deploymentSchedule ? parseCronExpression(props.deploymentSchedule) : "",
);
const scheduleTitle = computed(() =>
  props.deploymentSchedule
    ? `${scheduleHuman.value} · ${props.deploymentSchedule}`
    : "",
);
</script>

<style lang="scss" scoped>
.dep-card {
  background: $white;
  border: 1px solid $grey-lighter;
  border-radius: 14px;
  overflow: hidden;
  color: $text;
}

html.dark-mode .dep-card {
  background: $black-ter;
  border-color: rgba($white, 0.08);
  color: $white;
}

.details {
  padding: 22px 0 20px;
}

.stat-band {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.stat-band.has-vault {
  grid-template-columns: repeat(5, 1fr);
}

.stat {
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 0;
}

/* Push every sub-line to the bottom so the band's bottom row aligns across
   columns regardless of value height. */
.rbar,
.s,
.gpu-addr {
  margin-top: auto;
  padding-top: 8px;
}

.stat + .stat::before {
  content: "";
  position: absolute;
  left: 0;
  top: 1px;
  bottom: 1px;
  width: 1px;
  background: $grey-lighter;
}

html.dark-mode .stat + .stat::before {
  background: rgba($white, 0.08);
}

.k {
  font-size: 12px;
  color: $grey;
  margin-bottom: 7px;
}

.v {
  font-family: $title-family;
  font-size: 23px;
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.v .u {
  font-size: 13px;
  font-weight: 400;
  color: $grey;
  letter-spacing: 0;
}

.v.sm {
  font-size: 17px;
  letter-spacing: -0.01em;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.s {
  font-size: 12px;
  color: $grey;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gpu-addr {
  font-family: $family-monospace;
  font-size: 11px;
  color: $grey;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

html.dark-mode .k,
html.dark-mode .s,
html.dark-mode .gpu-addr {
  color: $grey-light;
}

.rbar {
  /* content-box so the shared `padding-top: 8px` (bottom-align gap) sits above
     the bar instead of collapsing its 5px height to 0 under border-box.
     Clip the track background to the content box so the 8px gap stays empty
     rather than painting a second grey band above the bar. */
  box-sizing: content-box;
  height: 5px;
  border-radius: 3px;
  background-color: $grey-lightest;
  background-clip: content-box;
  overflow: hidden;
}

.rbar i {
  display: block;
  height: 100%;
  background: $secondary;
  border-radius: 3px;
}

html.dark-mode .rbar {
  background-color: rgba($white, 0.1);
}

/* Divider between the schedule and the timeout on scheduled deployments. */
.sep {
  margin: 0 7px;
  opacity: 0.5;
}

@media screen and (max-width: 920px) {
  .stat-band {
    grid-template-columns: repeat(3, 1fr);
    row-gap: 24px;
  }

  .stat + .stat::before {
    display: none;
  }
}

@media screen and (max-width: 560px) {
  .stat-band {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
