<template>
  <div class="modal buy-credits-modal" :class="{ 'is-active': modelValue }">
    <div class="modal-background" @click="closeModal"></div>
    <div class="modal-content buy-credits-modal-content" style="max-width: 480px; width: 100%">
      <div class="box p-6 buy-credits-modal-box" style="border-radius: 16px">
        <!-- Success state -->
        <template v-if="purchasedSuccessfully">
          <h3 class="title is-4 mb-2 has-text-centered">Credits Added!</h3>
          <p class="subtitle is-6 has-text-grey has-text-centered mb-5">
            <strong class="has-text-success">{{ purchasedLabel }}</strong>
            {{ purchasedSublabel }}
          </p>
          <button
            class="button is-dark is-fullwidth is-medium"
            style="border-radius: 8px"
            @click="closeModal"
          >
            Done
          </button>
        </template>

        <!-- Purchase form -->
        <template v-else>
          <h3 class="title is-4 mb-1">Buy Credits</h3>
          <p class="subtitle is-6 has-text-grey mb-3">
            Credits are used to run AI workloads on the Nosana network.
          </p>

          <!-- Tab switcher -->
          <div class="tabs mb-5">
            <ul>
              <li :class="{ 'is-active': activeTab === 'card' }">
                <a @click="activeTab = 'card'">Credit Card</a>
              </li>
              <li :class="{ 'is-active': activeTab === 'crypto' }">
                <a @click="activeTab = 'crypto'">Crypto</a>
              </li>
            </ul>
          </div>

          <!-- Card tab -->
          <template v-if="activeTab === 'card'">

          <!-- Amount selection -->
          <div class="mb-5">
            <label class="label is-small">Amount</label>
            <div class="buttons mb-2">
              <button
                v-for="preset in PRESET_AMOUNTS"
                :key="preset"
                class="button is-small"
                :class="{ 'is-dark': selectedAmount === preset && !isCustom }"
                @click="selectPreset(preset)"
              >
                ${{ preset }}
              </button>
              <button
                class="button is-small"
                :class="{ 'is-dark': isCustom }"
                @click="enableCustom"
              >
                Custom
              </button>
            </div>
            <div v-if="isCustom" class="field">
              <div class="control has-icons-left">
                <input
                  class="input"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Amount in USD"
                  v-model.number="customAmount"
                  style="border-radius: 8px"
                />
                <span class="icon is-left has-text-grey">$</span>
              </div>
            </div>
          </div>

          <!-- Payment method -->
          <div class="mb-5 payment-method-section">
            <label class="label is-small">Payment Method</label>
            <div v-if="loadingMethods && !savedMethods.length" class="has-text-grey is-size-7">
              Loading saved cards...
            </div>
            <div v-else-if="!savedMethods.length" class="notification is-light p-4 mb-0">
              <p class="is-size-7 mb-2">No payment method on file.</p>
              <nuxt-link
                to="/account/billing"
                class="is-size-7 has-text-dark"
                @click="closeModal"
              >
                Add a card on the Billing page &rarr;
              </nuxt-link>
            </div>
            <div
              v-else
              ref="methodPickerRef"
              class="dropdown is-fullwidth"
              :class="{ 'is-active': methodMenuOpen }"
            >
              <div class="dropdown-trigger">
                <button
                  type="button"
                  class="button is-fullwidth is-justify-content-space-between"
                  :disabled="savedMethods.length <= 1"
                  :aria-expanded="methodMenuOpen"
                  aria-haspopup="listbox"
                  @click="toggleMethodMenu"
                >
                  <span class="is-flex is-align-items-center">
                    <AccountCardBrandIcon
                      :brand="selectedMethod?.brand ?? null"
                      class="mr-2"
                    />
                    <span class="is-family-monospace">
                      {{ formatMethodLabel(selectedMethod) }}
                    </span>
                  </span>
                  <span v-if="savedMethods.length > 1" class="icon is-small">
                    <i class="fas fa-angle-down"></i>
                  </span>
                </button>
              </div>
              <div
                v-if="savedMethods.length > 1"
                class="dropdown-menu"
                role="listbox"
              >
                <div class="dropdown-content">
                  <a
                    v-for="method in savedMethods"
                    :key="method.id"
                    class="dropdown-item is-flex is-align-items-center"
                    :class="{ 'is-active': method.id === selectedMethodId }"
                    role="option"
                    :aria-selected="method.id === selectedMethodId"
                    @click="selectMethod(method.id)"
                  >
                    <AccountCardBrandIcon :brand="method.brand" class="mr-2" />
                    <span class="is-family-monospace">
                      {{ formatMethodLabel(method) }}
                    </span>
                  </a>
                </div>
              </div>
            </div>
            <p v-if="savedMethods.length" class="is-size-7 mt-2 mb-0">
              <nuxt-link to="/account/billing" class="has-text-grey" @click="closeModal">
                Manage cards
              </nuxt-link>
            </p>
          </div>

          <button
            class="button is-dark is-fullwidth is-medium"
            :disabled="!canSubmit || purchasing"
            :class="{ 'is-loading': purchasing }"
            @click="handlePurchase"
          >
            Pay ${{ effectiveAmount }}
          </button>
          <p v-if="purchaseError" class="help is-danger has-text-centered mt-2">
            {{ purchaseError }}
          </p>

          </template><!-- end card tab -->

          <!-- Crypto tab -->
          <template v-else-if="activeTab === 'crypto'">
            <!-- Connect wallet prompt -->
            <template v-if="!walletConnected">
              <p class="is-size-7 has-text-grey mb-3">
                Connect your Solana wallet to pay with USDC or NOS.
              </p>
              <button
                class="button is-dark is-fullwidth is-medium"
                @click="walletModalOpen = true"
              >
                Connect Wallet
              </button>
              <SolanaWalletModal v-model="walletModalOpen" />
            </template>

            <template v-else>
              <!-- Connected wallet info -->
              <div class="notification is-light p-3 mb-4">
                <div class="is-flex is-align-items-center is-justify-content-space-between">
                  <div>
                    <div class="is-flex is-align-items-center mb-1" style="gap: 0.5rem">
                      <span class="tag is-success is-rounded is-small" style="width: 8px; height: 8px; padding: 0; min-width: 8px;"></span>
                      <span class="has-text-weight-medium is-size-7">{{ walletName }}</span>
                    </div>
                    <p class="is-family-monospace is-size-7 has-text-grey">{{ truncatedWalletAddress }}</p>
                  </div>
                  <button class="button is-small is-light" @click="disconnectWallet">
                    Disconnect
                  </button>
                </div>
              </div>

              <!-- Token picker -->
              <div class="mb-4">
                <label class="label is-small">Token</label>
                <div class="buttons">
                  <button
                    class="button is-small"
                    :class="{ 'is-dark': cryptoToken === 'USDC' }"
                    @click="cryptoToken = 'USDC'"
                  >
                    USDC
                  </button>
                  <button
                    class="button is-small"
                    :class="{ 'is-dark': cryptoToken === 'NOS' }"
                    @click="cryptoToken = 'NOS'"
                  >
                    NOS
                  </button>
                </div>
              </div>

              <!-- Amount -->
              <div class="mb-4">
                <label class="label is-small is-flex is-justify-content-space-between">
                  <span>Amount <span class="has-text-grey">({{ cryptoToken }})</span></span>
                  <span class="has-text-grey has-text-weight-normal">
                    <template v-if="loadingBalance">Loading...</template>
                    <template v-else-if="selectedTokenBalance !== null">
                      Balance: {{ selectedTokenBalance.toLocaleString(undefined, { maximumFractionDigits: 4 }) }} {{ cryptoToken }}
                    </template>
                  </span>
                </label>
                <div class="control">
                  <input
                    class="input"
                    type="number"
                    min="0.000001"
                    step="any"
                    :placeholder="`Amount in ${cryptoToken}`"
                    v-model.number="cryptoAmount"
                  />
                </div>
                <p v-if="cryptoToken === 'USDC'" class="help has-text-grey">
                  1 USDC = $1 USD in credits
                </p>
                <p v-if="cryptoToken === 'NOS' && cryptoAmount && cryptoAmount > 0 && nosPrice" class="help has-text-grey">
                  ≈ ${{ (cryptoAmount * nosPrice).toFixed(2) }} in credits
                </p>
              </div>

              <!-- Destination info -->
              <p v-if="cryptoAmount && cryptoAmount > 0" class="is-size-7 has-text-grey mb-4">
                Sending to your account address:
                <span class="is-family-monospace has-text-dark">{{ truncatedGeneratedAddress }}</span>
              </p>

              <button
                class="button is-dark is-fullwidth is-medium"
                :disabled="!cryptoCanSubmit || cryptoPurchasing"
                :class="{ 'is-loading': cryptoPurchasing }"
                @click="handleCryptoPurchase"
              >
                Send {{ cryptoAmount || '' }} {{ cryptoToken }}
              </button>
              <p v-if="cryptoError" class="help is-danger has-text-centered mt-2">
                {{ cryptoError }}
              </p>
            </template>
          </template><!-- end crypto tab -->

        </template>

        <div class="mt-4" v-if="!purchasing && !cryptoPurchasing && !purchasedSuccessfully">
          <a
            @click="closeModal"
            class="has-text-grey-light is-size-7 is-clickable is-block has-text-centered"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
    <button class="modal-close is-large" aria-label="close" @click="closeModal"></button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import { useToast } from "vue-toastification";
