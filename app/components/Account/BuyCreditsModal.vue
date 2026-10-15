<template>
  <div class="modal buy-credits-modal" :class="{ 'is-active': modelValue }">
    <div class="modal-background" @click="closeModal"></div>
    <div
      class="modal-content buy-credits-modal-content"
      style="max-width: 480px; width: 100%"
    >
      <div class="box p-6 buy-credits-modal-box" style="border-radius: 16px">
        <!-- Success state -->
        <template v-if="purchasedSuccessfully">
          <h3 class="title is-4 mb-2 has-text-centered">
            {{ cryptoPurchasedToken ? "Conversion submitted" : "Credits Added!" }}
          </h3>
          <template v-if="cryptoPurchasedToken">
            <p class="subtitle is-6 has-text-grey has-text-centered mb-4">
              {{ purchasedSublabel }}
            </p>
            <div class="crypto-receipt mb-5">
              <div class="crypto-receipt-row">
                <span class="crypto-receipt-label">You sent</span>
                <span class="crypto-receipt-value"
                  >{{ purchasedAmount }} {{ cryptoPurchasedToken }}</span
                >
              </div>
              <div class="crypto-receipt-row">
                <span class="crypto-receipt-label">You get</span>
                <span class="crypto-receipt-value is-credits">
                  <template v-if="cryptoPurchasedCredits"
                    >{{ cryptoPurchasedCredits }} in credits</template
                  >
                  <template v-else>Credits</template>
                </span>
              </div>
              <div class="crypto-receipt-foot">
                <span
                  >Your Nosana account ·
                  <span class="is-family-monospace">{{
                    truncatedGeneratedAddress
                  }}</span></span
                >
                <span class="crypto-receipt-status">Pending</span>
              </div>
            </div>
          </template>
          <p v-else class="subtitle is-6 has-text-grey has-text-centered mb-5">
            <strong class="has-text-success">{{ purchasedLabel }}</strong>
            {{ purchasedSublabel }}
          </p>
          <button
            class="button is-success is-fullwidth is-medium"
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

          <div v-if="isBanned" class="notification is-danger is-light mb-4">
            Your account is suspended. Topping up credits is disabled.
          </div>
          <div v-else-if="isSpareCapacityOnly" class="notification is-info is-light mb-4">
            {{ SPARE_CAPACITY_TOPUP_DISABLED }}
          </div>

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
              <div
                v-if="loadingMethods && !savedMethods.length"
                class="has-text-grey is-size-7"
              >
                Loading saved cards...
              </div>
              <div
                v-else-if="!savedMethods.length"
                class="notification is-light p-4 mb-0"
              >
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
                      <AccountCardBrandIcon
                        :brand="method.brand"
                        class="mr-2"
                      />
                      <span class="is-family-monospace">
                        {{ formatMethodLabel(method) }}
                      </span>
                    </a>
                  </div>
                </div>
              </div>
              <p v-if="savedMethods.length" class="is-size-7 mt-2 mb-0">
                <nuxt-link
                  to="/account/billing"
                  class="has-text-grey"
                  @click="closeModal"
                >
                  Manage cards
                </nuxt-link>
              </p>
            </div>

            <button
              class="button is-success is-fullwidth is-medium"
              :disabled="!canSubmit || purchasing"
              :class="{ 'is-loading': purchasing }"
              @click="handlePurchase"
            >
              {{
                authenticating
                  ? "Confirming with your bank…"
                  : `Pay $${effectiveAmount}`
              }}
            </button>
            <p
              v-if="purchaseError"
              class="help is-danger has-text-centered mt-2"
            >
              {{ purchaseError }}
            </p> </template
          ><!-- end card tab -->

          <!-- Crypto tab -->
          <template v-else-if="activeTab === 'crypto'">
            <!-- Connect wallet prompt -->
            <template v-if="!walletConnected">
              <p class="is-size-7 has-text-grey mb-3">
                Connect your Solana wallet to pay with USDC or NOS. The tokens
                you send are converted to credits and cannot be refunded.
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
              <!-- Connected wallet, one line -->
              <div class="crypto-wallet mb-4">
                <span class="crypto-wallet-dot" aria-hidden="true"></span>
                <span class="crypto-wallet-name">{{ walletName }}</span>
                <span class="crypto-wallet-address is-family-monospace">{{
                  truncatedWalletAddress
                }}</span>
                <button
                  type="button"
                  class="crypto-wallet-disconnect"
                  @click="disconnectWallet"
                >
                  Disconnect
                </button>
              </div>

              <!-- One-way conversion notice -->
              <div class="crypto-notice mb-4" role="note">
                <span class="crypto-notice-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <path
                      d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
                    />
                  </svg>
                </span>
                <div>
                  <p class="crypto-notice-title">Crypto top-ups are final</p>
                  <p class="crypto-notice-body">
                    The {{ cryptoToken }} you send is converted to Nosana
                    credits. Credits cannot be refunded, withdrawn, or converted
                    back to crypto.
                  </p>
                </div>
              </div>

              <!-- Amount, with the token switch inside the field -->
              <div class="mb-4">
                <label
                  class="label is-small is-flex is-justify-content-space-between"
                  for="crypto-amount"
                >
                  <span>Amount</span>
                  <span class="has-text-grey has-text-weight-normal">
                    <template v-if="loadingBalance">Loading...</template>
                    <template v-else-if="selectedTokenBalance !== null">
                      Balance:
                      {{
                        selectedTokenBalance.toLocaleString(undefined, {
                          maximumFractionDigits: 4,
                        })
                      }}
                      {{ cryptoToken }}
                    </template>
                  </span>
                </label>
                <div class="crypto-amount input">
                  <input
                    id="crypto-amount"
                    class="crypto-amount-input"
                    type="number"
                    min="0.000001"
                    step="any"
                    placeholder="0.00"
                    v-model.number="cryptoAmount"
                  />
                  <div
                    class="crypto-token-switch"
                    role="radiogroup"
                    aria-label="Token"
                  >
                    <button
                      v-for="token in CRYPTO_TOKENS"
                      :key="token"
                      type="button"
                      role="radio"
                      :aria-checked="cryptoToken === token"
                      :class="{ 'is-active': cryptoToken === token }"
                      @click="cryptoToken = token"
                    >
                      {{ token }}
                    </button>
                  </div>
                </div>
                <p
                  v-if="!(cryptoAmount && cryptoAmount > 0)"
                  class="help has-text-grey"
                >
                  <template v-if="cryptoToken === 'USDC'"
                    >1 USDC = $1 in credits</template
                  >
                  <template v-else-if="nosPrice"
                    >1 NOS ≈ ${{ nosPrice.toFixed(4) }} in credits at the
                    current price</template
                  >
                </p>
              </div>

              <!-- Conversion receipt -->
              <div
                v-if="cryptoAmount && cryptoAmount > 0"
                class="crypto-receipt mb-4"
              >
                <div
                  class="crypto-receipt-row"
                  :class="{ 'is-over': cryptoExceedsBalance }"
                >
                  <span class="crypto-receipt-label">You send</span>
                  <span class="crypto-receipt-cell">
                    <span class="crypto-receipt-value"
                      >{{ cryptoAmount }} {{ cryptoToken }}</span
                    >
                    <span v-if="cryptoExceedsBalance" class="crypto-receipt-sub">
                      Exceeds wallet balance of
                      {{ formatTokenAmount(selectedTokenBalance ?? 0) }}
                      {{ cryptoToken }}
                    </span>
                  </span>
                </div>
                <div class="crypto-receipt-row">
                  <span class="crypto-receipt-label">You get</span>
                  <span class="crypto-receipt-cell">
                    <span class="crypto-receipt-value is-credits">
                      <template v-if="cryptoCreditsLabel"
                        >{{ cryptoCreditsLabel }} in credits</template
                      >
                      <template v-else>Credits</template>
                    </span>
                    <span
                      v-if="cryptoToken === 'NOS'"
                      class="crypto-receipt-sub"
                    >
                      <template v-if="nosPrice"
                        >at the current NOS price of ${{
                          nosPrice.toFixed(4)
                        }}</template
                      >
                      <template v-else>at the NOS price when it lands</template>
                    </span>
                  </span>
                </div>
                <div class="crypto-receipt-foot">
                  <span
                    >Your Nosana account ·
                    <span class="is-family-monospace">{{
                      truncatedGeneratedAddress
                    }}</span></span
                  >
                  <span class="crypto-receipt-final">Not refundable</span>
                </div>
              </div>

              <!-- Acknowledgement -->
              <label
                class="crypto-ack mb-4"
                :class="{ 'is-checked': cryptoAcknowledged }"
              >
                <input
                  type="checkbox"
                  v-model="cryptoAcknowledged"
                  :disabled="cryptoPurchasing"
                />
                <span>
                  I understand my {{ cryptoToken }} will be converted to credits
                  and cannot be refunded.
                </span>
              </label>

              <button
                class="button is-success is-fullwidth is-medium"
                :disabled="!cryptoCanSubmit || cryptoPurchasing"
                :class="{ 'is-loading': cryptoPurchasing }"
                @click="handleCryptoPurchase"
              >
                Convert {{ cryptoAmount || "" }} {{ cryptoToken }} to credits
              </button>
              <p
                v-if="cryptoError"
                class="help is-danger has-text-centered mt-2"
              >
                {{ cryptoError }}
              </p>
              <p v-else-if="cryptoHint" class="crypto-hint mt-2">
                {{ cryptoHint }}
              </p>
            </template> </template
          ><!-- end crypto tab -->
        </template>

        <div
          class="mt-4"
          v-if="!purchasing && !cryptoPurchasing && !purchasedSuccessfully"
        >
          <a
            @click="closeModal"
            class="has-text-grey-light is-size-7 is-clickable is-block has-text-centered"
          >
            Cancel
          </a>
        </div>
      </div>
    </div>
    <button
      class="modal-close is-large"
      aria-label="close"
      @click="closeModal"
    ></button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import { useToast } from "vue-toastification";
