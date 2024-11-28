<template>
  <div>
    <div class="field">
      <div class="control">
        <div class="select">
          <select v-model="orderBy">
            <option value="averageTokensPerSecond">Tokens/Second</option>
            <option value="totalTokensProduced">Total Tokens</option>
            <option value="pricePerToken">Price/Token</option>
            <option value="pricePerHour">Price/Hour</option>
            <option value="avgUtilization">GPU Utilization</option>
            <option value="avgTemperature">Temperature</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="pending" class="has-text-centered py-6">
      <p>Loading leaderboard data...</p>
    </div>
    
    <div v-else-if="error" class="has-text-centered py-6">
      <p class="has-text-danger">{{ error }}</p>
      <button class="button mt-4" @click="refresh">Retry</button>
    </div>

    <template v-else>
      <table v-if="data?.length" class="table is-fullwidth">
        <thead>
          <tr>
            <th>Node</th>
            <th>GPU</th>
            <th>Model</th>
            <th>Framework</th>
            <th>Tokens/s</th>
            <th>Total Tokens</th>
            <th>Price/Token</th>
            <th>Price/Hour</th>
            <th>Utilization</th>
            <th>Temperature</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in data" :key="item.node">
            <td>{{ shortenAddress(item.node) }}</td>
            <td>{{ item.gpu }}</td>
            <td>{{ item.model }}</td>
            <td>{{ item.framework }}</td>
            <td>{{ formatNumber(item.metrics.averageTokensPerSecond) }}</td>
            <td>{{ formatNumber(item.metrics.totalTokensProduced) }}</td>
            <td>${{ formatNumber(item.metrics.pricePerToken, 6) }}</td>
            <td>${{ formatNumber(item.metrics.pricePerHour, 2) }}</td>
            <td>{{ formatNumber(item.metrics.avgUtilization) }}%</td>
            <td>{{ formatNumber(item.metrics.avgTemperature) }}°C</td>
          </tr>
        </tbody>
      </table>
      
      <div v-else class="has-text-centered py-6">
        <p>No benchmark data available</p>
      </div>
    </template>

    <div class="pagination is-centered" role="navigation" aria-label="pagination">
      <button 
        class="button pagination-previous" 
        :disabled="offset === 0"
        @click="previousPage"
      >
        Previous
      </button>
      <button 
        class="button pagination-next" 
        :disabled="!hasMorePages"
        @click="nextPage"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const orderBy = ref('averageTokensPerSecond');
const order = ref('desc');
const limit = ref(10);
const offset = ref(0);

const { data: response, refresh, pending, error } = await useFetch('/api/benchmarks/llm-leaderboard', {
  query: computed(() => ({
    orderBy: orderBy.value,
    order: order.value,
    limit: limit.value,
    offset: offset.value
  })),
  baseURL: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000',
  onResponseError(err) {
    console.error('API Error:', err);
  }
});

const data = computed(() => response.value?.data ?? []);
const pagination = computed(() => response.value?.pagination ?? { total: 0, limit: 10, offset: 0 });
const hasMorePages = computed(() => {
  return (pagination.value.offset + pagination.value.limit) < pagination.value.total;
});

function shortenAddress(address: string) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatNumber(num: number, decimals = 2) {
  if (num === undefined || num === null) return '-';
  return num.toLocaleString(undefined, { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  });
}

function previousPage() {
  offset.value = Math.max(0, offset.value - limit.value);
}

function nextPage() {
  if (hasMorePages.value) {
    offset.value += limit.value;
  }
}

watch(orderBy, () => {
  offset.value = 0;
  refresh();
});
</script> 