import { SolanaWalletModal, useWallet, useSolanaWallets } from "@nosana/solana-vue";
import { createTokenService, Logger } from "@nosana/kit";
import type { Address } from "@nosana/kit";
import type { SavedPaymentMethod } from "~/composables/usePaymentMethods";
import type { CryptoTopupToken } from "~/composables/useCryptoTopup";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(["update:modelValue", "purchased"]);

const config = useRuntimeConfig().public;
const toast = useToast();
const { triggerCreditRefresh } = useCreditRefresh();
const {
  methods: savedMethods,
  loading: loadingMethods,
  fetchPaymentMethods,
} = usePaymentMethods();
const { connected: walletConnected, account: walletAccount, disconnect } = useWallet();

const disconnectWallet = async () => {
  try {
    await disconnect();
  } catch {
    // ignore
  }
};
const { wallets } = useSolanaWallets();
const { nosana, wallet } = useKit();

const walletName = computed(() => {
  if (!walletAccount.value) return null;
  const found = wallets.value?.find((w: any) =>
    w.accounts?.some((acc: any) => acc.address === walletAccount.value?.address),
  );
  return found?.name ?? "Connected Wallet";
});

const truncatedWalletAddress = computed(() => {
  const addr = walletAccount.value?.address;
  if (!addr) return "";
  return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
});

