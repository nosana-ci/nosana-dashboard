<template>
  <div>
    <label class="label">Vault Selection</label>
    <div class="control">
      <select
        class="input"
        @input="
          setSelectedVault(
            ($event.target as HTMLSelectElement).value || undefined
          )
        "
        style="width: 100%; padding: 0.5rem"
      >
        <option value="">Create a new vault</option>
        <option
          v-for="option in options"
          :key="option.vault"
          :value="option.vault"
        >
          {{ option.vault }} - NOS: {{ option.balance.NOS }} | SOL:
          {{ option.balance.SOL }}
        </option>

        <!-- Add options for vaults here -->
      </select>
    </div>
    <p class="is-size-7 mt-3">
      Choose a vault to manage funds for this deployment. If no vault is
      selected, a new vault will be created during deployment.
    </p>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useKit } from "~/composables/useKit";
import type { Vault } from "@nosana/kit";
import type { DeploymentsApi } from "@nosana/api";

const { setSelectedVault } = defineProps<{
  setSelectedVault: (vault: string | undefined) => void;
}>();

const { nosana } = useKit();

const isLoading = ref(true);
const options = ref<{ vault: string; balance: { NOS: number; SOL: number } }[]>(
  []
);

onMounted(async () => {
  try {
    const deploymentsApi = nosana.value.api.deployments as DeploymentsApi;
    const vaults = await deploymentsApi.vaults.list();

  await Promise.all(
    vaults.map(
        (vault: Vault) =>
          new Promise<void>(async (resolve) => {
            try {
              if (!vault.address || typeof vault.getBalance !== 'function') {
                resolve();
                return;
              }

              const balance = await vault.getBalance();
          options.value.push({
                vault: vault.address,
            balance: {
                  NOS: balance.NOS || 0,
                  SOL: balance.SOL || 0,
            },
          });
            } catch (error) {
              console.warn('Failed to get vault balance:', error);
            } finally {
              resolve();
            }
        })
    )
  );

    if (options.value.length === 1) {
      setSelectedVault(options.value[0]?.vault);
    }
  } catch (error) {
    console.error('Failed to load vaults:', error);
  } finally {
  isLoading.value = false;
  }
});
</script>
