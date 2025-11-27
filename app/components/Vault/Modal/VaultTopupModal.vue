<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <div>
        <p class="modal-card-title">Top Up</p>
        <p>
          <small>{{ vaultKey }}</small>
        </p>
      </div>
    </header>
    <section class="modal-card-body">
      <div class="field">
        <label class="label">Amount of NOS to deposit</label>
        <div class="control">
          <input
            class="input"
            type="number"
            placeholder="NOS Amount"
            :value="vaultModal.state.value.nosAmount"
            @input="
              vaultModal.setNosAmount(
                Number(($event.target as HTMLInputElement).value)
              )
            "
          />
        </div>
      </div>
      <div class="field">
        <label class="label">Amount of SOL to deposit</label>
        <div class="control">
          <input
            class="input"
            type="number"
            placeholder="SOL Amount"
            :value="vaultModal.state.value.solAmount"
            @input="
              vaultModal.setSolAmount(
                Number(($event.target as HTMLInputElement).value)
              )
            "
          />
        </div>
      </div>
    </section>
    <footer
      class="modal-card-foot is-flex is-flex-direction-column is-align-items-flex-start"
    >
      <p v-if="vaultModal.state.value.error" class="has-text-danger mb-4">
        {{ vaultModal.state.value.error }}
      </p>
      <div class="buttons">
        <button
          class="button is-success"
          @click="vaultModal.topup"
          :disabled="vaultModal.state.value.loading"
        >
          {{ vaultModal.state.value.loading ? "Processing..." : "Top Up" }}
        </button>
        <button
          class="button"
          @click="vaultModal.close"
          :disabled="vaultModal.state.value.loading"
        >
          Cancel
        </button>
      </div>
    </footer>
  </div>
</template>
<script setup lang="ts">
import { useVaultModal } from "~/composables/useVaultModal";

const vaultModal = useVaultModal();

const vaultKey = computed(
  () => vaultModal.state.value.vault?.publicKey.toString() || ""
);
</script>