import {
  SolanaWalletModal,
  useWallet,
  useSolanaWallets,
} from "@nosana/solana-vue";
import { createTokenService, Logger } from "@nosana/kit";
import type { Address } from "@nosana/kit";
import type { SavedPaymentMethod } from "~/composables/usePaymentMethods";
import type { CryptoTopupToken } from "~/composables/useCryptoTopup";
import { SPARE_CAPACITY_TOPUP_DISABLED } from "~/utils/spareCapacity";
import { fetchPurchaseHistory } from "~/composables/usePurchaseHistory";
import { trackEvent, trackPixelEvent } from "~/utils/analytics";

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
const {
  connected: walletConnected,
  account: walletAccount,
  disconnect,
} = useWallet();

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
    w.accounts?.some(
      (acc: any) => acc.address === walletAccount.value?.address,
    ),
  );
  return found?.name ?? "Connected Wallet";
});

const truncatedWalletAddress = computed(() => {
  const addr = walletAccount.value?.address;
  if (!addr) return "";
  return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
});

const tokenBalances = ref({
  NOS: null as number | null,
  USDC: null as number | null,
});
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
      const USDC_MINT =
        config.network === "devnet"
          ? "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr"
          : "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
      const usdcService = createTokenService(
        {
          logger: Logger.getInstance(),
          solana: nosana.value.solana,
          getWallet: () => wallet.value ?? undefined,
        },
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

const selectedTokenBalance = computed(
  () => tokenBalances.value[cryptoToken.value],
);

const walletModalOpen = ref(false);
const { topup: cryptoTopup } = useCryptoTopup();
const { userData, isBanned, isSpareCapacityOnly } = useSuperTokens();
const topupDisabled = computed(() => isBanned.value || isSpareCapacityOnly.value);
const { data: stats } = useAPI("/stats");
const nosPrice = computed(() => stats.value?.price || 0);

const activeTab = ref<"card" | "crypto">("card");

const CRYPTO_TOKENS: CryptoTopupToken[] = ["USDC", "NOS"];
const cryptoToken = ref<CryptoTopupToken>("USDC");
const cryptoAmount = ref<number | null>(null);
const cryptoPurchasing = ref(false);
const cryptoError = ref("");
const cryptoPurchasedToken = ref<CryptoTopupToken | null>(null);
const cryptoAcknowledged = ref(false);
/** Credit value shown on the success screen, captured when the send goes out. */
const cryptoPurchasedCredits = ref("");

const formatTokenAmount = (amount: number) =>
  amount.toLocaleString(undefined, { maximumFractionDigits: 4 });

const cryptoExceedsBalance = computed(() => {
  const balance = selectedTokenBalance.value;
  const amount = cryptoAmount.value;
  return balance !== null && !!amount && amount > balance;
});

/** Why the convert button is disabled, when it is not obvious from the form. */
const cryptoHint = computed(() => {
  if (cryptoPurchasing.value || topupDisabled.value) return "";
  if (!(cryptoAmount.value && cryptoAmount.value > 0)) return "";
  if (cryptoExceedsBalance.value)
    return "Reduce the amount to what your wallet holds.";
  if (!cryptoAcknowledged.value) return "Confirm above to continue.";
  return "";
});

/** Dollar value of the entered amount; empty while the NOS price is unknown. */
const cryptoCreditsLabel = computed(() => {
  const amount = cryptoAmount.value;
  if (!amount || amount <= 0) return "";
  if (cryptoToken.value === "USDC") return `$${amount.toFixed(2)}`;
  return nosPrice.value ? `≈ $${(amount * nosPrice.value).toFixed(2)}` : "";
});

const truncatedGeneratedAddress = computed(() => {
  const addr = userData.value?.generatedAddress;
  if (!addr) return "";
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
});

const cryptoCanSubmit = computed(
  () =>
    !topupDisabled.value &&
    cryptoAcknowledged.value &&
    !cryptoExceedsBalance.value &&
    !!(cryptoAmount.value && cryptoAmount.value > 0),
);

const purchasedLabel = computed(() => {
  if (cryptoPurchasedToken.value === "NOS")
    return `${purchasedAmount.value} NOS`;
  return `$${purchasedAmount.value.toFixed(2)}`;
});

const purchasedSublabel = computed(() => {
  if (cryptoPurchasedToken.value)
    return "Your transaction is confirmed. The credits land in your account once the network processes it, usually within a minute.";
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
const authenticating = ref(false);
const purchasedSuccessfully = ref(false);
const purchasedAmount = ref(0);
const purchaseError = ref("");
const justOpened = ref(false);
const isRepeatBuyer = ref(false);

const selectDefaultMethod = () => {
  const defaultMethod = savedMethods.value.find((method) => method.isDefault);
  selectedMethodId.value =
    defaultMethod?.id ?? savedMethods.value[0]?.id ?? null;
};

const selectedMethod = computed(
  () =>
    savedMethods.value.find((method) => method.id === selectedMethodId.value) ??
    null,
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

watch(
  [walletConnected, cryptoToken],
  ([connected]) => {
    if (connected) fetchTokenBalance(cryptoToken.value);
    else tokenBalances.value = { NOS: null, USDC: null };
  },
  { immediate: true },
);

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
      try {
        const history = await fetchPurchaseHistory();
        isRepeatBuyer.value = history.length > 0;
      } catch {
        isRepeatBuyer.value = false;
      }
    }
  },
);

const canSubmit = computed(() => {
  if (topupDisabled.value) return false;
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
    cryptoAcknowledged.value = false;
    cryptoPurchasedCredits.value = "";
    activeTab.value = "card";
  }, 300);
};

