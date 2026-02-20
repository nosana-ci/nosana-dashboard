<template>
  <div :class="{ 'min-height-container': !hasLoadedOnce && loading }">
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
          <tr v-if="!hasLoadedOnce && loading">
            <td :colspan="isWalletMode ? 5 : 4" class="has-text-centered py-6">
              Loading deployments...
            </td>
          </tr>
          <tr v-else-if="deploymentsError">
            <td colspan="4" class="has-text-centered has-text-danger">
              Failed to load deployments: {{ deploymentsError }}
            </td>
          </tr>
          <tr v-else-if="!deployments.length">
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
                v-if="true === true"
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

  <!-- <Pagination
    v-if="showPagination && totalPages > 1"
    v-model="currentPage"
    class="pagination is-centered mt-4"
    :total-page="totalPages"
    :max-page="6"
  />
  <div v-if="!showPagination && hasMore" class="has-text-right mt-2">
    <nuxt-link to="/deployments" class="button is-text">
      <span>See all</span>
      <span class="icon"> &#8250; </span>
    </nuxt-link>
  </div> -->
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

const { nosana } = useKit();
const loading = ref(false);
const deploymentsError = ref<string | null>(null);

const refreshDeployments = async () => {
  try {
    loading.value = true;

    const items = await nosana.value.api.deployments.list({
      // @ts-expect-error need to fix this type error as number should be ok
      limit: props.itemsPerPage,
    });

    deploymentsError.value = null;
    deployments.value = items.deployments || [];
  } catch (e: any) {
    deploymentsError.value = e?.message || "Failed to load deployments";
    deployments.value = [];
  } finally {
    loading.value = false;
    hasLoadedOnce.value = true;
  }
};

watch(
  () => [currentPage.value, props.itemsPerPage],
  () => {
    refreshDeployments();
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
