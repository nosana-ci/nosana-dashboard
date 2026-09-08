<template>
  <div :class="{ 'min-height-container': !hasLoadedOnce }">
    <div class="table-container">
      <table class="table is-fullwidth is-hoverable deployments-table">
        <thead>
          <tr>
            <th class="select-col">
              <label class="sel-label">
                <input
                  type="checkbox"
                  class="sel-check"
                  aria-label="Select all deployments on this page"
                  :checked="allSelected"
                  :indeterminate="selectedIds.size > 0 && !allSelected"
                  :disabled="bulkRunning !== null || !deployments.length"
                  @change="toggleAll"
                />
              </label>
            </th>
            <th>Deployment</th>
            <th>Market</th>
            <th>Status</th>
            <th>Active Jobs</th>
            <th v-if="isWalletMode">Vault</th>
            <th>Last Updated</th>
            <th class="chev-col"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!hasLoadedOnce">
            <td :colspan="columnCount" class="has-text-centered py-6">
              Loading deployments...
            </td>
          </tr>
          <tr v-else-if="hasLoadedOnce && deploymentsError">
            <td
              :colspan="columnCount"
              class="has-text-centered has-text-danger"
            >
              Failed to load deployments: {{ deploymentsError }}
            </td>
          </tr>
          <tr v-else-if="hasLoadedOnce && !deployments.length">
            <td :colspan="columnCount" class="has-text-centered">
              No deployments found
            </td>
          </tr>
          <template v-else>
            <tr
              v-for="deployment in sortedDeployments"
              :key="deployment.id"
              class="clickable-row"
              :class="{ 'is-selected': selectedIds.has(deployment.id) }"
              @click="openDeployment($event, deployment.id)"
            >
              <!-- Stop the click here so ticking a box never opens the row -->
              <td class="select-cell" @click.stop>
                <label class="sel-label">
                  <input
                    type="checkbox"
                    class="sel-check"
                    :aria-label="`Select ${deployment.name || deployment.id}`"
                    :checked="selectedIds.has(deployment.id)"
                    :disabled="bulkRunning !== null"
                    @change="toggleOne(deployment.id)"
                  />
                </label>
              </td>
              <td>
                <NuxtLink
                  :to="`/deployments/${deployment.id}`"
                  class="clickable-row-link clickable-row-cell-content"
                >
                  <div class="deployment-name">
                    {{ deployment.name }}
                  </div>
                  <div
                    class="deployment-id is-family-monospace"
                    :title="deployment.id"
                  >
                    {{ truncateMiddle(deployment.id, 6, 6) }}
                  </div>
                </NuxtLink>
              </td>
              <td>
                <NuxtLink
                  :to="`/deployments/${deployment.id}`"
                  class="clickable-row-link clickable-row-cell-content"
                >
                  <span class="market-name" :title="deployment.market">{{
                    marketLabel(deployment.market)
                  }}</span>
                </NuxtLink>
              </td>
              <td>
                <NuxtLink
                  :to="`/deployments/${deployment.id}`"
                  class="clickable-row-link clickable-row-cell-content"
                >
                  <DeploymentStatusPill :status="deployment.status" />
                </NuxtLink>
              </td>
              <td>
                <NuxtLink
                  :to="`/deployments/${deployment.id}`"
                  class="clickable-row-link clickable-row-cell-content"
                  :class="{ 'has-text-grey': !deployment.active_jobs }"
                  >{{ deployment.active_jobs || 0 }}
                  {{ deployment.active_jobs === 1 ? "Job" : "Jobs" }}</NuxtLink
                >
              </td>
              <VaultOverviewRows
                v-if="isWalletMode === true"
                :isTableRow="false"
                :deployment="deployment"
              />
              <td class="updated-cell">
                <NuxtLink
                  :to="`/deployments/${deployment.id}`"
                  class="clickable-row-link clickable-row-cell-content"
                >
                  <span
                    v-if="deployment.updated_at"
                    :title="formatDate(deployment.updated_at)"
                    >{{ formatTimeAgo(deployment.updated_at) }}</span
                  >
                  <span v-else>-</span>
                </NuxtLink>
              </td>
              <td class="chev-cell">
                <span class="row-chev">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>

  <div v-if="showPagination" class="pagination-buttons mt-4">
    <button
      class="button"
      :class="{ 'is-disabled': !prevPage }"
      :disabled="!prevPage || loading"
      @click="refreshDeployments(prevPage)"
    >
      <span class="icon">
        <span>&#8249;</span>
      </span>
      <span>Previous</span>
    </button>
    <button
      class="button"
      :class="{ 'is-disabled': !nextPage }"
      :disabled="!nextPage || loading"
      @click="refreshDeployments(nextPage)"
    >
      <span>Next</span>
      <span class="icon">
        <span>&#8250;</span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import DeploymentStatusPill from "@/components/Deployment/DeploymentStatusPill.vue";
