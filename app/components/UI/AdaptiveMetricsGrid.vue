<template>
  <div>
    <div v-if="resolved.secondary.length" class="columns is-multiline is-variable is-0 no-padding">
      <div
        v-for="field in resolved.secondary"
        :key="field.key"
        class="column is-one-fifth is-full-mobile no-padding quick-detail-column"
        style="min-width:220px;"
      >
        <slot :name="field.key" :field="field" :sources="sources">
          <div class="quick-detail-item">
            <span class="quick-detail-label">{{ field.label }}</span>
            <span class="quick-detail-value">{{ field.displayValue }}</span>
          </div>
        </slot>
      </div>
    </div>

    <hr v-if="resolved.primary.length && resolved.secondary.length" class="my-4" />

    <div v-if="resolved.primary.length" class="columns is-multiline is-variable is-0 no-padding">
      <div
        v-for="field in resolved.primary"
        :key="field.key"
        class="column is-one-fifth is-full-mobile no-padding quick-detail-column"
        style="min-width:220px;"
      >
        <slot :name="field.key" :field="field" :sources="sources">
          <div class="quick-detail-item">
            <span class="quick-detail-label">{{ field.label }}</span>
            <span class="quick-detail-value">{{ field.displayValue }}</span>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, type PropType } from "vue";

export type MetricFormatter =
  | "string"
  | "mbps"
  | "gb"
  | "mb"
  | "country"
  | "version"
  | "address";

export type MetricTransform = "gbToMb";

export type MetricField = {
  key: string;
  label: string;
  paths: string[];
  formatter?: MetricFormatter;
  transform?: MetricTransform;
  transformPaths?: Partial<Record<string, MetricTransform>>;
  emptyBehavior?: "hide" | "placeholder";
  placeholder?: string;
  priority?: "primary" | "secondary";
};

export type MetricSources = Record<string, unknown>;

export type ResolvedMetricField = {
  key: string;
  label: string;
  value: unknown;
  displayValue: string;
  hidden: boolean;
  priority: "primary" | "secondary";
};

const getValueAtPath = (source: unknown, path: string): unknown => {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, source);
};

const transformMetricValue = (
  value: unknown,
  transform?: MetricTransform
): unknown => {
  if (value === null || value === undefined || !transform) {
    return value;
  }

  switch (transform) {
    case "gbToMb":
      return Number(value) * 1024;
    default:
      return value;
  }
};

const firstDefined = (
  paths: string[],
  sources: MetricSources
): { path?: string; value: unknown } => {
  for (const path of paths) {
    const value = getValueAtPath(sources, path);
    if (value !== null && value !== undefined) {
      return { path, value };
    }
  }

  return { value: undefined };
};

export const formatMetricValue = (
  value: unknown,
  formatter: MetricFormatter = "string"
): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  switch (formatter) {
    case "mbps":
      return `${Math.round(Number(value))} Mbps`;
    case "gb":
      return `${Math.round(Number(value))} GB`;
    case "mb":
      return `${Math.round(Number(value))} MB`;
    case "country": {
      const region = new Intl.DisplayNames(["en"], { type: "region" }).of(String(value));
      return region || String(value);
    }
    case "version":
    case "address":
    case "string":
    default:
      return String(value);
  }
};

export const resolveMetricField = (
  field: MetricField,
  sources: MetricSources
): ResolvedMetricField => {
  const resolved = firstDefined(field.paths, sources);
  const transform = resolved.path
    ? field.transformPaths?.[resolved.path] ?? field.transform
    : field.transform;
  const value = transformMetricValue(resolved.value, transform);
  const hasValue = value !== null && value !== undefined;
  const emptyBehavior = field.emptyBehavior ?? "placeholder";

  return {
    key: field.key,
    label: field.label,
    value,
    displayValue: hasValue
      ? formatMetricValue(value, field.formatter)
      : field.placeholder ?? "-",
    hidden: !hasValue && emptyBehavior === "hide",
    priority: field.priority ?? "secondary",
  };
};

export const resolveMetricFields = (
  fields: readonly MetricField[],
  sources: MetricSources
) => {
  const resolved = fields
    .map((field) => resolveMetricField(field, sources))
    .filter((field) => !field.hidden);

  return {
    primary: resolved.filter((field) => field.priority === "primary"),
    secondary: resolved.filter((field) => field.priority !== "primary"),
  };
};

export default defineComponent({
  name: "AdaptiveMetricsGrid",
  props: {
    sources: {
      type: Object as PropType<MetricSources>,
      required: true,
    },
    fields: {
      type: Array as PropType<MetricField[]>,
      required: true,
    },
  },
  setup(props) {
    const sources = computed(() => props.sources);
    const resolved = computed(() => resolveMetricFields(props.fields, props.sources));

    return {
      sources,
      resolved,
    };
  },
});
</script>

<style scoped>
.quick-detail-item{padding:0.2rem 0.5rem;border-radius:4px;display:flex;flex-direction:column;height:100%}
.quick-detail-label{font-size:.7rem;font-weight:600;color:#7a7a7a;text-transform:uppercase;margin-bottom:.1rem}
.quick-detail-value{font-size:.85rem;font-weight:500;color:#363636;word-break:break-word}
.quick-detail-column{margin-bottom:0!important}
.no-padding{padding:0!important}
html.dark-mode .quick-detail-item .quick-detail-label{color:#b0b0b0}
html.dark-mode .quick-detail-item .quick-detail-value{color:#ffffff}
</style>