<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <div>
        <p class="modal-card-title">Withdraw</p>
        <p>
          <small>{{ vaultKey }}</small>
        </p>
      </div>
    </header>
    <section class="modal-card-body">
      <p>
        <i>
          Withdraw from the vault with transfer all funds from the vault back to
          the vaults owner. Please note that this action can cause deployments
          to fail due to insufficient funds.</i
        >
      </p>
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
          @click="vaultModal.withdraw"
          :disabled="vaultModal.state.value.loading"
        >
          {{ vaultModal.state.value.loading ? "Processing..." : "Withdraw" }}
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
