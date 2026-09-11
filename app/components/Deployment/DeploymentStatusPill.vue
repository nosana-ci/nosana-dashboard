<template>
  <span class="dep-status-pill" :class="tone">
    <StatusMark :tone="tone" :pulse="tone === 'live'" :size="12" />
    {{ statusText }}
  </span>
</template>

<script setup lang="ts">
import StatusMark from "~/components/Common/StatusMark.vue";
import { getStatusTone } from "~/composables/useStatus";

// Deployment status → tinted pill (mark + label), shared by the deployment
// detail header and the deployments list so both read the same.
const props = defineProps<{
  status?: string | number | null;
}>();

const statusString = computed(() => String(props.status ?? ""));

const statusText = computed(() => {
  const s = statusString.value;
  return (s.charAt(0) + s.slice(1).toLowerCase()).replace(/_/g, " ");
});

const tone = computed(() => getStatusTone(statusString.value));
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

/* Running and completed share the green wash; the mark inside separates them. */
.dep-status-pill.live,
.dep-status-pill.ok {
  background: rgba($success, 0.14);
  color: color.adjust($success, $lightness: -16%);
}
.dep-status-pill.warn {
  background: rgba($warning, 0.18);
  color: color.adjust($warning, $lightness: -24%);
}
.dep-status-pill.danger {
  background: rgba($danger, 0.12);
  color: $danger;
}
.dep-status-pill.neutral {
  background: rgba($status-neutral, 0.16);
  color: $text-muted;
}

html.dark-mode .dep-status-pill.warn {
  color: $warning;
}
html.dark-mode .dep-status-pill.live,
html.dark-mode .dep-status-pill.ok {
  color: $success;
}
</style>
