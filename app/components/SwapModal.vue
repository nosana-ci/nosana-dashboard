<template>
  <div v-if="showModal" class="modal is-active">
    <div class="modal-background" @click="close"></div>
    <div class="modal-card" style="width: 440px; max-width: 90%;">
      <header class="modal-card-head">
        <p class="modal-card-title">Swap</p>
        <button class="delete" aria-label="close" @click="close"></button>
      </header>

      <section class="modal-card-body">
        <!-- Token to swap FROM (first) -->
        <div class="field mb-0">
          <div class="source-token-container p-4 rounded-top-lg">
            <!-- Header with label and balance info -->
            <div class="flex is-justify-content-space-between is-align-items-center mb-2">
              <span class="has-text-grey is-size-7">You pay</span>
              <div class="is-flex is-align-items-center">
                <div class="has-text-grey is-size-7 mr-2">Balance: {{ userBalances[selectedToken.balanceKey].toFixed(selectedToken.value === 'SOL' ? 4 : 2) }} {{ selectedToken.label }}</div>
                <div class="buttons are-small">
                  <button @click="setRequiredAmount" class="button is-small is-rounded px-2 py-1 has-text-grey is-size-7" v-if="requiredAmount > 0">REQUIRED</button>
                  <button @click="setHalfAmount" class="button is-small is-rounded px-2 py-1 has-text-grey is-size-7">HALF</button>
                  <button @click="setMaxAmount" class="button is-small is-rounded px-2 py-1 has-text-grey is-size-7">MAX</button>
                </div>
              </div>
            </div>
            
            <!-- Token selector and amount input in same row -->
            <div class="is-flex is-align-items-center">
              <div class="token-selector-container">
                <div class="dropdown w-100" :class="{ 'is-active': isDropdownOpen }">
                  <div class="dropdown-trigger">
                    <button 
                      class="button token-selector-button" 
                      aria-haspopup="true"
                      aria-controls="token-dropdown-menu"
                      @click="isDropdownOpen = !isDropdownOpen"
                    >
                      <div class="is-flex is-align-items-center">
                        <span class="token-icon-container mr-2">
                          <img :src="selectedToken.icon" alt="" style="height: 20px; width: 20px; object-fit: contain;" />
                        </span>
                        <span><strong>{{ selectedToken.label }}</strong></span>
                        <span class="icon is-small ml-2">
                          <img
                            :src="isDropdownOpen ? ArrowUp : ArrowDown"
                            alt="arrow-icon"
                            style="height: 8px;"
                          />
                        </span>
                      </div>
                    </button>
                  </div>

                  <div class="dropdown-menu w-100" id="token-dropdown-menu" role="menu">
                    <div class="dropdown-content">
                      <a
                        v-for="token in tokens"
                        :key="token.value"
                        class="dropdown-item is-flex is-align-items-center"
                        @click.prevent="selectToken(token)"
                      >
                        <span class="token-icon-container mr-2">
                          <img :src="token.icon" alt="token-icon" style="height: 20px; width: 20px; object-fit: contain;" />
                        </span>
                        <span><strong>{{ token.label }}</strong></span>
                        <span class="has-text-grey ml-2">
                          {{ userBalances[token.balanceKey].toFixed(token.value === 'SOL' ? 4 : 2) }}
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="amount-input-container">
                <input 
                  class="input has-text-weight-bold has-text-right token-input"
                  type="text"
                  v-model="sourceAmountFormatted"
                  placeholder="0.00"
                >
                <div class="has-text-right has-text-grey is-size-7 mt-1">
                  ${{ (sourceAmount * getTokenPrice(selectedSwapSource)).toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Divider line and arrow -->
        <div class="box-divider">
          <div class="arrow-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
          </div>
        </div>

        <!-- Token to swap TO (second) -->
        <div class="field mb-4">
          <div class="destination-token-container p-4 rounded-bottom-lg">
            <!-- Header with label and balance info -->
            <div class="flex is-justify-content-space-between is-align-items-center mb-2">
              <span class="has-text-grey is-size-7">You receive</span>
              <div class="is-flex is-align-items-center">
                <div class="has-text-grey is-size-7">Balance: {{ userBalances.nos.toFixed(4) }} NOS</div>
              </div>
            </div>
            
            <!-- Token display and amount input in same row -->
            <div class="is-flex is-align-items-center">
              <div class="token-selector-container">
                <div class="is-flex is-align-items-center token-display">
                  <span class="mr-2 nos-icon-container">
                    <img src="@/assets/img/token_icons/nosana-nos-logo.svg" alt="NOS" style="height: 20px; width: 20px; object-fit: contain;" />
                  </span>
                  <span class="has-text-weight-bold">NOS</span>
                </div>
              </div>

              <div class="amount-input-container">
                <input 
                  class="input has-text-weight-bold has-text-right token-input"
                  type="text"
                  v-model="nosAmountFormatted"
                  placeholder="0.00"
                >
                <div class="has-text-right has-text-grey is-size-7 mt-1">
                  ${{ (customSwapAmount * nosPrice).toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="buttons mt-4">
          <button
            class="button is-primary is-fullwidth"
            :class="{ 'is-loading': loadingSwap }"
            @click="confirmSwap"
            :disabled="!sourceAmount || !customSwapAmount"
          >
            Swap
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useToast } from "vue-toastification";
import { useKit } from '~/composables/useKit';
import { sleep } from '~/utils/sleep';
import SolIcon from '@/assets/img/token_icons/solana-sol-logo.svg?url';
import UsdcIcon from '@/assets/img/token_icons/usd-coin-usdc-logo.svg?url';
import UsdtIcon from '@/assets/img/token_icons/tether-usdt-logo.svg?url';
import ArrowDown from '@/assets/img/icons/arrow-down.svg?url';
import ArrowUp from '@/assets/img/icons/arrow-up.svg?url';

const props = defineProps({
  showModal: {
    type: Boolean,
    default: false
  },
  totalNosNeeded: {
    type: Number,
    required: true
  },
  nosPrice: {
    type: Number,
    required: true
  },
  solPrice: {
    type: Number,
    required: true
  },
  usdcPrice: {
    type: Number,
    required: true
  },
  usdtPrice: {
    type: Number,
    required: true
  },
  userBalances: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update:showModal', 'refresh-balances']);

const toast = useToast();
const { nosana } = useKit();

// State
const swapAmount = ref(0);
const sourceAmount = ref(0);
const loadingSwap = ref(false);
const isDropdownOpen = ref(false);
const selectedSwapSource = ref<'SOL' | 'USDC' | 'USDT'>('SOL');
const customSwapAmount = ref(0);

// Formatted values for display
const sourceAmountFormatted = computed({
  get: () => {
    return sourceAmount.value ? sourceAmount.value.toFixed(selectedSwapSource.value === 'SOL' ? 5 : 2) : '';
  },
  set: (value: string) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      sourceAmount.value = parsed;
    } else {
      sourceAmount.value = 0;
    }
  }
});

const nosAmountFormatted = computed({
  get: () => {
    return customSwapAmount.value ? customSwapAmount.value.toFixed(4) : '';
  },
  set: (value: string) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      customSwapAmount.value = parsed;
    } else {
      customSwapAmount.value = 0;
    }
  }
});

// Calculate the required amount of NOS needed (deficit)
const requiredAmount = computed(() => {
  // Base amount needed with 3% buffer
  return Math.max(0, props.totalNosNeeded - props.userBalances.nos) * 1.03;
});

// Token interface
interface Token {
  value: 'SOL' | 'USDC' | 'USDT';
  label: string;
  icon: string;
  balanceKey: 'sol' | 'usdc' | 'usdt';
}

// Available tokens
const tokens = ref<Token[]>([
  { value: 'SOL', label: 'SOL', icon: SolIcon, balanceKey: 'sol' },
  { value: 'USDC', label: 'USDC', icon: UsdcIcon, balanceKey: 'usdc' },
  { value: 'USDT', label: 'USDT', icon: UsdtIcon, balanceKey: 'usdt' }
]);

// Close the modal
const close = () => {
  emit('update:showModal', false);
};

// Helper to get token price
function getTokenPrice(token: 'SOL' | 'USDC' | 'USDT'): number {
  const prices = {
    SOL: props.solPrice,
    USDC: props.usdcPrice,
    USDT: props.usdtPrice
  };
  return prices[token] || 0;
}

// Selected token
const selectedToken = computed(() => tokens.value.find((t) => t.value === selectedSwapSource.value) || tokens.value[0]);

// Selection function
function selectToken(token: Token) {
  selectedSwapSource.value = token.value;
  isDropdownOpen.value = false;
  updateSourceAmount();
}

// Set required amount for the job
function setRequiredAmount() {
  // Use raw number without formatting to avoid conversion issues
  customSwapAmount.value = requiredAmount.value;
  updateSourceAmount();
}

// Set half of balance
function setHalfAmount() {
  const balance = props.userBalances[selectedToken.value.balanceKey];
  sourceAmount.value = balance / 2;
  updateDestinationAmount();
}

// Set max balance
function setMaxAmount() {
  sourceAmount.value = props.userBalances[selectedToken.value.balanceKey];
  updateDestinationAmount();
}

// Update source amount based on destination amount
function updateSourceAmount() {
  if (customSwapAmount.value) {
    const usdNeeded = customSwapAmount.value * props.nosPrice;
    const tokenPrice = getTokenPrice(selectedSwapSource.value);
    // Store the raw number without string conversion/parsing
    sourceAmount.value = tokenPrice ? (usdNeeded / tokenPrice) : 0;
  }
}

// Update destination amount based on source amount
function updateDestinationAmount() {
  if (sourceAmount.value) {
    const usdValue = sourceAmount.value * getTokenPrice(selectedSwapSource.value);
    // Store the raw number without string conversion/parsing
    customSwapAmount.value = props.nosPrice ? (usdValue / props.nosPrice) : 0;
  }
}

// Source token amount calculation
const displaySourceTokenAmount = computed(() => {
  return sourceAmount.value || 0;
});

// Swap execution
async function confirmSwap() {
  if (!nosana.value?.swap) {
    toast.error('Swap functionality not initialized. Please try again in a moment.');
    return;
  }

  // Swap expects source token amount (ExactIn)
  let amountToSwap = sourceAmount.value;
  amountToSwap = amountToSwap < 0 ? 0 : amountToSwap;
  
  // We don't need to add buffer here since it's already included in requiredAmount

  if (amountToSwap <= 0) {
    toast.info('Please enter an amount greater than 0');
    return;
  }

  loadingSwap.value = true;
  try {
    // TODO: Swap functionality not available in @nosana/kit - needs separate implementation
    // const txid = await nosana.value.swap.swapToNos(amountToSwap, selectedSwapSource.value);
    throw new Error('Swap functionality not yet implemented in new kit');
    toast.success('Swap successfully completed');
    await sleep(.2);
    emit('refresh-balances');
    close();
  } catch (error: any) {
    toast.error('Swap failed. Try increasing priority fee.');
    console.error('Swap error details:', error);
  } finally {
    loadingSwap.value = false;
  }
}

// Calculate swap amount based on needed NOS and current balance
watch(
  () => [props.totalNosNeeded, props.userBalances.nos], 
  () => {
    swapAmount.value = Math.max(0, props.totalNosNeeded - props.userBalances.nos);
    // Store raw value without formatting
    customSwapAmount.value = swapAmount.value;
    updateSourceAmount();
  }, 
  { immediate: true }
);

// Watch for changes in source amount to update destination
watch(
  () => [sourceAmount.value, selectedSwapSource.value],
  () => {
    updateDestinationAmount();
  }
);

// Watch for changes in destination amount to update source
watch(
  () => customSwapAmount.value,
  () => {
    updateSourceAmount();
  }
);

// Set the required amount when component mounts
onMounted(() => {
  if (props.showModal) {
    setRequiredAmount();
  }
});

// Watch for changes in the showModal prop
watch(
  () => props.showModal,
  (newValue) => {
    if (newValue === true) {
      // When modal opens, set the required amount
      setRequiredAmount();
    }
  },
  { immediate: false }
);
</script>

<style scoped>
.w-100 {
  width: 100%;
}

.source-token-container, .destination-token-container {
  background-color: #f5f5f5;
  position: relative;
}

.source-token-container {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: 1px solid #e0e0e0;
}

.destination-token-container {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  margin-top: 0;
}

.rounded-top-lg {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.rounded-bottom-lg {
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.box-divider {
  position: relative;
  height: 0;
}

.arrow-icon {
  background-color: white;
  border-radius: 50%;
  padding: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: absolute;
  top: -18px;
  height: 36px;
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.token-selector-container {
  width: 120px;
  min-width: 120px;
  margin-right: 12px;
}

.token-selector-button {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.5);
  padding: 0.375rem;
  height: auto;
  transition: all 0.2s ease;
}

.token-selector-button:hover {
  border-color: #ccc;
  background-color: rgba(255, 255, 255, 0.8);
}

.amount-input-container {
  flex-grow: 1;
  width: 100%;
}

.token-input {
  background-color: transparent;
  border: none;
  box-shadow: none;
  width: 100%;
  font-size: 1.2rem;
  padding: 0.5rem 0;
  -moz-appearance: textfield;
}

.token-input::-webkit-outer-spin-button,
.token-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.token-input:focus {
  box-shadow: none;
  border: none;
  outline: none;
}

.token-input:hover {
  background-color: transparent;
}

.token-display {
  padding: 0.375rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
}

.token-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  width: 26px;
  border-radius: 50%;
  overflow: hidden;
  background-color: white;
}

.nos-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  width: 26px;
}

.dropdown-menu {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-top: 4px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dropdown-content {
  border-radius: 8px;
  padding: 0;
  background-color: white;
}

.dropdown-item {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background-color: #f9f9f9;
}

.is-borderless {
  border: none;
}

.is-align-items-center {
  align-items: center;
}

.flex {
  display: flex;
}

.is-justify-content-space-between {
  justify-content: space-between;
}

.is-flex-grow-1 {
  flex-grow: 1;
}

/* Dark mode support */
.is-dark .source-token-container, .is-dark .destination-token-container {
  background-color: #333;
}

.is-dark .source-token-container {
  border-bottom-color: #555;
}

.is-dark .token-selector-button {
  border-color: #555;
  background-color: rgba(80, 80, 80, 0.3);
}

.is-dark .token-selector-button:hover {
  border-color: #777;
  background-color: rgba(100, 100, 100, 0.3);
}

.is-dark .token-icon-container {
  background-color: #444;
}

.is-dark .arrow-icon {
  background-color: #222;
}

.is-dark .dropdown-menu {
  border-color: #555;
}

.is-dark .dropdown-content {
  background-color: #333;
}

.is-dark .dropdown-item {
  border-bottom-color: #444;
}

.is-dark .dropdown-item:hover {
  background-color: #444;
}

.buttons.are-small .button {
  margin-bottom: 0;
  margin-right: 4px;
}

.flex-wrap {
  flex-wrap: wrap;
}
</style> 