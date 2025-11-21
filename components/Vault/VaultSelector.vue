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
        <option :value="undefined">Create a new vault</option>
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
import { useSDK } from "~/composables/useSDK";

const { setSelectedVault } = defineProps<{
  setSelectedVault: (vault: string | undefined) => void;
}>();

const { nosana } = useSDK();

const isLoading = ref(true);
const options = ref<{ vault: string; balance: { NOS: number; SOL: number } }[]>(
  []
);

onMounted(async () => {
  const vaults = await nosana.value.deployments.vaults.list();

  await Promise.all(
    vaults.map(
      ({ publicKey, getBalance }) =>
        new Promise(async (resolve) => {
          const balance = await getBalance();
          options.value.push({
            vault: publicKey.toString(),
            balance: {
              NOS: balance.NOS,
              SOL: balance.SOL,
            },
          });
          resolve(true);
        })
    )
  );

  if (options.value.length === 1) {
    setSelectedVault(options.value[0].vault);
  }

  isLoading.value = false;
});
</script>