const handleCryptoPurchase = async () => {
  if (!cryptoCanSubmit.value || !cryptoAmount.value) return;
  cryptoPurchasing.value = true;
  cryptoError.value = "";
  try {
    const txSignature = await cryptoTopup(cryptoToken.value, cryptoAmount.value);
    cryptoPurchasedCredits.value = cryptoCreditsLabel.value;
    cryptoPurchasedToken.value = cryptoToken.value;
    purchasedAmount.value = cryptoAmount.value;
    purchasedSuccessfully.value = true;
    triggerCreditRefresh();
    emit("purchased", cryptoAmount.value);
    toast.success(`${cryptoAmount.value} ${cryptoToken.value} sent — it is being converted to credits in your account.`);
    trackEvent("purchase", {
      transaction_id: txSignature,
      value: cryptoAmount.value,
      currency: cryptoToken.value,
      method: "crypto",
      transaction_type: "top_up",
    });
    if (isRepeatBuyer.value) trackEvent("repeat_purchase", { method: "crypto" });
    trackPixelEvent("purchase", { value: cryptoAmount.value, currency: cryptoToken.value });
  } catch (err: unknown) {
    type FetchError = { data?: { message?: string }; message?: string };
    const e = err as FetchError;
    cryptoError.value =
      e?.data?.message ?? e?.message ?? "Transaction failed. Please try again.";
    trackEvent("purchase_error", { method: "crypto", reason: cryptoError.value });
  } finally {
    cryptoPurchasing.value = false;
  }
};

