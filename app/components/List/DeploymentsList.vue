<template>
  <div :class="{ 'min-height-container': !hasLoadedOnce }">
    <div class="table-container">
      <table class="table is-fullwidth is-striped is-hoverable">
        <thead>
          <tr>
            <th>Deployment</th>
            <th>Status</th>
            <th>Active Jobs</th>
            <th v-if="isWalletMode">Vault</th>
            <th>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!hasLoadedOnce">
            <td :colspan="isWalletMode ? 5 : 4" class="has-text-centered py-6">
              Loading deployments...
            </td>
          </tr>
          <tr v-else-if="hasLoadedOnce && deploymentsError">
            <td colspan="4" class="has-text-centered has-text-danger">
              Failed to load deployments: {{ deploymentsError }}
            </td>
          </tr>
          <tr v-else-if="hasLoadedOnce && !deployments.length">
            <td :colspan="isWalletMode ? 5 : 4" class="has-text-centered">
              No deployments found
            </td>
          </tr>
          <template v-else>
            <tr
              v-for="deployment in deployments"
              :key="deployment.id"
              class="clickable-row"
            >
              <td>
                <NuxtLink
                  :to="`/deployments/${deployment.id}`"
                  class="clickable-row-link"
                >
                  <div class="clickable-row-cell-content">
                    <div class="deployment-name">
                      {{ deployment.name }}
                    </div>
                    <div class="is-size-7 is-family-monospace has-text-grey">
                      {{ deployment.id }}
                    </div>
                  </div>
                </NuxtLink>
              </td>
              <td>
                <div class="clickable-row-cell-content">
                  <StatusTag
                    :status="deployment.status"
                    :outlined="true"
                    :show-label="true"
                  />
                </div>
              </td>
              <td>
                <span class="clickable-row-cell-content"
                  >{{ deployment.active_jobs || 0 }} Jobs</span
                >
              </td>
              <VaultOverviewRows
                v-if="isWalletMode === true"
                :isTableRow="false"
                :deployment="deployment"
              />
              <td>
                <span class="clickable-row-cell-content">
                  <span v-if="deployment.updated_at">{{
                    formatDate(deployment.updated_at)
                  }}</span>
                  <span v-else>-</span>
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
import StatusTag from "@/components/Common/StatusTag.vue";
import VaultOverviewRows from "@/components/Vault/VaultOverviewRows.vue";

import { useWallet } from "@nosana/solana-vue";
import { useKit } from "~/composables/useKit";
import type { ApiDeploymentListResult } from "@nosana/api";
import { formatDate } from "~/utils/formatDate";

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

<style scoped>
.address {
  font-family: monospace;
  font-size: 0.9em;
}

.table td {
  vertical-align: middle;
}

.tag {
  min-width: 80px;
  justify-content: center;
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
  font-weight: 500;
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

/* Fix for option key type error */
select option {
  value: any;
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

/* Match deployment detail page responsive tab styling */
@media screen and (max-width: 768px) {
  .tab-button {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
  }
}

@media screen and (max-width: 480px) {
  .deployment-tabs {
    gap: 0.25rem;
  }

  .tab-button {
    font-size: 0.75rem;
    padding: 0.375rem 0.5rem;
  }
}
</style>
