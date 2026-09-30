<template>
  <div class="field">
    <div
      class="is-flex is-justify-content-space-between is-align-items-center mb-2"
    >
      <label class="label mb-0">{{ label }}</label>
      <button
        v-if="!readonly && offerable.length"
        type="button"
        class="button is-small is-ghost has-text-weight-normal"
        @click="toggleAll"
      >
        {{ allSelected ? "Select none" : "Select all" }}
      </button>
    </div>

    <p v-if="loading" class="has-text-grey is-size-7">Loading permissions…</p>

    <p
      v-else-if="
        (!rows.length && !standalone.length) || (readonly && !modelValue.length)
      "
      class="has-text-grey is-size-7"
    >
      {{ unavailableNote }}
    </p>

    <div v-else>
      <div class="scope-grid">
        <table class="scope-table">
          <colgroup>
            <col />
            <col class="scope-col-verb" />
            <col class="scope-col-verb" />
          </colgroup>
          <!-- No column headings: each checkbox is labelled by what it allows, so
               read/write pairs and one-off permissions (use, sign, manage) line up
               in the same two columns. -->
          <tbody>
            <tr v-for="row in rows" :key="row.key">
              <td class="has-text-weight-semibold scope-nowrap">
                {{ row.label }}
              </td>
              <td v-for="(cell, index) in row.cells" :key="cell.scope || index">
                <ScopeCheck
                  v-if="cell.scope"
                  :tooltip="cell.tooltip"
                  :credits="cell.credits"
                  :readonly="readonly"
                  :checked="isSelected(cell.scope)"
                  @toggle="toggle(cell.scope)"
                >
                  <span>{{ index === 0 ? "Read" : "Write" }}</span>
                </ScopeCheck>
              </td>
            </tr>
            <tr v-for="entry in standalone" :key="entry.scope">
              <td class="has-text-weight-semibold scope-nowrap">
                {{ entry.label }}
              </td>
              <td>
                <ScopeCheck
                  :tooltip="entry.tooltip"
                  :credits="entry.credits"
                  :readonly="readonly"
                  :checked="isSelected(entry.scope)"
                  @toggle="toggle(entry.scope)"
                >
                  <span class="is-capitalized">{{ entry.verb }}</span>
                </ScopeCheck>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p v-if="help" class="help">{{ help }}</p>
  </div>
</template>

<script setup lang="ts">
import ScopeCheck from "~/components/Account/ScopeCheck.vue";
import {
  scopeResourceLabel,
  type ScopeDescriptor,
} from "~/composables/useScopeCatalogue";

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    help?: string;
    unavailableNote?: string;
    /**
     * Restrict which scopes are offered. Defaults to the whole vocabulary, which is right
     * for an API key; an OAuth app takes the grantable subset, since it cannot hold a scope
     * whose routes only accept an API key.
     */
    options?: ScopeDescriptor[];
    label?: string;
    /** Show what a credential holds instead of letting it be changed. */
    readonly?: boolean;
  }>(),
  { label: "Permissions", help: "", unavailableNote: "", readonly: false },
);

const emit = defineEmits<{ "update:modelValue": [string[]] }>();

const { scopes: allScopes, loading, spendsCredits } = useScopeCatalogue();

const available = computed(() => props.options ?? allScopes.value);

// Viewing must show every scope a credential holds, including one the catalogue no longer
// offers; selecting must stay bounded by what is offerable.
const entries = computed<ScopeDescriptor[]>(() => {
  if (!props.readonly) return available.value;
  const known = new Set(available.value.map((entry) => entry.scope));
  return [
    ...available.value,
    ...props.modelValue
      .filter((scope) => !known.has(scope))
      .map((scope) => ({ scope, description: "", oauthGrantable: false })),
  ];
});

interface Cell {
  /** Empty when the resource has no read (or write) permission — the cell renders as a dash. */
  scope: string;
  tooltip?: string;
  credits?: boolean;
}

interface Row {
  key: string;
  label: string;
  cells: [Cell, Cell];
}

/** Resources with a genuine read/write pair — the grid. */
const rows = computed<Row[]>(() => {
  const out: Row[] = [];
  const byResource = new Map<string, Row>();

  for (const entry of entries.value) {
    const [resource, verb] = entry.scope.split(":");
    if (verb !== "read" && verb !== "write") continue; // see `standalone`

    let row = byResource.get(resource);
    if (!row) {
      row = {
        key: resource,
        label: scopeResourceLabel(resource),
        cells: [{ scope: "" }, { scope: "" }],
      };
      byResource.set(resource, row);
      out.push(row);
    }
    row.cells[verb === "read" ? 0 : 1] = {
      scope: entry.scope,
      tooltip: [entry.scope, entry.description].filter(Boolean).join(" — "),
      credits: spendsCredits(entry.description),
    };
  }

  return out;
});

interface StandaloneEntry {
  scope: string;
  label: string;
  verb: string;
  tooltip: string;
  credits: boolean;
}

/**
 * Permissions whose verb isn't read/write (use, sign, manage) — a scope on its own,
 * not a column in a table that only has two columns.
 */
const standalone = computed<StandaloneEntry[]>(() =>
  entries.value
    .filter((entry) => {
      const verb = entry.scope.split(":")[1];
      return verb !== "read" && verb !== "write";
    })
    .map((entry) => {
      const [resource, verb] = entry.scope.split(":");
      return {
        scope: entry.scope,
        label: scopeResourceLabel(resource),
        verb,
        tooltip: [entry.scope, entry.description].filter(Boolean).join(" — "),
        credits: spendsCredits(entry.description),
      };
    }),
);

const offerable = computed(() => available.value.map((entry) => entry.scope));

const isSelected = (scope: string) => props.modelValue.includes(scope);

const toggle = (scope: string) =>
  emit(
    "update:modelValue",
    isSelected(scope)
      ? props.modelValue.filter((held) => held !== scope)
      : [...props.modelValue, scope],
  );

const allSelected = computed(
  () =>
    offerable.value.length > 0 &&
    offerable.value.every((scope) => isSelected(scope)),
);

const toggleAll = () =>
  emit("update:modelValue", allSelected.value ? [] : [...offerable.value]);
</script>

<style scoped lang="scss">
// A bordered card, not a bare table — reads as one control, matching the
// rounded inputs/selects around it in the modal instead of a spreadsheet.
//
// No `overflow: hidden` here: it would also clip the tooltip popups on cells near
// the card's edges. The corners are rounded on the table's own corner cells instead.
.scope-grid {
  border: 1px solid $border;
  border-radius: 10px;
}

.scope-table {
  width: 100%;
  background: transparent;
  margin-bottom: 0;

  // Fixed columns for the checkboxes, so they sit in two straight lines whatever
  // the label beside them says.
  table-layout: fixed;

  .scope-col-verb {
    width: 132px;
  }

  td {
    padding: 0.3rem 0.85rem;
    vertical-align: middle;
  }

  // The checkbox's own padding would push it right of the column's edge.
  td + td {
    padding-left: 0.35rem;
  }

  tr:first-child td {
    padding-top: 0.6rem;
  }

  tr:last-child td {
    padding-bottom: 0.6rem;
  }
}

// Bulma has no nowrap helper — the one property this needs that a class can't give.
.scope-nowrap {
  white-space: nowrap;
}

// The light hairline reads as a hard outline on a dark dialog.
html.dark-mode {
  .scope-grid {
    border-color: rgba($white, 0.12);
  }
}
</style>
