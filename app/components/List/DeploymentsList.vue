<template>
  <div :class="{ 'min-height-container': !hasLoadedOnce }">
    <div class="table-container">
      <table class="table is-fullwidth is-hoverable deployments-table">
        <thead>
          <tr>
            <th>Deployment</th>
            <th>Status</th>
            <th>Active Jobs</th>
            <th v-if="isWalletMode">Vault</th>
            <th>Last Updated</th>
            <th class="chev-col"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!hasLoadedOnce">
            <td :colspan="isWalletMode ? 6 : 5" class="has-text-centered py-6">
              Loading deployments...
            </td>
          </tr>
          <tr v-else-if="hasLoadedOnce && deploymentsError">
            <td
              :colspan="isWalletMode ? 6 : 5"
              class="has-text-centered has-text-danger"
            >
              Failed to load deployments: {{ deploymentsError }}
            </td>
          </tr>
          <tr v-else-if="hasLoadedOnce && !deployments.length">
            <td :colspan="isWalletMode ? 6 : 5" class="has-text-centered">
              No deployments found
            </td>
          </tr>
          <template v-else>
            <tr
              v-for="deployment in deployments"
              :key="deployment.id"
              class="clickable-row"
              @click="openDeployment($event, deployment.id)"
            >
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
import type { ApiDeploymentListResult } from "@nosana/api";
import { formatDate } from "~/utils/formatDate";
import { formatTimeAgo } from "~/utils/relativeTime";
import { truncateMiddle } from "~/utils/solana";

const { isAuthenticated, isLoading } = useSuperTokens();
const { connected } = useWallet();

const isWalletMode = computed(() => {
  return connected.value && !isAuthenticated.value;
});

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

const deployments = ref<ApiDeploymentListResult["deployments"]>([]);
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

const { nosana } = useKit();
const loading = ref(false);
const deploymentsError = ref<string | null>(null);

const searchQuery = computed(
  () => router.currentRoute.value.query.search?.toString() || "",
);

const statusQuery = computed(
  () => router.currentRoute.value.query.filter?.toString() || "",
);

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
        status: statusQuery.value || undefined,
        // @ts-ignore - API client types need to be updated to reflect new pagination params1
        limit: props.itemsPerPage,
      });
    }

    deploymentsError.value = null;
    deployments.value = items.deployments || [];
    nextPage.value = items.nextPage || null;
    prevPage.value = items.previousPage || null;
  } catch (e: any) {
    deploymentsError.value = e?.message || "Failed to load deployments";
    deployments.value = [];
    nextPage.value = null;
    prevPage.value = null;
  } finally {
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
}

html.dark-mode .deployments-table tbody tr.clickable-row:hover {
  background: rgba($white, 0.03);
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
