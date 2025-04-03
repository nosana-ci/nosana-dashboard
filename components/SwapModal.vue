<template>
  <div v-if="showModal" class="modal is-active">
    <div class="modal-background" @click="close"></div>
    <div class="modal-card" style="width: 360px; max-width: 90%;">
      <header class="modal-card-head">
        <p class="modal-card-title">Swap to <strong>NOS</strong></p>
        <button class="delete" aria-label="close" @click="close"></button>
      </header>

      <section class="modal-card-body">
        <div class="field mb-4">
          <p class="has-text-grey">NOS balance:</p>
          <p class="has-text-black">
            <b>{{ userBalances.nos.toFixed(2) }} NOS </b>
            <span class="has-text-grey">(${{ (userBalances.nos * nosPrice).toFixed(2) }})</span>
          </p>
        </div>

        <div class="field mb-4">
          <p class="has-text-grey">Amount to swap:</p>
          <div class="control">
            <div class="is-flex is-align-items-center">
              <input 
                class="input has-text-weight-bold"
                type="number"
                v-model.number="customSwapAmount"
                :placeholder="swapAmount.toFixed(3)"
                step="0.01"
                min="0"
              >
              <span class="icon is-medium ml-2" :style="{ background: $colorMode.value === 'dark' ? 'white' : 'black', borderRadius: '50%', padding: '8px', height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
                <img src="@/assets/img/token_icons/nosana-nos-logo.svg" alt="NOS" style="height: 24px; width: auto;" />
              </span>
            </div>
            <p class="help">
              <span class="has-text-grey">NOS required for the selected deployment: {{ totalNosNeeded.toFixed(2) }} NOS</span>
              <span class="has-text-grey ml-2">(${{ (totalNosNeeded * nosPrice).toFixed(2) }})</span>
            </p>
          </div>
        </div>

        <div class="field mb-4">
          <label class="label has-text-grey mb-2">Token to swap with:</label>
          <div class="control">
            <div class="dropdown w-100" :class="{ 'is-active': isDropdownOpen }">
              <div class="dropdown-trigger w-100">
                <button 
                  class="button w-100 has-background-white-ter is-borderless" 
                  aria-haspopup="true"
                  aria-controls="token-dropdown-menu"
                  @click="isDropdownOpen = !isDropdownOpen"
                >
                  <span class="icon is-small mr-2">
                    <img :src="selectedToken.icon" alt="" style="height: 20px; width: auto;" />
                  </span>
                  <span><strong>{{ selectedToken.label }}</strong></span>
                  <span class="has-text-grey ml-2">
                    {{ userBalances[selectedToken.balanceKey].toFixed(selectedToken.value === 'SOL' ? 4 : 2) }}
                  </span>
                  <span class="has-text-weight-bold ml-auto">
                    ${{ (userBalances[selectedToken.balanceKey] * getTokenPrice(selectedToken.value)).toFixed(2) }}
                  </span>
                  <span class="icon is-small ml-2">
                    <img
                      :src="isDropdownOpen ? ArrowUp : ArrowDown"
                      alt="arrow-icon"
                      style="height: 8px;"
                    />
                  </span>
                </button>
              </div>

              <div class="dropdown-menu w-100" id="token-dropdown-menu" role="menu">
                <div class="dropdown-content has-background-white-ter is-borderless">
                  <a
                    v-for="token in tokens"
                    :key="token.value"
                    class="dropdown-item is-flex is-align-items-center"
                    @click.prevent="selectToken(token)"
                  >
                    <span class="icon is-small mr-2">
                      <img :src="token.icon" alt="token-icon" style="height: 20px; width: auto;" />
                    </span>
                    <span><strong>{{ token.label }}</strong></span>
                    <span class="has-text-grey ml-2">
                      {{ userBalances[token.balanceKey].toFixed(token.value === 'SOL' ? 4 : 2) }}
                    </span>
                    <span class="has-text-weight-bold ml-auto">
                      ${{ (userBalances[token.balanceKey] * getTokenPrice(token.value)).toFixed(2) }}
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="field mb-4">
          <p>Would you like to swap 
            <b>{{ displaySourceTokenAmount.toFixed(selectedSwapSource === 'SOL' ? 5 : 3) }} {{ selectedSwapSource }}</b>
            <span class="has-text-grey"></span>
            for
            <b>{{ (customSwapAmount || swapAmount).toFixed(3) }} NOS</b>
            <span class="has-text-grey"></span>?
          </p>
        </div>

        <div class="buttons mt-4">
          <button
            class="button is-primary is-fullwidth"
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

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useToast } from "vue-toastification";
import { useSDK } from '~/composables/useSDK';
import { sleep } from '@nosana/sdk';
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
const { nosana } = useSDK();

// State
const swapAmount = ref(0);
const loadingSwap = ref(false);
const isDropdownOpen = ref(false);
const selectedSwapSource = ref<'SOL' | 'USDC' | 'USDT'>('SOL');
const customSwapAmount = ref(0);

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
}

// Source token amount calculation
const sourceTokenAmount = computed(() => {
  const usdNeeded = swapAmount.value * props.nosPrice;
  const tokenPrice = getTokenPrice(selectedSwapSource.value);
  return tokenPrice ? usdNeeded / tokenPrice : 0;
});

// Display amount calculation for UI
const displaySourceTokenAmount = computed(() => {
  const usdNeeded = Number(customSwapAmount.value.toFixed(3)) * props.nosPrice;
  const tokenPrice = getTokenPrice(selectedSwapSource.value);
  return tokenPrice ? usdNeeded / tokenPrice : 0;
});

// Swap execution
async function confirmSwap() {
  if (!nosana.value?.swap) {
    toast.error('Swap functionality not initialized. Please try again in a moment.');
    return;
  }

  // Use the user-entered customSwapAmount if set, else fallback 
  let amountToSwap = customSwapAmount.value || (props.totalNosNeeded - props.userBalances.nos);
  amountToSwap = amountToSwap < 0 ? 0 : amountToSwap;

  if (amountToSwap <= 0) {
    toast.info('Please enter an amount greater than 0');
    return;
  }

  loadingSwap.value = true;
  try {
    const txid = await nosana.value.swap.swapToNos(amountToSwap, selectedSwapSource.value);
    toast.success('Swap successfully completed');
    await sleep(.2);
    emit('refresh-balances');
    close();
  } catch (error: any) {
    toast.error(`Swap error: ${error}`);
  } finally {
    loadingSwap.value = false;
  }
}

// Calculate swap amount based on needed NOS and current balance
watch(
  () => [props.totalNosNeeded, props.userBalances.nos], 
  () => {
    swapAmount.value = Math.max(0, props.totalNosNeeded - props.userBalances.nos);
    customSwapAmount.value = Number(swapAmount.value.toFixed(3));
  }, 
  { immediate: true }
);
</script>

<style scoped>
.w-100 {
  width: 100%;
}

.is-borderless {
  border: none;
}
</style> 