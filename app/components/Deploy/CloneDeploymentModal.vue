<template>
  <div class="modal" :class="{ 'is-active': showModal }">
    <div class="modal-background" @click="closeModal"></div>
    <div class="modal-card is-app-modal is-large">
      <header
        class="modal-card-head is-flex-direction-column is-align-items-stretch"
      >
        <div
          class="is-flex is-align-items-flex-start is-justify-content-space-between is-gap-3"
        >
          <div>
            <p class="eyebrow-label is-uppercase has-text-weight-semibold">
              Your deployments
            </p>
            <p class="modal-card-title title is-4 mb-0">
              Clone an existing deployment
            </p>
          </div>
          <button class="delete" aria-label="close" @click="closeModal"></button>
        </div>

        <!-- Same toolbar controls as the deployments list page -->
        <div
          class="is-flex is-align-items-center is-flex-wrap-wrap is-gap-2 mt-4"
        >
          <div class="th-search">
            <svg
              class="th-search-icon"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                stroke-width="2"
              />
              <path
                d="m20 20-3.5-3.5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            <input
              class="th-search-input"
              type="text"
              placeholder="Search deployments"
              v-model="search"
            />
          </div>

          <div class="is-flex-grow-1"></div>

          <div v-if="marketOptions.length > 1" class="th-select-control">
            <select v-model="marketFilter" class="th-select" aria-label="Market">
              <option :value="null">All markets</option>
              <option
                v-for="market in marketOptions"
                :key="market.value"
                :value="market.value"
              >
                {{ market.label }}
              </option>
            </select>
            <svg class="th-select-caret" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>

          <div class="th-select-control">
            <select v-model="statusFilter" class="th-select" aria-label="Status">
              <option
                v-for="option in statusOptions"
                :key="option.value === null ? 'null' : option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <svg class="th-select-caret" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>
      </header>

      <section class="modal-card-body">
        <div class="table-container">
          <table class="table is-fullwidth is-hoverable deployments-table">
            <thead>
              <tr>
                <th>Deployment</th>
                <th>Market</th>
                <th>Status</th>
                <th>Active Jobs</th>
                <th>Last Updated</th>
                <th class="chev-col"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!hasLoadedOnce">
                <td colspan="6" class="has-text-centered py-6">
                  Loading deployments...
                </td>
              </tr>
              <tr v-else-if="error">
                <td colspan="6" class="has-text-centered has-text-danger py-6">
                  Failed to load deployments: {{ error }}
                </td>
              </tr>
              <tr v-else-if="!deployments.length">
                <td colspan="6" class="has-text-centered py-6">
                  No deployments found
                </td>
              </tr>
              <tr
                v-else
                v-for="deployment in sortedDeployments"
                :key="deployment.id"
                class="clickable-row"
                @click="pick(deployment)"
              >
                <td>
                  <div class="deployment-name">{{ deployment.name }}</div>
                  <div
                    class="deployment-id is-family-monospace"
                    :title="deployment.id"
                  >
                    {{ truncateMiddle(deployment.id, 6, 6) }}
                  </div>
                </td>
                <td>
                  <span class="market-name" :title="deployment.market">{{
                    marketLabel(deployment.market)
                  }}</span>
                </td>
                <td>
                  <DeploymentStatusPill :status="deployment.status" />
                </td>
                <td :class="{ 'has-text-grey': !deployment.active_jobs }">
                  {{ deployment.active_jobs || 0 }}
                  {{ deployment.active_jobs === 1 ? "Job" : "Jobs" }}
                </td>
                <td class="updated-cell">
                  <span
                    v-if="deployment.updated_at"
                    :title="formatDate(deployment.updated_at)"
                    >{{ formatTimeAgo(deployment.updated_at) }}</span
                  >
                  <span v-else>-</span>
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
            </tbody>
          </table>
        </div>
      </section>

      <footer class="modal-card-foot">
        <p class="has-text-grey is-size-7 mb-0">
          The clone copies the job definition, GPU market, replicas, timeout and
          strategy into this form. Nothing is created until you deploy.
        </p>
        <div class="is-flex is-gap-2">
          <button
            class="button"
            :disabled="!prevPage || loading"
            @click="refresh(prevPage)"
          >
            Previous
          </button>
          <button
            class="button"
            :disabled="!nextPage || loading"
            @click="refresh(nextPage)"
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DeploymentStatus } from "@nosana/kit";
import type { ApiDeploymentListResult } from "@nosana/api";
import DeploymentStatusPill from "@/components/Deployment/DeploymentStatusPill.vue";
import { filters } from "~/components/DeploymentsTable/filters";
import type { ListedDeployment } from "~/composables/useDeploymentSelection";
import { formatDate } from "~/utils/formatDate";
import { formatTimeAgo } from "~/utils/relativeTime";
import { truncateMiddle } from "~/utils/solana";

const props = defineProps<{
  showModal: boolean;
}>();

const emit = defineEmits<{
  "update:showModal": [value: boolean];
  select: [deployment: ListedDeployment];
}>();

const { nosana } = useKit();

const search = ref("");
const statusFilter = ref<string | null>(null);
const marketFilter = ref<string | null>(null);

const statusOptions = filters.deployments || [];

const deployments = ref<ListedDeployment[]>([]);
const loading = ref(false);
const hasLoadedOnce = ref(false);
const error = ref<string | null>(null);
const nextPage = ref<(() => Promise<ApiDeploymentListResult>) | null>(null);
const prevPage = ref<(() => Promise<ApiDeploymentListResult>) | null>(null);

// Most recently updated first, same as the deployments list page.
const sortedDeployments = computed(() =>
  [...deployments.value].sort((a, b) => {
    const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    return tb - ta;
  }),
);

