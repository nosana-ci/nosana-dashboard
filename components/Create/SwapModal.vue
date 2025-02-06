<template>
    <div class="modal" :class="{ 'is-active': showModal }">
      <div class="modal-background" @click="closeModal"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Swap Tokens for NOS</p>
          <button class="delete" aria-label="close" @click="closeModal"></button>
        </header>
        <section class="modal-card-body">
  
          <!-- Show user's current balances -->
          <div class="box">
            <h5 class="title is-6">Current Balances</h5>
            <p><strong>NOS:</strong> {{ balances.nos.toFixed(2) }}</p>
            <p><strong>SOL:</strong> {{ balances.sol.toFixed(4) }}</p>
            <p><strong>USDC:</strong> {{ balances.usdc.toFixed(4) }}</p>
            <p><strong>USDT:</strong> {{ balances.usdt.toFixed(4) }}</p>
          </div>
  
          <!-- Show how much NOS needed for this job -->
          <div class="box">
            <h5 class="title is-6">NOS Needed</h5>
            <p>You need: {{ nosNeeded.toFixed(2) }} NOS</p>
          </div>
  
          <!-- Dropdown to pick source token -->
          <div class="field">
            <label class="label">Source Token</label>
            <div class="control">
              <div class="select is-fullwidth">
                <select v-model="selectedSource">
                  <option value="SOL">SOL</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
            </div>
          </div>
  
          <!-- Display approximate fee breakdown -->
          <div v-if="simulatedFee !== null" class="box">
            <h5 class="title is-6">Estimated Fee</h5>
            <div>
              <p>~ {{ simulatedFee.toFixed(6) }} {{ selectedSource }}</p>
              <div v-if="simulatedFeeUsd !== null && !isNaN(simulatedFeeUsd)">
                <p>(≈ ${{ simulatedFeeUsd.toFixed(4) }})</p>
              </div>
            </div>
          </div>
  
          <!-- If user changes selection, show a button to re-check the quote -->
          <div class="buttons mt-4">
            <button
              class="button is-info"
              :class="{ 'is-loading': loadingQuote }"
              @click="getQuote"
            >
              Refresh Fee
            </button>
            <button
              class="button is-primary"
              :class="{ 'is-loading': loadingSwap }"
              @click="confirmSwap"
            >
              Swap Now
            </button>
          </div>
  
        </section>
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { ref, computed, onMounted } from 'vue';
  import { useToast } from 'vue-toastification';
  
  interface Balances {
    nos: number;
    sol: number;
    usdc: number;
    usdt: number;
  }
  
  const props = defineProps<{
    showModal: boolean;
    close: () => void;
    onSwapSuccess?: () => void;
    nosNeeded: number;
    balances: Balances;
    job: any; // Using any since we're passing the nosana.value instance
  }>();
  
  const toast = useToast();
  
  const showModal = computed({
    get: () => props.showModal,
    set: () => {}
  });
  
  function closeModal() {
    props.close();
  }
  
  // Track user selection
  const selectedSource = ref<'SOL' | 'USDC' | 'USDT'>('SOL');
  const loadingQuote = ref(false);
  const loadingSwap = ref(false);
  const simulatedFee = ref<number | null>(null);
  const simulatedFeeUsd = ref<number | null>(null);
  
  async function getQuote() {
    try {
      loadingQuote.value = true;
      const simulationResult = await props.job.swapToNos(
        props.nosNeeded,
        selectedSource.value,
        true // simulateOnly
      );
  
      // Extract the approximate fee
      // @ts-ignore
      simulatedFee.value = simulationResult.totalFee;
      
      // If you want to convert the token amount to USD, fetch the token price. 
      // For example, if it's SOL:
      if (selectedSource.value === 'SOL') {
        // fetch sol price, or rely on an existing function
        const result = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const json = await result.json();
        const solPrice = json?.solana?.usd ?? 0;
        simulatedFeeUsd.value = simulatedFee.value * solPrice;
      } else if (selectedSource.value === 'USDC' || selectedSource.value === 'USDT') {
        // USDC/USDT are pegged close to $1, but you could fetch if desired
        simulatedFeeUsd.value = simulatedFee.value * 1.0;
      }
    } catch (error: any) {
      toast.error(`Error getting fee quote: ${error}`);
      console.error(error);
    } finally {
      loadingQuote.value = false;
    }
  }
  
  async function confirmSwap() {
    try {
      loadingSwap.value = true;
      await props.job.swapToNos(props.nosNeeded, selectedSource.value, false);
      toast.success('Swap completed!');
      if (props.onSwapSuccess) props.onSwapSuccess();
      closeModal();
    } catch (error: any) {
      console.error(error);
      toast.error(`Swap error: ${error}`);
    } finally {
      loadingSwap.value = false;
    }
  }
  
  // Automatically get a quote on first mount
  onMounted(() => {
    getQuote();
  });
  </script>
  
  <style scoped>
  .modal-card {
    width: 600px;
    max-width: 90%;
  }
  </style>