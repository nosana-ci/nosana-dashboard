<template>
  <div
    class="modal"
    :class="{ 'is-active': vaultModal.state.value.modalType !== null }"
  >
    <div class="modal-background" @click="vaultModal.close"></div>
    <VaultTopupModal v-if="vaultModal.state.value.modalType === 'topup'" />
    <VaultWithdrawModal
      v-if="vaultModal.state.value.modalType === 'withdraw'"
    />
  </div>
</template>
<script setup lang="ts">
import { useVaultModal } from "@/composables/useVaultModal";
import VaultTopupModal from "./VaultTopupModal.vue";
import VaultWithdrawModal from "./VaultWithdrawModal.vue";
const vaultModal = useVaultModal();
</script>