// Archived deployments only show when the status filter asks for them.
const UNARCHIVED_STATUSES = Object.values(DeploymentStatus)
  .filter((status) => status !== DeploymentStatus.ARCHIVED)
  .join(",");

const { data: testgridMarkets } = useAPI("/markets", { default: () => [] });

const marketLabel = (address?: string | null) => {
  if (!address) return "-";
  const match = testgridMarkets.value?.find((m: any) => m.address === address);
  return match?.name || truncateMiddle(address, 6, 6);
};

// The market dropdown only lists markets the user actually deploys in; the
// list endpoint can't filter by market, so it's collected from a wider batch.
const deploymentMarkets = ref<string[]>([]);

const loadDeploymentMarkets = async () => {
  try {
    const result = await nosana.value.api.deployments.list({ limit: 100 });
    const seen = new Set<string>();
    for (const deployment of result.deployments || []) {
      if (deployment.market) seen.add(deployment.market);
    }
    deploymentMarkets.value = [...seen];
  } catch {
    deploymentMarkets.value = [];
  }
};

const marketOptions = computed(() =>
  deploymentMarkets.value
    .map((address) => ({ label: marketLabel(address), value: address }))
    .sort((a, b) => a.label.localeCompare(b.label)),
);

const refresh = async (
  pageFunc?: (() => Promise<ApiDeploymentListResult>) | null,
) => {
  try {
    loading.value = true;

    const items = pageFunc
      ? await pageFunc()
      : await nosana.value.api.deployments.list({
          search: search.value || undefined,
          status: statusFilter.value || UNARCHIVED_STATUSES,
          // No server-side market filter, so pull a wider batch and filter below.
          // @ts-ignore - API client types don't cover the pagination params yet
          limit: marketFilter.value ? 100 : 10,
        });

    error.value = null;
    let list = items.deployments || [];
    if (marketFilter.value) {
      list = list.filter((d) => d.market === marketFilter.value);
    }
    deployments.value = list;
    // Server pagination can't account for the client-side market filter.
    nextPage.value = marketFilter.value ? null : items.nextPage || null;
    prevPage.value = marketFilter.value ? null : items.previousPage || null;
  } catch (e: any) {
    error.value = e?.message || "Failed to load deployments";
    deployments.value = [];
    nextPage.value = null;
    prevPage.value = null;
  } finally {
    loading.value = false;
    hasLoadedOnce.value = true;
  }
};

const debouncedRefresh = useDebounceFn(refresh, 500);

watch([search, statusFilter, marketFilter], () => {
  if (props.showModal) debouncedRefresh();
});

watch(
  () => props.showModal,
  (isOpen) => {
    if (!isOpen) return;
    refresh();
    loadDeploymentMarkets();
  },
);

const closeModal = () => emit("update:showModal", false);

const pick = (deployment: ListedDeployment) => {
  emit("select", deployment);
  closeModal();
};
</script>

<style scoped lang="scss">
/* Toolbar: same search + dropdown treatment as the deployments list header */
.th-search {
  position: relative;
  flex: 0 1 280px;
  min-width: 180px;
}

.th-search-icon {
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #9aa0a6;
  pointer-events: none;
}

.th-search-input {
  width: 100%;
  height: 40px;
  padding: 0 0.9rem 0 2.35rem;
  font-size: 0.875rem;
  color: #1a1c1e;
  background: #ffffff;
  border: 1px solid #e1e3e6;
  border-radius: 10px;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.th-search-input::placeholder {
  color: #9aa0a6;
}

.th-search-input:focus {
  border-color: $secondary;
  box-shadow: 0 0 0 3px rgba($secondary, 0.15);
}

.th-select-control {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 40px;
  background: #ffffff;
  border: 1px solid #e1e3e6;
  border-radius: 10px;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.th-select-control:focus-within {
  border-color: $secondary;
  box-shadow: 0 0 0 3px rgba($secondary, 0.15);
}

.th-select {
  appearance: none;
  -webkit-appearance: none;
  height: 100%;
  padding: 0 2.1rem 0 0.85rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1a1c1e;
  background: transparent;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  outline: none;
}

.th-select-caret {
  position: absolute;
  right: 0.7rem;
  width: 16px;
  height: 16px;
  color: #80868b;
  pointer-events: none;
}

.dark-mode .th-search-input,
.dark-mode .th-select-control {
  background: #242526;
  border-color: #3a3a3a;
}

.dark-mode .th-search-input {
  color: #eceef0;
}

.dark-mode .th-search-input::placeholder {
  color: #80868b;
}

.dark-mode .th-select {
  color: #eceef0;
}

.dark-mode .th-search-input:focus,
.dark-mode .th-select-control:focus-within {
  border-color: $secondary;
  box-shadow: 0 0 0 3px rgba($secondary, 0.2);
}

.dark-mode .th-search-icon,
.dark-mode .th-select-caret {
  color: #80868b;
}

/* Rows: same clean table as the deployments list */
.deployments-table {
  th {
    font-family: $title-family;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
    color: $grey;
  }

  td {
    vertical-align: middle;
  }

  tbody tr.clickable-row:hover {
    background: $white-bis;
  }

  :deep(.dep-status-pill) {
    min-width: 90px;
  }
}

html.dark-mode .deployments-table tbody tr.clickable-row:hover {
  background: rgba($white, 0.03);
}

.clickable-row {
  cursor: pointer;
}

.deployment-name {
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
  white-space: nowrap;
}

.chev-col,
.chev-cell {
  width: 1%;
}

.chev-cell {
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
</style>