import VaultOverviewRows from "@/components/Vault/VaultOverviewRows.vue";

import { useWallet } from "@nosana/solana-vue";
import { useKit } from "~/composables/useKit";
import { DeploymentStatus } from "@nosana/kit";
import type { ApiDeploymentListResult } from "@nosana/api";
import { formatDate } from "~/utils/formatDate";
import { formatTimeAgo } from "~/utils/relativeTime";
import { truncateMiddle } from "~/utils/solana";
import {
  useDeploymentSelection,
  type ListedDeployment,
} from "~/composables/useDeploymentSelection";

const { isAuthenticated, isLoading } = useSuperTokens();
const { connected } = useWallet();

// Map market addresses to human-readable names (same source the create /
// detail pages use). Keyed by URL, so this is deduped across components.
const { data: testgridMarkets } = useAPI("/markets", { default: () => [] });
const marketLabel = (address?: string | null) => {
  if (!address) return "-";
  const match = testgridMarkets.value?.find(
    (m: any) => m.address === address,
  );
  return match?.name || truncateMiddle(address, 6, 6);
};

const isWalletMode = computed(() => {
  return connected.value && !isAuthenticated.value;
});

const columnCount = computed(() => (isWalletMode.value ? 8 : 7));

// Props
const props = withDefaults(
  defineProps<{
    itemsPerPage?: number;
    showPagination?: boolean;
  }>(),
  {
    itemsPerPage: 10,
    showPagination: true,
  },
);

// Emits
const emit = defineEmits<{
  "update:total-deployments": [count: number];
}>();

const deployments = ref<ListedDeployment[]>([]);

// Show the most recently updated deployments first.
const sortedDeployments = computed(() =>
  [...deployments.value].sort((a, b) => {
    const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return tb - ta;
  }),
);
const currentPage = ref(1);
const hasLoadedOnce = ref(false);
const router = useRouter();

const nextPage = ref<(() => Promise<ApiDeploymentListResult>) | null>(null);
const prevPage = ref<(() => Promise<ApiDeploymentListResult>) | null>(null);

// Navigate on plain row clicks, but let the browser handle the real <a> links
// for modifier/middle clicks so deployments can be opened in a new tab/window.
const openDeployment = (event: MouseEvent, id: string) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey) return;
  if ((event.target as Element)?.closest("a")) return;
  router.push(`/deployments/${id}`);
};

// Multi-select shared with the table toolbar, which renders the bulk Actions
// menu. Selection is scoped to the rows currently shown.
const {
  selectedIds,
  allSelected,
  bulkRunning,
  setListed,
  onAfterBulk,
  toggleOne,
  toggleAll,
} = useDeploymentSelection();

onAfterBulk(() => refreshDeployments());
onUnmounted(() => {
  setListed([]);
  onAfterBulk(null);
});

const { nosana } = useKit();
const loading = ref(false);
const deploymentsError = ref<string | null>(null);

const searchQuery = computed(
  () => router.currentRoute.value.query.search?.toString() || "",
);

const statusQuery = computed(
  () => router.currentRoute.value.query.filter?.toString() || "",
);

const marketQuery = computed(
  () => router.currentRoute.value.query.market?.toString() || "",
);

// Archived deployments stay out of the default list; they only show when the
// status filter explicitly asks for them. The list endpoint accepts a
// comma-separated status list, so ask for every status except ARCHIVED.
const UNARCHIVED_STATUSES = Object.values(DeploymentStatus)
  .filter((status) => status !== DeploymentStatus.ARCHIVED)
  .join(",");

const refreshDeployments = async (
  pageFunc?: (() => Promise<ApiDeploymentListResult>) | null,
) => {
  try {
    loading.value = true;

    let items;
    if (pageFunc) {
      items = await pageFunc();
    } else {
      items = await nosana.value.api.deployments.list({
        search: searchQuery.value || undefined,
        status: statusQuery.value || UNARCHIVED_STATUSES,
        // The list endpoint can't filter by market, so when one is selected we
        // pull a larger batch and filter client-side below.
        // @ts-ignore - API client types need to be updated to reflect new pagination params1
        limit: marketQuery.value ? 100 : props.itemsPerPage,
      });
    }

    deploymentsError.value = null;
    let list = items.deployments || [];
    if (marketQuery.value) {
      list = list.filter((d) => d.market === marketQuery.value);
    }
    deployments.value = list;
    // Server pagination can't account for the client-side market filter, so
    // hide it while a market is selected (the batch above covers realistic
    // per-user deployment counts).
    nextPage.value = marketQuery.value ? null : items.nextPage || null;
    prevPage.value = marketQuery.value ? null : items.previousPage || null;
  } catch (e: any) {
    deploymentsError.value = e?.message || "Failed to load deployments";
    deployments.value = [];
    nextPage.value = null;
    prevPage.value = null;
  } finally {
    setListed(deployments.value);
    loading.value = false;
    hasLoadedOnce.value = true;
  }
};

