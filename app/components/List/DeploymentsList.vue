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
          <tr v-else-if="!displayedDeployments.length">
            <td :colspan="isWalletMode ? 5 : 4" class="has-text-centered">
              No deployments found
            </td>
          </tr>
          <template v-else>
            <tr
              v-for="deployment in displayedDeployments"
              :key="deployment.id"
              class="clickable-row"
            >
              <td>
                <NuxtLink
                  :to="deploymentLink(deployment.id)"
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
                  >{{
                    Array.isArray(deployment.jobs) 
                      ? deployment.jobs.filter(job => {
                          const state = (job as any).state;
                          // Active jobs: QUEUED (0), RUNNING (1) - exclude STOPPED (3)
                          // Can be string ('QUEUED', 'RUNNING') or number (0, 1)
                          if (typeof state === 'number') {
                            return state === 0 || state === 1;
                          }
                          if (typeof state === 'string') {
                            const stateUpper = state.toUpperCase();
                            return stateUpper === 'QUEUED' || stateUpper === 'RUNNING';
                          }
                          return false;
                        }).length 
                      : 0
                  }}
                  Jobs</span
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

  <Pagination
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
  </div>
</template>

<script setup lang="ts">
import StatusTag from "@/components/Common/StatusTag.vue";
import VaultOverviewRows from "@/components/Vault/VaultOverviewRows.vue";

import { useWallet } from "@nosana/solana-vue";
import { useKit } from "~/composables/useKit";
import type { Deployment } from "@nosana/kit";
import { formatDate } from "~/utils/formatDate";

// Props
const props = withDefaults(
  defineProps<{
    itemsPerPage?: number;
    limit?: number;
    showPagination?: boolean;
  }>(),
  {
    itemsPerPage: 10,
    limit: undefined,
    showPagination: true,
  }
);

// Emits
const emit = defineEmits<{
  "update:total-deployments": [count: number];
}>();

const deployments = ref<Deployment[]>([]);
const currentPage = ref(1);
const hasLoadedOnce = ref(false);
const { isAuthenticated, isLoading } = useSuperTokens();
const { connected } = useWallet();
const router = useRouter();
const route = useRoute();

const hasAnyAuth = computed(() => {
  return isAuthenticated.value || connected.value;
});

const isWalletMode = computed(() => {
  return connected.value && !isAuthenticated.value;
});

const { nosana } = useKit();
const loading = ref(false);
const deploymentsError = ref<string | null>(null);

const refreshDeployments = async () => {
  try {
    deploymentsError.value = null;
    loading.value = true;
    const items = await nosana.value.api.deployments.list();
    deployments.value = items || [];
  } catch (e: any) {
    deploymentsError.value = e?.message || "Failed to load deployments";
    deployments.value = [];
  } finally {
    loading.value = false;
    hasLoadedOnce.value = true;
  }
};

const currentState = computed(() =>
  router.currentRoute.value.query.filter?.toString()
);

// Computed properties
const filteredDeployments = computed(() => {
  let filtered = deployments.value;

  // Apply status filter
  if (currentState.value) {
    filtered = filtered.filter((d) => d.status === currentState.value);
  }

  // Apply search filter
  const searchQuery = router.currentRoute.value.query.search?.toString() as
    | string
    | undefined;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.id.toLowerCase().includes(query)
    );
  }

  return filtered;
});

// Create a computed property for the deployments actually displayed in the table
const displayedDeployments = computed(() => {
  // Compact mode: show only first N and hide pagination
  if (!props.showPagination) {
    const max = props.limit ?? props.itemsPerPage;
    return filteredDeployments.value.slice(0, max);
  }

  // Paginated mode
  const start = (currentPage.value - 1) * props.itemsPerPage;
  const end = start + props.itemsPerPage;
  return filteredDeployments.value.slice(start, end);
});

const totalDeployments = computed(() => filteredDeployments.value.length);

const totalPages = computed(() =>
  Math.ceil(totalDeployments.value / props.itemsPerPage)
);

// More indicator for compact mode
const hasMore = computed(() => {
  if (props.showPagination) return false;
  const max = props.limit ?? props.itemsPerPage;
  return filteredDeployments.value.length > max;
});

// Build nuxt-link target
const deploymentLink = (id: string) => {
  return `/deployments/${id}`;
};

// Watch for authentication changes
watch(
  [isAuthenticated, isLoading, connected],
  ([isAuth, isLoad, newConnected]) => {
    // Skip loading state (session refresh in progress)
    if (isLoad) return;
    
    const hasAuth = isAuth || newConnected;
    
    // Auto-redirect if unauthenticated
    if (!hasAuth && !isLoad) {
      router.push("/account");
      return;
    }

    // Only fetch if authenticated AND haven't loaded yet
    if (hasAuth && !hasLoadedOnce.value) {
      refreshDeployments();
    } else if (!hasAuth) {
      // Clear on logout
      deployments.value = [];
      hasLoadedOnce.value = false; // Reset so next login will fetch
    }
  },
  { immediate: true }
);

// Emit total deployments count
watch(
  totalDeployments,
  (count) => {
    emit("update:total-deployments", count);
  },
  { immediate: true }
);

// Add watcher for status filter changes
watch(
  () => currentState.value,
  () => {
    currentPage.value = 1;
  },
  { immediate: false }
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
