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
            v-for="vault in filteredVaults"
            :key="vault.publicKey.toString()"
          >
            <VaultRow :vault="vault" />
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <VaultModal />
</template>
<script setup lang="ts">
import { type Vault } from "@nosana/sdk";
import { useRouter } from "vue-router";
import VaultRow from "@/components/Vault/VaultRow.vue";
import VaultModal from "@/components/Vault/Modal/VaultModal.vue";

const router = useRouter();
const { nosana } = useSDK();

const loading = ref(true);
const vaults = ref<Vault[]>([]);
const filteredVaults = ref<Vault[]>([]);

watch(
  [() => router.currentRoute.value.query.search, vaults],
  ([searchQuery]) => {
    if (searchQuery) {
      filteredVaults.value = vaults.value.filter((vault) =>
        vault.publicKey
          .toString()
          .toLowerCase()
          .includes(searchQuery.toString().toLowerCase())
      );
    } else {
      filteredVaults.value = vaults.value;
    }
  }
);

onMounted(async () => {
  const data = await nosana.value.deployments.vaults.list();
  vaults.value = data;
  loading.value = false;
});
</script>
