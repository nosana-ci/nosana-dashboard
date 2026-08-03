<template>
  <div class="vault-balance-root">
    <div class="is-flex is-flex-direction-column is-align-items-center">
      <div class="is-flex is-align-items-flex-start">
        <div
          class="wallet-badge is-flex is-align-items-center is-justify-content-center is-flex-shrink-0 mr-4"
        >
          <WalletIcon />
        </div>
        <div class="is-flex-grow-1">
          <div class="is-flex is-flex-direction-column is-align-items-center">
            <p class="title is-6 mb-1 mt-2 is-align-self-flex-start">
              Vault balance
            </p>
            <p class="title is-3 mb-0" v-if="!loading && nosPrice">
              ${{ (balance.NOS * nosPrice).toFixed(2) }}
              <span class="has-text-grey is-size-6">
                {{ balance.NOS.toFixed(2) }} NOS
              </span>
            </p>
            <p class="title is-3 mb-0" v-else-if="!loading">
              {{ balance.NOS.toFixed(2) }} NOS
            </p>
            <p class="title is-3 mb-0" v-else>-</p>
            <p
              v-if="sharedVault"
              class="is-size-7 is-family-monospace has-text-grey mt-1"
              :title="sharedVault.address"
            >
              {{ sharedVault.address.slice(0, 6) }}...{{
                sharedVault.address.slice(-6)
              }}
            </p>
          </div>
        </div>
      </div>
      <p
        v-if="error"
        class="has-text-danger is-size-7 mt-2 mb-0"
        :title="error"
      >
        Could not load vault: {{ error }}
      </p>
      <p class="has-text-grey is-size-7 mt-2 mb-0" v-else-if="!loading">
        {{ balance.SOL.toFixed(4) }} SOL for network fees
      </p>
      <div class="buttons is-centered mt-5 mb-0">
        <button
          type="button"
          class="button is-primary"
          :class="{ 'is-loading': loading }"
          :disabled="loading || !sharedVault"
          @click="topup"
        >
          Top up
        </button>
        <button
          type="button"
          class="button is-primary is-outlined"
          :disabled="
            loading || !sharedVault || (balance.NOS === 0 && balance.SOL === 0)
          "
          @click="withdraw"
        >
          Withdraw
        </button>
      </div>
      <button
        type="button"
        class="button is-small is-ghost has-text-grey mt-2"
        @click="showVaultsModal = true"
      >
        Advanced
      </button>
    </div>

    <VaultsModal v-model="showVaultsModal" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import WalletIcon from "@/assets/img/icons/wallet.svg?component";
import VaultsModal from "~/components/Account/VaultsModal.vue";
import { useAPI } from "~/composables/useAPI";

const {
  balance,
  loading,
  error,
  sharedVault,
  walletAddress,
  ensureSharedVault,
  topup,
  withdraw,
} = useSharedVault();
const { nosana } = useKit();

const { data: stats } = useAPI("/stats");
const nosPrice = computed(() => stats.value?.price || 0);

const showVaultsModal = ref(false);

onMounted(() => {
  ensureSharedVault();
});

// The kit client reconfigures asynchronously after wallet connect/switch, so
// re-resolve whenever it (or the wallet address) changes. ensureSharedVault is
// idempotent and drops a stale vault on wallet switch.
watch([walletAddress, nosana], () => {
  ensureSharedVault();
});
</script>

<style scoped>
/* Bulma has no utility for these: an intrinsic-width root (so the card
   doesn't stretch to fill its parent) and the badge's brand color/size,
   which must match CreditBalance.vue's icon badge exactly. */
.vault-balance-root {
  width: fit-content;
  max-width: 100%;
}

.wallet-badge {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background-color: rgba(16, 232, 12, 0.12);
  color: #10e80c;
}

.wallet-badge :deep(svg) {
  width: 26px;
  height: 26px;
}
</style>