const tokenBalances = ref({ NOS: null as number | null, USDC: null as number | null });
const loadingBalance = ref(false);

const fetchTokenBalance = async (token: CryptoTopupToken) => {
  if (!walletConnected.value || !nosana.value || !wallet.value) return;
  loadingBalance.value = true;
  nosana.value.wallet = wallet.value;
  try {
    if (token === "NOS") {
      const info = await nosana.value.nos.getBalanceInfo();
      tokenBalances.value.NOS = info.uiAmount ?? 0;
    } else {
      const USDC_MINT = config.network === "devnet"
        ? "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
        : "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
      const usdcService = createTokenService(
        { logger: Logger.getInstance(), solana: nosana.value.solana, getWallet: () => wallet.value ?? undefined },
        { tokenAddress: USDC_MINT as Address },
      );
      const info = await usdcService.getBalanceInfo();
      tokenBalances.value.USDC = info.uiAmount ?? 0;
    }
  } catch {
    // balance stays null
  } finally {
    loadingBalance.value = false;
  }
};

const selectedTokenBalance = computed(() => tokenBalances.value[cryptoToken.value]);

const walletModalOpen = ref(false);
const { topup: cryptoTopup } = useCryptoTopup();
const { userData } = useSuperTokens();
const { data: stats } = useAPI("/api/stats");
const nosPrice = computed(() => stats.value?.price || 0);

