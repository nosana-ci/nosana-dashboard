<template>
  <div v-if="token" class="box has-text-centered equal-height-box">
    <p class="heading">Credit Balance</p>
    <p class="title is-4 mb-1" v-if="!loading">
      ${{ creditBalance.toFixed(2) }}
    </p>
    <p class="title is-4 mb-1" v-else>-</p>
    <p class="has-text-grey is-size-7" v-if="!loading && reservedCredits > 0">
      (${{ reservedCredits.toFixed(2) }} reserved in running/queued jobs)
    </p>
    <div class="buttons is-centered mt-3">
      <button
        class="button is-dark"
        @click="showClaimModal = true"
        :disabled="loading"
      >
        <span>Claim Code</span>
      </button>
    </div>
  </div>

  <AccountClaimModal
    v-model="showClaimModal"
    type="manual"
    @claimed="fetchBalance"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import AccountClaimModal from "./ClaimModal.vue";

const config = useRuntimeConfig().public;
const { status, token } = useAuth();
const { nosana } = useKit();

// State
const creditBalance = ref(0);
const reservedCredits = ref(0);
const loading = ref(false);
const hasLoadedOnce = ref(false);
const showClaimModal = ref(false);

// Fetch credit balance
const fetchBalance = async () => {
  // Only fetch if user has auth token (credit system authentication)
  if (!token.value) {
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

// Initialize - only fetch if not already loaded
onMounted(() => {
  if (token.value && !hasLoadedOnce.value) {
    fetchBalance();
  }
});

// Watch for auth changes - only fetch if not already loaded
watch([() => status.value, token], ([newStatus, newToken]) => {
  // Only fetch if authenticated AND haven't loaded yet
  if (newToken && newStatus === 'authenticated' && !hasLoadedOnce.value) {
    fetchBalance();
  }
  // Reset on logout
  if (newStatus === 'unauthenticated') {
    creditBalance.value = 0;
    reservedCredits.value = 0;
    hasLoadedOnce.value = false;
  }
}, { immediate: false });

// Expose refresh function for parent components
defineExpose({
  fetchBalance,
});
</script>

<style scoped>
.heading {
  text-transform: uppercase;
  font-size: 0.8rem;
  font-weight: 600;
  color: #7a7a7a;
}

.equal-height-box {
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
