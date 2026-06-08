<template>
  <div class="credit-balance-root">
    <div v-if="isAuthenticated" class="credit-balance-content">
      <div class="credit-balance-header">
        <div class="wallet-badge">
          <WalletIcon />
        </div>
        <div class="credit-balance-body">
          <div class="credit-balance-text">
            <p class="title is-6 mb-1 credit-balance-label">Credit balance</p>
            <p class="title is-3 mb-0 credit-balance-amount" v-if="!loading">
              ${{ creditBalance.toFixed(2) }}
            </p>
            <p class="title is-3 mb-0 credit-balance-amount" v-else>-</p>
            <p
              class="has-text-grey is-size-7 mt-2 mb-0 credit-balance-reserved"
              v-if="!loading && reservedCredits > 0"
            >
              (${{ reservedCredits.toFixed(2) }} reserved in running/queued jobs)
            </p>
          </div>
        </div>
      </div>
      <div class="buttons is-centered mt-5 mb-0">
        <button
          type="button"
          class="button is-primary"
          :class="{ 'is-loading': loading }"
          :disabled="loading"
          @click="openBuyCreditsModal"
        >
          Buy Credits
        </button>
        <button
          class="button is-primary is-outlined"
          @click="showClaimModal = true"
          :disabled="loading"
        >
          <span class="icon claim-tag-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </span>
          <span>Claim code</span>
        </button>
      </div>
    </div>

    <AccountClaimModal
      v-model="showClaimModal"
      type="manual"
      @claimed="fetchBalance"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import AccountClaimModal from "./ClaimModal.vue";
import WalletIcon from "@/assets/img/icons/wallet.svg?component";

const { isAuthenticated, isLoading } = useSuperTokens();
const { nosana } = useKit();
const { openBuyCreditsModal } = useBuyCreditsModal();
const { onCreditRefresh } = useCreditRefresh();

const creditBalance = ref(0);
const reservedCredits = ref(0);
const loading = ref(false);
const hasLoadedOnce = ref(false);
const showClaimModal = ref(false);

const fetchBalance = async () => {
  if (!isAuthenticated.value) {
    creditBalance.value = 0;
    reservedCredits.value = 0;
    return;
  }

  loading.value = true;
  try {
    const data = await nosana.value.api.credits.balance();
    hasLoadedOnce.value = true;
    creditBalance.value = data.assignedCredits
      ? data.assignedCredits - data.settledCredits - data.reservedCredits
      : 0;
    reservedCredits.value = data.reservedCredits || 0;
  } catch (error) {
    console.error("Error fetching credit balance:", error);
    creditBalance.value = 0;
    reservedCredits.value = 0;
  } finally {
    loading.value = false;
  }
};

onCreditRefresh(() => {
  if (isAuthenticated.value) {
    fetchBalance();
  }
});

onMounted(() => {
  if (isAuthenticated.value && !hasLoadedOnce.value) {
    fetchBalance();
  }
});

watch(
  [isAuthenticated, isLoading],
  ([newIsAuthenticated, newIsLoading], [oldIsAuthenticated]) => {
    if (newIsLoading) return;
    if (newIsAuthenticated && !hasLoadedOnce.value) {
      fetchBalance();
    }
    if (!newIsAuthenticated && oldIsAuthenticated) {
      creditBalance.value = 0;
      reservedCredits.value = 0;
      hasLoadedOnce.value = false;
    }
  },
  { immediate: false },
);

defineExpose({ fetchBalance });
</script>

<style scoped>
.credit-balance-root {
  width: fit-content;
  max-width: 100%;
}

.credit-balance-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.credit-balance-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.credit-balance-body {
  flex: 1;
}

.credit-balance-text {
  display: grid;
  justify-items: center;
}

.credit-balance-label {
  justify-self: start;
}

.wallet-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background-color: rgba(16, 232, 12, 0.12);
  color: #10e80c;
  flex-shrink: 0;
}

.wallet-badge :deep(svg) {
  width: 26px;
  height: 26px;
}

.claim-tag-icon {
  color: #10e80c;
}

.claim-tag-icon svg {
  width: 18px;
  height: 18px;
}
</style>