const activeTab = ref<"card" | "crypto">("card");

const cryptoToken = ref<CryptoTopupToken>("USDC");
const cryptoAmount = ref<number | null>(null);
const cryptoPurchasing = ref(false);
const cryptoError = ref("");
const cryptoPurchasedToken = ref<CryptoTopupToken | null>(null);

const truncatedGeneratedAddress = computed(() => {
  const addr = userData.value?.generatedAddress;
  if (!addr) return "";
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
});

const cryptoCanSubmit = computed(
  () => !!(cryptoAmount.value && cryptoAmount.value > 0),
);

const purchasedLabel = computed(() => {
  if (cryptoPurchasedToken.value === "NOS") return `${purchasedAmount.value} NOS`;
  return `$${purchasedAmount.value.toFixed(2)}`;
});

const purchasedSublabel = computed(() => {
  if (cryptoPurchasedToken.value === "NOS")
    return "sent — credits will be added to your account shortly.";
  return "in credits have been added to your account.";
});

const PRESET_AMOUNTS = [10, 25, 50, 100] as const;

const selectedAmount = ref<number>(25);
const isCustom = ref(false);
const customAmount = ref<number | null>(null);

const effectiveAmount = computed(() => {
  if (isCustom.value) return customAmount.value ?? 0;
  return selectedAmount.value;
});
const selectedMethodId = ref<string | null>(null);
const methodMenuOpen = ref(false);
const methodPickerRef = ref<HTMLElement | null>(null);

let stripe: Stripe | null = null;

const purchasing = ref(false);
const purchasedSuccessfully = ref(false);
const purchasedAmount = ref(0);
const purchaseError = ref("");
const justOpened = ref(false);

const selectDefaultMethod = () => {
  const defaultMethod = savedMethods.value.find((method) => method.isDefault);
  selectedMethodId.value = defaultMethod?.id ?? savedMethods.value[0]?.id ?? null;
};

const selectedMethod = computed(() =>
  savedMethods.value.find((method) => method.id === selectedMethodId.value) ?? null,
);

const toggleMethodMenu = () => {
  if (savedMethods.value.length <= 1) return;
  methodMenuOpen.value = !methodMenuOpen.value;
};

const selectMethod = (id: string) => {
  selectedMethodId.value = id;
  methodMenuOpen.value = false;
};

onClickOutside(methodPickerRef, () => {
  methodMenuOpen.value = false;
});

watch([walletConnected, cryptoToken], ([connected]) => {
  if (connected) fetchTokenBalance(cryptoToken.value);
  else tokenBalances.value = { NOS: null, USDC: null };
}, { immediate: true });

watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      justOpened.value = true;
      methodMenuOpen.value = false;
      nextTick(() => {
        justOpened.value = false;
      });
      if (!savedMethods.value.length) {
        await fetchPaymentMethods();
      }
      selectDefaultMethod();
    }
  },
);

const canSubmit = computed(() => {
  const amount = effectiveAmount.value;
  return !!(amount && amount >= 1 && selectedMethodId.value);
});

const selectPreset = (amount: number) => {
  isCustom.value = false;
  selectedAmount.value = amount;
  customAmount.value = null;
};

const enableCustom = () => {
  isCustom.value = true;
  customAmount.value = null;
};

