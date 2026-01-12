<template>
  <div :class="{ 'min-height-container': loading }">
    <div class="table-container">
      <table class="table is-fullwidth is-striped is-hoverable">
        <thead>
          <tr>
            <th>Vaults</th>
            <th>SOL Balance</th>
            <th>NOS Balance</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="has-text-centered py-6">
              Loading vaults...
            </td>
          </tr>
          <tr v-else-if="vaults.length === 0">
            <td colspan="7" class="has-text-centered py-6">No vaults found.</td>
          </tr>
          <tr
            v-else
            v-for="vault in displayedVaults"
            :key="vault.address"
          >
            <VaultRow :vault="vault" />
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <Pagination
    v-if="totalPages > 1"
    v-model="currentPage"
    class="pagination is-centered mt-4"
    :total-page="totalPages"
    :max-page="6"
  />

  <VaultModal />
</template>
<script setup lang="ts">
import { type Vault } from "@nosana/kit";
import { useRouter } from "vue-router";
import VaultRow from "@/components/Vault/VaultRow.vue";
import VaultModal from "@/components/Vault/Modal/VaultModal.vue";
import Pagination from "@/components/Pagination.vue";

const props = defineProps<{
  itemsPerPage?: number;
}>();

const router = useRouter();
const { nosana } = useKit();

const loading = ref(true);
const vaults = ref<Vault[]>([]);
const filteredVaults = ref<Vault[]>([]);
const currentPage = ref(1);

watch(
  [() => router.currentRoute.value.query.search, vaults],
  ([searchQuery]) => {
    if (searchQuery) {
      filteredVaults.value = vaults.value.filter((vault) =>
        vault.address
          .toLowerCase()
          .includes(searchQuery.toString().toLowerCase())
      );
    } else {
      filteredVaults.value = vaults.value;
    }
    // Reset to first page when search changes
    currentPage.value = 1;
  }
);

// Pagination logic
const displayedVaults = computed(() => {
  const start = (currentPage.value - 1) * (props.itemsPerPage || 10);
  const end = start + (props.itemsPerPage || 10);
  return filteredVaults.value.slice(start, end);
});

const totalVaults = computed(() => filteredVaults.value.length);

const totalPages = computed(() =>
  Math.ceil(totalVaults.value / (props.itemsPerPage || 10))
);

onMounted(async () => {
  const data = await nosana.value.api.deployments.vaults.list();
  vaults.value = data;
  loading.value = false;
});
</script>
