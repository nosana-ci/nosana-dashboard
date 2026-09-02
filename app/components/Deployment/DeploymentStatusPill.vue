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

const statusKind = computed(() => {
  const s = statusString.value.toUpperCase();
  if (s === "RUNNING") return "live";
  if (["STARTING", "DRAFT", "QUEUED"].includes(s)) return "warn";
  if (["ERROR", "INSUFFICIENT_FUNDS", "FAILED"].includes(s)) return "danger";
  if (["COMPLETED", "SUCCESS"].includes(s)) return "ok";
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
  background: rgba($info, 0.12);
  color: $info;
}
.dep-status-pill.live .sdot {
  position: relative;
  background: $info;
}
.dep-status-pill.live .sdot::after {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 1.5px solid $info;
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
  background: rgba($success, 0.14);
  color: color.adjust($success, $lightness: -16%);
}
.dep-status-pill.ok .sdot {
  background: $success;
}
.dep-status-pill.neutral {
  background: rgba($grey, 0.16);
  color: $grey;
}
.dep-status-pill.neutral .sdot {
  background: $grey;
}

html.dark-mode .dep-status-pill.warn {
  color: $warning;
}
html.dark-mode .dep-status-pill.ok {
  color: $success;
}
</style>