const handlePurchase = async () => {
  if (!canSubmit.value || !selectedMethodId.value) return;
  purchasing.value = true;
  purchaseError.value = "";
  try {
    const intentData = await $fetch<{
      clientSecret: string | null;
      paymentIntentId: string;
      requiresAction: boolean;
    }>(`${config.apiBase}/payments/payment-intent`, {
      method: "POST",
      credentials: "include",
      body: {
        amountUsd: effectiveAmount.value,
        paymentMethodId: selectedMethodId.value,
      },
    });

    if (intentData.clientSecret) {
      if (!stripe && config.stripe_publishable_key) {
        stripe = await loadStripe(config.stripe_publishable_key as string);
      }
      if (!stripe) throw new Error("Stripe could not be initialised");

      authenticating.value = true;
      const result = await stripe
        .confirmCardPayment(intentData.clientSecret)
        .finally(() => {
          authenticating.value = false;
        });

      if (result.error) {
        purchaseError.value =
          result.error.code === "payment_intent_authentication_failure"
            ? "Your bank did not confirm this payment, so you have not been charged. Please try again and complete the verification step."
            : (result.error.message ?? "Payment failed");
        trackEvent("purchase_error", { method: "card", reason: purchaseError.value });
        return;
      }

      const status = result.paymentIntent?.status;
      if (status === "processing") {
        purchaseError.value =
          "Payment is processing. Your balance will update shortly.";
        triggerCreditRefresh();
        return;
      }
      if (status && status !== "requires_capture" && status !== "succeeded") {
        purchaseError.value =
          "Payment could not be completed. Please try again.";
        trackEvent("purchase_error", { method: "card", reason: purchaseError.value });
        return;
      }

      await $fetch<{ success: boolean; paymentIntentId: string }>(
        `${config.apiBase}/payments/payment-intent/confirm`,
        {
          method: "POST",
          credentials: "include",
          body: { paymentIntentId: intentData.paymentIntentId },
        },
      );
    }

    purchasedAmount.value = effectiveAmount.value;
    purchasedSuccessfully.value = true;
    triggerCreditRefresh();
    emit("purchased", effectiveAmount.value);
    toast.success(`$${effectiveAmount.value} in credits added to your account!`);
    trackEvent("purchase", {
      transaction_id: intentData.paymentIntentId,
      value: effectiveAmount.value,
      currency: "USD",
      method: "card",
      transaction_type: "top_up",
    });
    if (isRepeatBuyer.value) trackEvent("repeat_purchase", { method: "card" });
    trackPixelEvent("purchase", { value: effectiveAmount.value, currency: "USD" });
  } catch (err: unknown) {
    type FetchError = { data?: { message?: string }; message?: string };
    const e = err as FetchError;
    purchaseError.value =
      e?.data?.message ?? e?.message ?? "Payment failed. Please try again.";
    trackEvent("purchase_error", { method: "card", reason: purchaseError.value });
    if (purchaseError.value.includes("cannot be used for purchases")) {
      await fetchPaymentMethods();
      selectDefaultMethod();
    }
  } finally {
    purchasing.value = false;
    authenticating.value = false;
  }
};