const closeModal = () => {
  if (purchasing.value || cryptoPurchasing.value || justOpened.value) return;
  emit("update:modelValue", false);
  setTimeout(() => {
    purchasedSuccessfully.value = false;
    purchaseError.value = "";
    isCustom.value = false;
    customAmount.value = null;
    selectedAmount.value = 25;
    selectedMethodId.value = null;
    methodMenuOpen.value = false;
    cryptoAmount.value = null;
    cryptoError.value = "";
    cryptoToken.value = "USDC";
    cryptoPurchasedToken.value = null;
    activeTab.value = "card";
  }, 300);
};

const handleCryptoPurchase = async () => {
  if (!cryptoCanSubmit.value || !cryptoAmount.value) return;
  cryptoPurchasing.value = true;
  cryptoError.value = "";
  try {
    await cryptoTopup(cryptoToken.value, cryptoAmount.value);
    cryptoPurchasedToken.value = cryptoToken.value;
    purchasedAmount.value = cryptoAmount.value;
    purchasedSuccessfully.value = true;
    triggerCreditRefresh();
    emit("purchased", cryptoAmount.value);
    toast.success(`${cryptoAmount.value} ${cryptoToken.value} sent — credits are being added to your account.`);
  } catch (err: unknown) {
    type FetchError = { data?: { message?: string }; message?: string };
    const e = err as FetchError;
    cryptoError.value = e?.data?.message ?? e?.message ?? "Transaction failed. Please try again.";
  } finally {
    cryptoPurchasing.value = false;
  }
};

const handlePurchase = async () => {
  if (!canSubmit.value || !selectedMethodId.value) return;
  purchasing.value = true;
  purchaseError.value = "";
  try {
    const intentData = await $fetch<{ clientSecret: string | null; paymentIntentId: string }>(
      `${config.apiBase}/api/payments/payment-intent`,
      {
        method: "POST",
        credentials: "include",
        body: {
          amountUsd: effectiveAmount.value,
          paymentMethodId: selectedMethodId.value,
        },
      },
    );

    if (intentData.clientSecret) {
      if (!stripe && config.stripe_publishable_key) {
        stripe = await loadStripe(config.stripe_publishable_key as string);
      }
      if (!stripe) throw new Error("Stripe could not be initialised");

      const result = await stripe.confirmCardPayment(intentData.clientSecret);
      if (result.error) {
        purchaseError.value = result.error.message ?? "Payment failed";
        return;
      }

      const status = result.paymentIntent?.status;
      if (status === "processing") {
        purchaseError.value =
          "Payment is processing. Your balance will update shortly.";
        triggerCreditRefresh();
        return;
      }
      if (status && status !== "succeeded") {
        purchaseError.value = "Payment could not be completed. Please try again.";
        return;
      }
    }

    purchasedAmount.value = effectiveAmount.value;
    purchasedSuccessfully.value = true;
    triggerCreditRefresh();
    emit("purchased", effectiveAmount.value);
    toast.success(`$${effectiveAmount.value} in credits added to your account!`);
  } catch (err: unknown) {
    type FetchError = { data?: { message?: string }; message?: string };
    const e = err as FetchError;
    purchaseError.value =
      e?.data?.message ?? e?.message ?? "Payment failed. Please try again.";
    if (purchaseError.value.includes("cannot be used for purchases")) {
      await fetchPaymentMethods();
      selectDefaultMethod();
    }
  } finally {
    purchasing.value = false;
  }
};

const formatMethodLabel = (method: SavedPaymentMethod | null) =>
  method ? `•••• ${method.last4 ?? "????"}` : "Select a card";
</script>

<style scoped>
.buy-credits-modal.is-active,
.buy-credits-modal-content,
.buy-credits-modal-box,
.payment-method-section {
  overflow: visible;
}

.dropdown.is-fullwidth,
.dropdown.is-fullwidth .dropdown-trigger,
.dropdown.is-fullwidth .dropdown-menu {
  width: 100%;
}
</style>

<style lang="scss">
html.dark-mode {
  .buy-credits-modal {
    .notification.is-light {
      background-color: #1a1a1a;
      color: #f5f5f5;
    }

    .notification.is-light a {
      color: #10e80c !important;
    }
  }
}
</style>