const debouncedRefresh = useDebounceFn(refreshDeployments, 500);

watch(
  () => [
    currentPage.value,
    props.itemsPerPage,
    searchQuery.value,
    statusQuery.value,
    marketQuery.value,
  ],
  () => {
    debouncedRefresh();
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.address {
  font-family: monospace;
  font-size: 0.9em;
}

.table td {
  vertical-align: middle;
}

/* Clean rows matching the site's redesigned tables (no zebra striping):
   subtle top separators + a soft hover, uppercase title-cased headers. */
.deployments-table {
  th {
    font-family: $title-family;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
    color: $grey;
  }

  tbody tr.clickable-row:hover {
    background: $white-bis;
  }

  /* Give the status pills a shared minimum width so they line up down the
     column instead of each hugging its label (Running / Completed / Error). */
  :deep(.dep-status-pill) {
    min-width: 90px;
  }
}

html.dark-mode .deployments-table tbody tr.clickable-row:hover {
  background: rgba($white, 0.03);
}

/* Selection column + custom checkboxes. The cell has no padding of its own so
   the label can fill it and give the checkbox a comfortable hit area. */
.deployments-table th.select-col,
.deployments-table td.select-cell {
  width: 1%;
  padding: 0;
  vertical-align: middle;
}

.sel-label {
  display: flex;
  align-items: center;
  padding: 0.5em 0.5em 0.5em 0.75em;
  cursor: pointer;
}

.sel-check {
  appearance: none;
  -webkit-appearance: none;
  flex: none;
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  margin: 0;
  border: 1.5px solid #cfd3d7;
  border-radius: 5px;
  background: $white;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    box-shadow 0.15s ease;

  &::after {
    content: "";
    width: 11px;
    height: 11px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2305230a' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E")
      center / contain no-repeat;
    opacity: 0;
    transform: scale(0.5);
    transition:
      opacity 0.12s ease,
      transform 0.12s ease;
  }

  &:hover:not(:disabled) {
    border-color: $secondary;
  }

  &:focus-visible {
    outline: none;
    border-color: $secondary;
    box-shadow: 0 0 0 3px rgba($secondary, 0.2);
  }

  &:checked,
  &:indeterminate {
    background: $secondary;
    border-color: $secondary;
  }

  &:checked::after,
  &:indeterminate::after {
    opacity: 1;
    transform: scale(1);
  }

  &:indeterminate::after {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2305230a' stroke-width='3.5' stroke-linecap='round'%3E%3Cpath d='M5 12h14'/%3E%3C/svg%3E");
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

html.dark-mode .sel-check {
  background: #242526;
  border-color: #4a4a4a;

  &:checked,
  &:indeterminate {
    background: $secondary;
    border-color: $secondary;
  }
}

.deployments-table tbody tr.clickable-row.is-selected {
  background: rgba($secondary, 0.07);

  &:hover {
    background: rgba($secondary, 0.11);
  }
}

html.dark-mode .deployments-table tbody tr.clickable-row.is-selected {
  background: rgba($secondary, 0.1);

  &:hover {
    background: rgba($secondary, 0.14);
  }
}

.pagination-previous.is-disabled,
.pagination-next.is-disabled {
  opacity: 0.5;
  pointer-events: none;
}

@media screen and (max-width: 768px) {
  .address {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: inline-block;
  }
}

.deployment-name {
  color: inherit;
  font-family: $title-family;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.deployment-id {
  font-size: 0.75rem;
  color: $grey;
  margin-top: 2px;
}

.updated-cell {
  color: $grey;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.market-name {
  color: inherit;
  white-space: nowrap;
}

/* Drill-in chevron, matching the job activity rows */
.chev-col {
  width: 1%;
}

.chev-cell {
  width: 1%;
  text-align: right;
}

.row-chev {
  display: inline-flex;
  color: $grey-light;
  transition: color 0.15s ease;

  svg {
    width: 16px;
    height: 16px;
  }
}

.clickable-row:hover .row-chev {
  color: $grey;
}

.min-height-container {
  min-height: 430px;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row-link {
  color: inherit;
  text-decoration: none;
}

.clickable-row-cell-content {
  display: block;
  width: 100%;
  height: 100%;
}

.pagination-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.pagination-buttons .button {
  min-width: 120px;
}

.pagination-buttons .button.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
