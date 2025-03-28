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
          <label class="label">Extension time (minutes)</label>
          <div class="control">
            <input class="input" type="number" v-model="extendTime" min="1" />
          </div>
          <p class="help mt-2">
            Cost: {{ extensionCost.toFixed(5) }} NOS
            <span v-if="nosPrice" class="has-text-grey"
              >(~${{ (extensionCost * nosPrice).toFixed(2) }})</span
            >
          </p>
          <p v-if="!hasEnoughBalance" class="help is-danger mt-2">
            Insufficient NOS balance. You need
            {{ extensionCost.toFixed(2) }} NOS but have
            {{ userBalances.nos.toFixed(2) }} NOS.
          </p>
        </div>
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-success"
          @click="confirmExtend"
          :disabled="!hasEnoughBalance"
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
const { nosana } = useSDK();

const extendTime = ref<number>(0);
const loadingExtend = ref<boolean>(false);

const extensionCost = computed(() => {
  if (!job.market) return 0;

  const basePrice = (job.price * extendTime.value * 60) / 1e6;
  const networkFee = basePrice * 0.1;
  return basePrice + networkFee;
});

const hasEnoughBalance = computed(
  () => userBalances.nos >= extensionCost.value
);

async function confirmExtend() {
  if (!hasEnoughBalance.value) {
    toast.error("Insufficient NOS balance for extension");
    return;
  }

  if (!job.isRunning) {
    toast.error("Job can only be extended whilst in running state");
    return;
  }

  loadingExtend.value = true;

  try {
    const result = await nosana.value.jobs.extend(
      job.address,
      extendTime.value * 60
    );
    toast.success(
      `Job has successfully been extended! Transaction ${result.tx}`
    );

    closeExtendModal();

    setTimeout(() => job.refresh(), 2000);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    const fullError = String(e);
    if (
      errorMessage.includes("TransactionExpiredTimeoutError") ||
      fullError.includes("Transaction was not confirmed in") ||
      fullError.includes("TimeoutError")
    ) {
      toast.error(
        "Solana is congested, try again or with a higher fee (Turbo/Ultra)"
      );
    } else if (
      errorMessage.includes("Unknown action") ||
      fullError.includes("Unknown action")
    ) {
      toast.error("Not enough NOS balance for the transaction");
    } else {
      toast.error(`Error extending job: ${errorMessage}`);
    }
    console.error("Extend job error:", e);
  } finally {
    loadingExtend.value = false;
  }
}
</script>
<style lang="scss" scoped>
.modal.is-active {
  display: flex;
}
.modal-card {
  max-width: 500px;
  width: 100%;
}
</style>
