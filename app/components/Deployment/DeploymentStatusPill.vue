<template>
  <span class="dep-status-pill" :class="statusKind">
    <span class="sdot"></span>
    {{ statusText }}
  </span>
</template>

<script setup lang="ts">
// Deployment status → tinted pill (dot + label), shared by the deployment
// detail header and the deployments list so both read the same.
const props = defineProps<{
  status?: string | number | null;
}>();

const statusString = computed(() => String(props.status ?? ""));

const statusText = computed(() => {
  const s = statusString.value;
  return (s.charAt(0) + s.slice(1).toLowerCase()).replace(/_/g, " ");
});

// Green is "up and serving right now", so it is only ever RUNNING/ONLINE/ACTIVE.
// Blue is "finished cleanly" — deliberately not green, because the job activity
// table lists running and completed jobs side by side and that is the one
// distinction worth seeing at a glance. Orange is "on its way / waiting", red
// is failure, grey is deliberately not running.
const statusKind = computed(() => {
  const s = statusString.value.toUpperCase();
  if (["RUNNING", "ONLINE", "ACTIVE"].includes(s)) return "live";
  // Operations report their own vocabulary (waiting/pending/init); without
  // these they fell through to neutral and looked stopped while starting up.
  if (["STARTING", "DRAFT", "QUEUED", "PENDING", "WAITING", "INIT"].includes(s))
    return "warn";
  if (["ERROR", "INSUFFICIENT_FUNDS", "FAILED", "YAML_ERROR"].includes(s))
    return "danger";
  if (["COMPLETED", "SUCCESS"].includes(s)) return "ok";
  // STOPPED, STOPPING, ARCHIVED, INACTIVE, OFFLINE and anything unrecognised.
  return "neutral";
});
</script>

<style lang="scss" scoped>
@use "sass:color";

.dep-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: $title-family;
  font-weight: 600;
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  padding: 5px 12px 5px 11px;
  border-radius: 999px;
  white-space: nowrap;
}

.dep-status-pill .sdot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: none;
}

.dep-status-pill.live {
  background: rgba($success, 0.14);
  color: color.adjust($success, $lightness: -16%);
}
.dep-status-pill.live .sdot {
  position: relative;
  background: $success;
}
.dep-status-pill.live .sdot::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1.5px solid $success;
  opacity: 0.5;
  animation: sdot-pulse 2.4s ease-out infinite;
}
@keyframes sdot-pulse {
  0% {
    transform: scale(0.5);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.dep-status-pill.warn {
  background: rgba($warning, 0.18);
  color: color.adjust($warning, $lightness: -24%);
}
.dep-status-pill.warn .sdot {
  background: $warning;
}
.dep-status-pill.danger {
  background: rgba($danger, 0.12);
  color: $danger;
}
.dep-status-pill.danger .sdot {
  background: $danger;
}
.dep-status-pill.ok {
  background: rgba($info, 0.12);
  color: $info;
}
.dep-status-pill.ok .sdot {
  background: $info;
}
.dep-status-pill.neutral {
  background: rgba($status-neutral, 0.16);
  color: $text-muted;
}
.dep-status-pill.neutral .sdot {
  background: $status-neutral;
}

html.dark-mode .dep-status-pill.warn {
  color: $warning;
}
html.dark-mode .dep-status-pill.live {
  color: $success;
}
</style>
