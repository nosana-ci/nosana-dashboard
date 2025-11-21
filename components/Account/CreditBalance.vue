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
        <span>Claim Credit Code</span>
      </button>
    </div>
  </div>

  <!-- Credit Code Claim Modal -->
  <div class="modal" :class="{ 'is-active': showClaimModal }">
    <div class="modal-background" @click="closeClaimModal"></div>
    <div class="modal-content" style="max-width: 400px; width: 100%">
      <div class="box">
        <h3 class="title is-4 mb-4">Claim Credit Code</h3>
        <div class="field">
          <label class="label">Credit Code</label>
          <div class="control">
            <input
              class="input"
              type="text"
              placeholder="Enter your credit code"
              v-model="claimCode"
              :disabled="claiming"
            />
          </div>
        </div>
        <div class="field is-grouped">
          <div class="control">
            <button
              class="button is-dark"
              @click="claimCreditCode"
              :disabled="!claimCode.trim() || claiming"
              :class="{ 'is-loading': claiming }"
            >
              <span>Claim Credits</span>
            </button>
          </div>
          <div class="control">
            <button
              class="button"
              @click="closeClaimModal"
              :disabled="claiming"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useToast } from "vue-toastification";
import { trackEvent } from "~/utils/analytics";

const config = useRuntimeConfig().public;
const { token, data: userData } = useAuth();
const { nosana } = useSDK();
const toast = useToast();

// State
const creditBalance = ref(0);
const reservedCredits = ref(0);
const loading = ref(false);
const showClaimModal = ref(false);
const claimCode = ref("");
const claiming = ref(false);

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

// Claim credit code
const claimCreditCode = async () => {
  if (!claimCode.value.trim()) return;

  claiming.value = true;
  try {
    const response = await fetch(`${config.apiBase}/api/credits/claim`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: token.value as string,
      },
      body: JSON.stringify({
        code: claimCode.value.trim(),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      toast.success(`Successfully claimed $${data.amount} in credits!`);
      await fetchBalance(); // Refresh balance
      
      // Trigger global credit refresh for TopBar
      const { triggerCreditRefresh } = useCreditRefresh();
      triggerCreditRefresh();
      
      closeClaimModal();
      try {
        trackEvent('credit_claimed', {
          amount: data.amount,
          code: claimCode.value.trim(),
          user_id: userData.value?.generatedAddress,
        });
      } catch (error) {
        console.warn("Error tracking credit claimed:", error);
      }
    } else {
      const errorData = await response.json();
      toast.error(errorData.message || "Failed to claim credit code");
    }
  } catch (error) {
    console.error("Error claiming credit code:", error);
    toast.error("Error claiming credit code");
  } finally {
    claiming.value = false;
  }
};

const closeClaimModal = () => {
  showClaimModal.value = false;
  claimCode.value = "";
};

// Initialize
onMounted(() => {
  fetchBalance();
});

// Watch for token changes to refetch balance when user logs in/out
watch(token, (newToken, oldToken) => {
  // Only fetch if token actually changed (not just initial load)
  if (newToken !== oldToken) {
    fetchBalance();
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
