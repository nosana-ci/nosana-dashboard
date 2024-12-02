<template>
  <div>
    <!-- Filters Section -->
    <div class="filters">
      <!-- Node Address Filter -->
      <div class="field">
        <label class="label">Node Address</label>
        <div class="control">
          <input class="input" v-model="filters.node" placeholder="Enter Node Address" />
        </div>
      </div>

      <!-- CU Filter -->
      <div class="field">
        <label class="label">Concurrent Users (CU)</label>
        <div class="control">
          <div class="select is-fullwidth" :class="{ 'is-loading': filtersLoading }">
            <select v-model="filters.cu" :disabled="filtersLoading">
              <option :value="null">All CUs</option>
              <option v-for="cu in availableCUs" :key="cu" :value="cu">
                {{ cu }} CU
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Model Filter -->
      <div class="field">
        <label class="label">Model</label>
        <div class="control">
          <div class="select is-fullwidth" :class="{ 'is-loading': filtersLoading }">
            <select v-model="filters.model" :disabled="filtersLoading">
              <option value="">All Models</option>
              <option v-for="model in availableModels" :key="model" :value="model">
                {{ model }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Framework Filter -->
      <div class="field">
        <label class="label">Framework</label>
        <div class="control">
          <div class="select is-fullwidth" :class="{ 'is-loading': filtersLoading }">
            <select v-model="filters.framework" :disabled="filtersLoading">
              <option value="">All Frameworks</option>
              <option v-for="framework in availableFrameworks" :key="framework" :value="framework">
                {{ framework }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- GPU Filter -->
      <div class="field">
        <label class="label">GPU (Market)</label>
        <div class="control">
          <div class="select is-fullwidth" :class="{ 'is-loading': filtersLoading }">
            <select v-model="filters.market" :disabled="filtersLoading">
              <option value="">All GPUs</option>
              <option v-for="gpu in availableGPUs" :key="gpu" :value="gpu">
                {{ gpu }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Total Data Points -->
    <div class="has-text-right mb-2">
      <p>Total Data Points: {{ total }}</p>
    </div>

    <!-- Leaderboard Table -->
    <table class="table is-fullwidth is-striped">
      <thead>
        <tr>
          <!-- Removed sorting functionality from these columns -->
          <th>Node</th>
          <th>GPU</th>
          <th>Framework</th>
          <th>Model</th>
          <th>Concurrent Users (CU)</th>
          <!-- Kept sorting functionality for these columns -->
          <th @click="sortBy('averageTokensPerSecond')" class="sortable">
            Avg Tokens/Sec
            <span v-html="renderSortIcon('averageTokensPerSecond')"></span>
          </th>
          <th @click="sortBy('pricePerMillionTokens')" class="sortable">
            Price per Million Tokens
            <span v-html="renderSortIcon('pricePerMillionTokens')"></span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in leaderboardData" :key="generateRowKey(item)">
          <td>{{ item.node }}</td>
          <td>{{ item.gpu }}</td>
          <td>{{ item.framework }}</td>
          <td>{{ item.model }}</td>
          <td>{{ item.cuCount }}</td>
          <td>{{ item.metrics.averageTokensPerSecond }}</td>
          <td>{{ item.metrics.pricePerMillionTokens.toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination with clickable page numbers -->
    <nav class="pagination is-centered mt-4" role="navigation" aria-label="pagination">
      <a class="pagination-previous" @click="prevPage">Previous</a>
      <a class="pagination-next" @click="nextPage">Next</a>
      <ul class="pagination-list">
        <!-- First page -->
        <li v-if="!pagesToShow.includes(1)">
          <a @click="goToPage(1)" class="pagination-link">1</a>
        </li>
        <li v-if="!pagesToShow.includes(1)">
          <span class="pagination-ellipsis">&hellip;</span>
        </li>
        <!-- Current pages -->
        <li v-for="p in pagesToShow" :key="p">
          <a @click="goToPage(p)" :class="{'pagination-link': true, 'is-current': p === page}">{{ p }}</a>
        </li>
        <!-- Last page -->
        <li v-if="!pagesToShow.includes(totalPages)">
          <span class="pagination-ellipsis">&hellip;</span>
        </li>
        <li v-if="!pagesToShow.includes(totalPages)">
          <a @click="goToPage(totalPages)" class="pagination-link">{{ totalPages }}</a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import Pagination from '@/components/Pagination.vue';
import { useAPI } from '@/composables/useAPI';
import { useIntervalFn } from '@vueuse/core';

// Filters and Sorting State
const defaultFilters = {
  node: '',
  cu: 100 as number | null,
  model: '',
  framework: '',
  market: '',
};

const filters = ref({ ...defaultFilters });

const sort = ref({
  orderBy: 'pricePerMillionTokens',
  order: 'asc',
});

const page = ref(1);
const limit = ref(17);
const offset = computed(() => (page.value - 1) * limit.value);

// Reset filters to default when component is mounted
onMounted(() => {
  filters.value = { ...defaultFilters };
});

// Fetch filter options from the new API endpoint
const { data: filterOptions, pending: filtersLoading, error: filtersError } = await useAPI('/api/benchmarks/llm-filters');

const availableModels = computed(() =>
  filterOptions.value ? filterOptions.value.models.sort() : []
);

const availableFrameworks = computed(() =>
  filterOptions.value ? filterOptions.value.frameworks.sort() : []
);

const availableGPUs = computed(() =>
  filterOptions.value ? filterOptions.value.gpus.sort() : []
);

const availableCUs = computed(() =>
  filterOptions.value ? filterOptions.value.cuCounts.sort((a, b) => a - b) : []
);

// Construct API URL with filters and sorting
const leaderboardUrl = computed(() => {
  const params = new URLSearchParams();
  params.append('limit', limit.value.toString());
  params.append('offset', offset.value.toString());

  // Add filters if they are set and not empty
  if (filters.value.node) params.append('node', filters.value.node);
  if (filters.value.cu !== null) params.append('cu', filters.value.cu.toString());
  if (filters.value.model) params.append('model', filters.value.model);
  if (filters.value.framework) params.append('framework', filters.value.framework);
  if (filters.value.market) params.append('market', filters.value.market);

  // Add sorting parameters
  if (sort.value.orderBy) params.append('orderBy', sort.value.orderBy);
  if (sort.value.order) params.append('order', sort.value.order);

  return `/api/benchmarks/llm-leaderboard?${params.toString()}`;
});

const {
  data: leaderboardResponse,
  pending: loading,
  error: leaderboardError,
  refresh: refreshLeaderboard,
} = await useAPI(leaderboardUrl, { watch: [leaderboardUrl] });

const leaderboardData = computed(() =>
  leaderboardResponse.value ? leaderboardResponse.value.data : []
);

const total = computed(() => (leaderboardResponse.value ? leaderboardResponse.value.total : 0));
const totalPages = computed(() => {
  const pages = Math.ceil(total.value / limit.value);
  return pages > 0 ? pages : 1;
});

// Implement sorting functionality
function sortBy(field: string) {
  if (field !== 'averageTokensPerSecond' && field !== 'pricePerMillionTokens') return;
  if (sort.value.orderBy === field) {
    // Toggle order between 'asc' and 'desc'
    sort.value.order = sort.value.order === 'asc' ? 'desc' : 'asc';
  } else {
    // Set new field to sort by
    sort.value.orderBy = field;
    sort.value.order = 'asc';
  }
  // Reset to first page when sorting changes
  page.value = 1;
  refreshLeaderboard();
}

// Generate a unique key for each row
function generateRowKey(item: any) {
  return `${item.node}-${item.cuCount}-${item.model}-${item.framework}-${item.gpu}`;
}

// Optionally, refresh data periodically
useIntervalFn(refreshLeaderboard, 30000); // Refresh every 30 seconds

// Apply filters automatically on change
watch([filters, page, sort], () => {
  refreshLeaderboard();
}, { deep: true });

// Implement prevPage and nextPage functions
function prevPage() {
  page.value = page.value > 1 ? page.value - 1 : totalPages.value;
  refreshLeaderboard();
}

function nextPage() {
  page.value = page.value < totalPages.value ? page.value + 1 : 1;
  refreshLeaderboard();
}

// Ensure page value doesn't exceed totalPages
function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p;
    refreshLeaderboard();
  }
}

// Function to render sort icons
function renderSortIcon(field: string) {
  if (sort.value.orderBy === field) {
    if (sort.value.order === 'asc') {
      return '&#9650;'; // Up arrow ▲
    } else {
      return '&#9660;'; // Down arrow ▼
    }
  } else {
    return '&#9650;&#9660;'; // Up and down arrows ▲▼
  }
}

// Pagination logic for clickable page numbers
const pagesToShow = computed(() => {
  const pages = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, page.value - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages.value, startPage + maxPagesToShow - 1);
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  return pages;
});
</script>

<style scoped>
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.field {
  flex: 1 1 200px;
}

/* Style for sorting icons */
th {
  cursor: pointer;
}
th span {
  margin-left: 5px;
  font-size: 0.8em;
}

/* Style for sortable columns */
th.sortable {
  cursor: pointer;
}
th.sortable span {
  margin-left: 5px;
  font-size: 0.8em;
}

/* Adjusted cursor style for non-sortable columns */
th {
  cursor: default;
}
</style>