const formatMethodLabel = (method: SavedPaymentMethod | null) =>
  method ? `•••• ${method.last4 ?? "????"}` : "Select a card";
</script>

<style scoped lang="scss">
@use "sass:color";
/* ---------- Crypto conversion blocks ----------
   Light theme is the default; the dark theme redefines the three surface
   tokens at the bottom, so the rules below never mention a theme. */
.crypto-amount,
.crypto-wallet,
.crypto-notice,
.crypto-receipt,
.crypto-ack {
  --surface-bg-solid: #{$white};
  --notice-bg: #{color.adjust($warning, $lightness: 44%)};
  --notice-fg: #7a5200;
  --surface-border: #{$grey-lighter};
  --surface-bg: #{$white-bis};
  --surface-fg: #{$text};
  --surface-muted: #{$text-light};
  font-size: 0.8125rem;
  line-height: 1.45;
}

.crypto-wallet {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  background: var(--surface-bg);
  color: var(--surface-fg);
  font-size: 0.8125rem;
}

.crypto-wallet-dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $secondary;
  box-shadow: 0 0 0 3px rgba($secondary, 0.18);
}

.crypto-wallet-name {
  font-weight: 500;
}

.crypto-wallet-address {
  color: var(--surface-muted);
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.crypto-wallet-disconnect {
  flex: none;
  margin-left: auto;
  padding: 0;
  border: 0;
  background: none;
  color: var(--surface-muted);
  font: inherit;
  font-size: 0.75rem;
  cursor: pointer;

  &:hover {
    color: var(--surface-fg);
    text-decoration: underline;
  }
}

/* The amount field: a Bulma .input shell holding a bare number input and
   the token switch, so the switch sits inside the field's border. */
.crypto-amount {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: auto;
  padding: 0.25rem 0.25rem 0.25rem 0.75rem;

  &:focus-within {
    border-color: $link;
    box-shadow: 0 0 0 0.125em rgba($link, 0.25);
  }
}

.crypto-amount-input {
  flex: 1;
  min-width: 0;
  padding: 0.25rem 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;

  &::placeholder {
    color: var(--surface-muted);
  }

  // The field shows the token, so the browser's spin buttons just add noise.
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }
  appearance: textfield;
  -moz-appearance: textfield;
}

