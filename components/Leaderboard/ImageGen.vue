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

      <!-- Batch Size Filter -->
      <div class="field">
        <label class="label">Batch Size</label>
        <div class="control">
          <div class="select is-fullwidth" :class="{ 'is-loading': filtersLoading }">
            <select v-model="filters.batchSize" :disabled="filtersLoading">
              <option :value="null">All Batch Sizes</option>
              <option v-for="size in availableBatchSizes" :key="size" :value="size">
                {{ size }}
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

      <!-- Apply Filters Button -->
      <div class="field">
        <button class="button is-primary" @click="applyFilters" :disabled="filtersLoading">Apply Filters</button>
      </div>
    </div>

    <!-- Leaderboard Table -->
    <table class="table is-fullwidth is-striped">
      <thead>
        <tr>
          <th>Node</th>
          <th>GPU</th>
          <th>Framework</th>
          <th>Batch Size</th>
          <th class="is-sortable" @click="sortBy('imagesPerSecond')">
            Images/Sec
            <span v-if="sort.orderBy === 'imagesPerSecond'" class="icon is-small">
              <i class="fas" :class="sort.order === 'desc' ? 'fa-sort-down' : 'fa-sort-up'"></i>
            </span>
          </th>
          <!-- Add other sortable columns as needed -->
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in leaderboardData" :key="generateRowKey(item)">
          <td>{{ item.node }}</td>
          <td>{{ item.gpu }}</td>
          <td>{{ item.framework }}</td>
          <td>{{ item.batchSize }}</td>
          <td>{{ item.metrics.imagesPerSecond }}</td>
          <!-- Add other metrics as needed -->
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div class="mt-4">
      <Pagination :totalPage="totalPages" :maxPage="5" v-model="page" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Pagination from '@/components/Pagination.vue';
import { useAPI } from '@/composables/useAPI';
import { useIntervalFn } from '@vueuse/core';

// Filters and Sorting State
const defaultFilters = {
  node: '',
  batchSize: 1, // Set default batch size to 1
  framework: '',
  market: '',
};

const filters = ref({ ...defaultFilters });

const sort = ref({
  orderBy: 'imagesPerSecond',
  order: 'desc',
});

const page = ref(1);
const limit = ref(17);
const offset = computed(() => (page.value - 1) * limit.value);

// Reset filters to default when component is mounted
onMounted(() => {
  filters.value = { ...defaultFilters };
  applyFilters();
});

// Fetch filter options from the new API endpoint
const { data: filterOptions, pending: filtersLoading, error: filtersError } = await useAPI('/api/benchmarks/image-gen-filters');

const availableFrameworks = computed(() =>
  filterOptions.value ? filterOptions.value.frameworks.sort() : []
);

const availableBatchSizes = computed(() =>
  filterOptions.value ? filterOptions.value.batchSizes.sort((a, b) => a - b) : []
);

const availableGPUs = computed(() =>
  filterOptions.value ? filterOptions.value.gpus.sort() : []
);

// Construct API URL with filters and sorting
const leaderboardUrl = computed(() => {
  const params = new URLSearchParams();
  params.append('limit', limit.value.toString());
  params.append('offset', offset.value.toString());

  // Add filters if they are set and not empty
  if (filters.value.node) params.append('node', filters.value.node);
  if (filters.value.batchSize !== null) params.append('batchSize', filters.value.batchSize.toString());
  if (filters.value.framework) params.append('framework', filters.value.framework);
  if (filters.value.market) params.append('market', filters.value.market);

  // Add sorting parameters
  if (sort.value.orderBy) params.append('orderBy', sort.value.orderBy);
  if (sort.value.order) params.append('order', sort.value.order);

  return `/api/benchmarks/image-gen-leaderboard?${params.toString()}`;
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
const totalPages = computed(() => Math.ceil(total.value / limit.value));

// Implement sorting functionality
function sortBy(field: string) {
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

// Apply filters and reset to first page
function applyFilters() {
  page.value = 1;
  refreshLeaderboard();
}

// Generate a unique key for each row
function generateRowKey(item: any) {
  return `${item.node}-${item.batchSize}-${item.framework}-${item.gpu}`;
}

// Optionally, refresh data periodically
useIntervalFn(refreshLeaderboard, 30000); // Refresh every 30 seconds
</script>

<style scoped>
.mt-4 {
  margin-top: 1.5rem;
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

/* Make sure select boxes are same height as input */
.select,
.select select {
  width: 100%;
}

/* Only show pointer cursor on sortable columns */
th.is-sortable {
  cursor: pointer;
}

th.is-sortable:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* Remove hover effect from non-sortable columns */
th:not(.is-sortable):hover {
  background-color: inherit;
}

/* Loading style for select elements */
.is-loading select {
  background-image: url('/path/to/loading-spinner.svg');
  background-repeat: no-repeat;
  background-position: right 1em center;
}
</style> 