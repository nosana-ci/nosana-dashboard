<template>
  <div class="modal" :class="{ 'is-active': modelValue }">
    <div class="modal-background" @click="close"></div>
    <div class="modal-card" style="width: min(1100px, 95vw)">
      <header class="modal-card-head">
        <p class="modal-card-title">Your vaults</p>
        <button class="delete" aria-label="close" @click="close"></button>
      </header>
      <section class="modal-card-body">
        <p v-if="loading" class="has-text-grey">Loading vaults...</p>
        <p v-else-if="allVaults.length === 0" class="has-text-grey">
          No vaults found.
        </p>
        <div v-else class="table-container">
          <table class="table is-fullwidth is-striped is-hoverable">
            <thead>
              <tr>
                <th>Vault</th>
                <th>SOL Balance</th>
                <th>NOS Balance</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="vault in allVaults" :key="vault.address">
                <VaultRow :vault="vault" />
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Vault } from "@nosana/kit";
import { computed, ref, watch } from "vue";
import VaultRow from "~/components/Vault/VaultRow.vue";
import {
  getVaultBalance,
  updateVaultBalance,
} from "~/composables/useDeploymentVault";

const modelValue = defineModel<boolean>({ default: false });

const { nosana } = useKit();
const { isSharedVaultAddress, walletAddress } = useSharedVault();
const vaultModal = useVaultModal();

// Row actions (top up / withdraw) open the funding modal, which would render
// behind this one (same z-index, earlier DOM position). Hand over the screen
// while it's open and come back to the list afterwards.
const reopenAfterAction = ref(false);

watch(
  () => vaultModal.state.value.modalType,
  (type, prev) => {
    if (type && modelValue.value) {
      reopenAfterAction.value = true;
      modelValue.value = false;
    } else if (!type && prev && reopenAfterAction.value) {
      reopenAfterAction.value = false;
      modelValue.value = true;
    }
  },
);

const vaults = ref<Vault[]>([]);
const loading = ref(false);

// Every vault the user owns, except the API-key doc (address === owner).
// Sorted: shared (main) vault first, then funded vaults, then empty ones.
const allVaults = computed(() =>
  vaults.value
    .filter((vault) => vault.address && vault.address !== walletAddress.value)
    .slice()
    .sort((a, b) => {
      const rank = (v: Vault) => {
        if (isSharedVaultAddress(v.address)) return 0;
        const balance = getVaultBalance(v);
        return balance.NOS > 0 || balance.SOL > 0 ? 1 : 2;
      };
      return rank(a) - rank(b);
    }),
);

const close = () => {
  modelValue.value = false;
};

// Fetch fresh on every open.
watch(modelValue, async (open) => {
  if (!open) return;
  loading.value = true;
  try {
    const deployments = nosana.value?.api?.deployments;
    if (!deployments || !("vaults" in deployments)) return;

    const list = await deployments.vaults.list();
    vaults.value = list;

    // Seed the shared balance store so rows and sorting react.
    await Promise.all(list.map((vault) => updateVaultBalance(vault)));
  } catch (error) {
    console.error("Error loading vaults:", error);
  } finally {
    loading.value = false;
  }
});
</script>
