<template>
  <div>
    <div v-if="isAuthenticated" class="has-text-centered">
      <p
        class="heading mb-1"
        style="
          font-size: 0.7rem;
          text-transform: uppercase;
          font-weight: 600;
          color: #7a7a7a;
        "
      >
        Credit Balance
      </p>
      <p class="title is-4 mb-1" v-if="!loading">
        ${{ creditBalance.toFixed(2) }}
      </p>
      <p class="title is-4 mb-1" v-else>-</p>
      <p
        class="has-text-grey is-size-7 mb-2"
        v-if="!loading && reservedCredits > 0"
      >
        (${{ reservedCredits.toFixed(2) }} reserved in running/queued jobs)
      </p>
      <button
        class="button is-dark"
        @click="showClaimModal = true"
        :disabled="loading"
      >
        Claim Code
      </button>
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

const { isAuthenticated, isLoading } = useSuperTokens();
const { nosana } = useKit();

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