.crypto-token-switch {
  flex: none;
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: 7px;
  background: var(--surface-bg);
  border: 1px solid var(--surface-border);

  button {
    padding: 0.2rem 0.6rem;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: var(--surface-muted);
    font: inherit;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;

    &:hover {
      color: var(--surface-fg);
    }

    &.is-active {
      background: var(--surface-fg);
      color: var(--surface-bg-solid);
    }
  }
}

.crypto-notice {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 0.875rem;
  border-radius: 10px;
  background: var(--notice-bg);
  color: var(--notice-fg);
  border-left: 3px solid $warning;
}

.crypto-notice-icon {
  flex: none;
  width: 1.125rem;
  height: 1.125rem;
  margin-top: 0.05rem;
  color: $warning;

  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
}

/* Explicit colour: the dark theme repaints every <p> otherwise. */
.crypto-notice-title,
.crypto-notice-body {
  color: inherit;
}

.crypto-notice-title {
  font-weight: 600;
  margin-bottom: 0.125rem;
}

.crypto-notice-body {
  opacity: 0.9;
}

.crypto-receipt {
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  background: var(--surface-bg);
  color: var(--surface-fg);
  overflow: hidden;
}

.crypto-receipt-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.625rem 0.875rem;

  & + & {
    border-top: 1px dashed var(--surface-border);
  }
}

.crypto-receipt-label {
  color: var(--surface-muted);
}

.crypto-receipt-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.crypto-receipt-sub {
  margin-top: 0.125rem;
  font-size: 0.6875rem;
  color: var(--surface-muted);
}

.crypto-receipt-row.is-over {
  .crypto-receipt-value {
    color: $danger;
  }

  .crypto-receipt-sub {
    color: $danger;
  }
}

.crypto-receipt-value {
  font-family: $title-family;
  font-weight: 600;
  font-size: 0.9375rem;
  font-variant-numeric: tabular-nums;

  &.is-credits {
    color: $secondary-text;
  }
}

.crypto-receipt-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.5rem 0.875rem;
  border-top: 1px solid var(--surface-border);
  color: var(--surface-muted);
  font-size: 0.75rem;
}

.crypto-receipt-status {
  flex: none;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: rgba($secondary, 0.12);
  color: $secondary-text;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.crypto-hint {
  text-align: center;
  font-size: 0.75rem;
  color: $text-muted;
}

.crypto-receipt-final {
  flex: none;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: var(--notice-bg);
  color: var(--notice-fg);
  font-weight: 600;
  letter-spacing: 0.01em;
}

.crypto-ack {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  color: var(--surface-fg);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    border-color: $grey-light;
  }

  &.is-checked {
    border-color: $secondary;
    background: rgba($secondary, 0.06);
  }

  input {
    flex: none;
    width: 1rem;
    height: 1rem;
    margin-top: 0.1rem;
    accent-color: $secondary;
    cursor: inherit;
  }
}

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
@use "sass:color";

html.dark-mode {
  .buy-credits-modal {
    .crypto-amount,
    .crypto-wallet,
    .crypto-notice,
    .crypto-receipt,
    .crypto-ack {
      --surface-bg-solid: #{$black-ter};
      --notice-bg: rgba(255, 184, 0, 0.12);
      --notice-fg: #{color.adjust($warning, $lightness: 22%)};
      --surface-border: #{$grey-darker};
      --surface-bg: rgba(255, 255, 255, 0.03);
      --surface-fg: #{$white};
      --surface-muted: #{$grey-light};
    }

    .crypto-receipt-value.is-credits,
    .crypto-receipt-status {
      color: $secondary;
    }

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
