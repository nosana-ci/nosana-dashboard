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

    <!-- Reset Filters Link -->
    <div class="has-text-right mb-4">
      <a class="is-link" @click="resetFilters">
        <span class="icon is-small">
          <i class="fas fa-undo"></i>
        </span>
        <span>Reset Filters</span>
      </a>
    </div>

    <!-- Total Data Points -->
    <div class="has-text-right mb-2">
      <p>Total Data Points: {{ total }}</p>
    </div>

    <!-- Loading Bar -->
    <progress v-if="loading" class="progress is-small is-info my-0" max="100"></progress>

    <!-- Leaderboard Table -->
    <table v-else class="table is-fullwidth is-striped">
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
        <nuxt-link v-for="item in leaderboardData" 
                   :key="generateRowKey(item)" 
                   :to="`/address/${item.node}`" 
                   custom>
          <template #default="{ navigate }">
            <tr class="is-clickable remove-greyscale-on-hover" @click="navigate">
              <td>
                <nuxt-link :to="`/address/${item.node}`" class="is-family-monospace address has-text-black">
                  {{ item.node }}
                </nuxt-link>
              </td>
              <td>{{ item.gpu }}</td>
              <td>{{ item.framework }}</td>
              <td>{{ item.model }}</td>
              <td>{{ item.cuCount }}</td>
              <td>{{ item.metrics.averageTokensPerSecond }}</td>
              <td>{{ item.metrics.pricePerMillionTokens.toFixed(2) }}</td>
            </tr>
          </template>
        </nuxt-link>
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
import { ref, computed, onMounted } from 'vue';
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
  filterOptions.value ? filterOptions.value.cuCounts.sort((a: number, b: number) => a - b) : []
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
  type SortField = 'pricePerMillionTokens' | 'averageTokensPerSecond';
  const orderByMap: Record<SortField, string> = {
    pricePerMillionTokens: 'pricePerMillionTokens',
    averageTokensPerSecond: 'averageTokensPerSecond',
  };
  params.append('orderBy', orderByMap[sort.value.orderBy as SortField]);
  params.append('order', sort.value.order);

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
    sort.value.order = sort.value.order === 'asc' ? 'desc' : 'asc';
  } else {
    sort.value.orderBy = field;
    sort.value.order = 'asc';
  }
  page.value = 1;
}

// Generate a unique key for each row
function generateRowKey(item: any) {
  return `${item.node}-${item.cuCount}-${item.model}-${item.framework}-${item.gpu}`;
}

// Implement prevPage and nextPage functions
function prevPage() {
  page.value = page.value > 1 ? page.value - 1 : totalPages.value;
}

function nextPage() {
  page.value = page.value < totalPages.value ? page.value + 1 : 1;
}

// Ensure page value doesn't exceed totalPages
function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p;
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

// Function to reset filters
function resetFilters() {
  filters.value = { ...defaultFilters };
}
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
  display: flex;
  flex-direction: column;
}

.field:last-child {
  flex: none;
}

/* Add styles for the select container to ensure consistent height */
.select.is-fullwidth {
  height: 100%;
}

.select.is-fullwidth select {
  height: 2.5em;
}

/* Ensure input fields match select height */
.input {
  height: 2.5em;
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

/* Add these to your existing styles */
.is-clickable {
  cursor: pointer;
}

.remove-greyscale-on-hover:hover {
  filter: none;
}

.address {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

@include until-widescreen {
  .address {
    max-width: 70px;
  }
}
</style>
