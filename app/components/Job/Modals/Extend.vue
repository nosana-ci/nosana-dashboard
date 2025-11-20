<template>
  <div class="modal is-active">
    <div class="modal-background" @click="closeExtendModal"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Extend Job</p>
        <button
          class="delete"
          aria-label="close"
          @click="closeExtendModal"
        ></button>
      </header>
      <section class="modal-card-body">
        <div class="field">
          <label class="label">Extension time (hours)</label>
          <div class="control">
            <input class="input" type="number" v-model="extendTime" min="0.1" step="0.1" />
          </div>
          <p v-if="isCreditUser" class="help mt-2">
            Cost: ${{ extensionCostUsd.toFixed(2) }}
          </p>
          <p v-else class="help mt-2">
            Cost: {{ extensionCost.toFixed(5) }} NOS
            <span v-if="nosPrice" class="has-text-grey"
              >(~${{ (extensionCost * nosPrice).toFixed(2) }})</span
            >
          </p>
          <p v-if="!hasEnoughBalance" class="help is-danger mt-2">
            <span v-if="isCreditUser">
              Insufficient credits. You need ${{ extensionCostUsd.toFixed(2) }}.
            </span>
            <span v-else>
              Insufficient NOS balance. You need
              {{ extensionCost.toFixed(2) }} NOS but have
              {{ userBalances.nos.toFixed(2) }} NOS.
            </span>
          </p>
        </div>
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success"
          @click="confirmExtend"
          :disabled="!hasEnoughBalance || loadingExtend"
          :class="{ 'is-loading': loadingExtend }"
        >
          Extend
        </button>
        <button class="button" @click="closeExtendModal">Cancel</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from "vue-toastification";
import type { UseJob } from "~/composables/jobs/useJob";

interface Props {
  job: UseJob;
  nosPrice: number;
  userBalances: { nos: number };
  closeExtendModal: () => void;
}

let { job, nosPrice, userBalances, closeExtendModal } = defineProps<Props>();

const toast = useToast();
const { status, data: userData } = useAuth();
const { triggerCreditRefresh } = useCreditRefresh();

const extendTime = ref<number>(1); // Default to 1 hour
const loadingExtend = ref<boolean>(false);

// Helper to detect if current user is a credit user
const isCreditUser = computed(() => {
  return status.value === 'authenticated' && userData.value?.generatedAddress;
});

// Use centralized pricing system for extension costs
const marketAddress = computed(() => job.market || null);
const { usdPricePerHour: extensionUsdRate } = useMarketUsdPrice(marketAddress);

// Calculate extension cost in NOS for wallet users
const extensionCost = computed(() => {
  if (!job.market || isCreditUser.value) return 0;
  
  // Use centralized pricing system only
  if (extensionUsdRate.value && nosPrice) {
    return (extensionUsdRate.value * extendTime.value) / nosPrice;
  }
  
  // If centralized pricing fails, return 0 to prevent extension
  return 0;
});

// Calculate extension cost in USD for credit users
const extensionCostUsd = computed(() => {
  if (!isCreditUser.value) return 0;
  
  // Use centralized pricing system
  if (extensionUsdRate.value) {
    return extensionUsdRate.value * extendTime.value;
  }
  
  return 0;
});

const hasEnoughBalance = computed(() => {
  if (isCreditUser.value) {
    // For credit users, we'll let the backend validate the balance
    return extendTime.value > 0 && extensionCostUsd.value > 0;
  } else {
    // For wallet users, check NOS balance
    return userBalances.nos >= extensionCost.value;
  }
});

async function confirmExtend() {
  if (!job.isRunning) {
    toast.error("Job can only be extended whilst in running state");
    return;
  }

  if (extendTime.value <= 0) {
    toast.error("Extension time must be greater than 0 hours");
    return;
  }

  loadingExtend.value = true;

  try {
    // Use the new extendJob method from useJob which handles both credit and wallet users
    await job.extendJob(extendTime.value);
    
    // Trigger credit refresh for credit users
    if (isCreditUser.value) {
      triggerCreditRefresh();
    }
    
    closeExtendModal();
  } catch (e) {
    console.error("Extend job error:", e);
    // Error handling is done in the extendJob method
  } finally {
    loadingExtend.value = false;
  }
}
</script>
<style lang="scss" scoped>
.modal.is-active {
  display: flex;
  z-index: 1001; /* Higher than profile dropdown z-index values */
}
.modal-card {
  max-width: 500px;
  width: 100%;
}
</style>
