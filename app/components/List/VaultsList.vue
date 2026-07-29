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
          <tr v-else-if="customVaults.length === 0">
            <td colspan="7" class="has-text-centered py-6">
              No custom vaults. Your main vault is managed from the
              <NuxtLink to="/account">Account</NuxtLink> page.
            </td>
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
const currentPage = ref(1);

// The shared (main) vault lives on the account page; this list is the
// advanced view showing only custom/legacy vaults.
const { ensureSharedVault, isSharedVaultAddress } = useSharedVault();

const customVaults = computed(() =>
  vaults.value.filter((vault) => !isSharedVaultAddress(vault.address)),
);

const filteredVaults = computed(() => {
  const searchQuery = router.currentRoute.value.query.search?.toString();
  if (!searchQuery) return customVaults.value;
  return customVaults.value.filter((vault) =>
    vault.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );
});

// Reset to first page when search changes
watch(
  () => router.currentRoute.value.query.search,
  () => {
    currentPage.value = 1;
  },
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
  await ensureSharedVault();
  const data = await nosana.value.api.deployments.vaults.list();
  vaults.value = data;
  loading.value = false;
});
</script>
