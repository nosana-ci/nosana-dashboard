<template>
  <div class="modal buy-credits-modal" :class="{ 'is-active': modelValue }">
    <div class="modal-background" @click="closeModal"></div>
    <div class="modal-content buy-credits-modal-content" style="max-width: 480px; width: 100%">
      <div class="box p-6 buy-credits-modal-box" style="border-radius: 16px">
        <!-- Success state -->
        <template v-if="purchasedSuccessfully">
          <h3 class="title is-4 mb-2 has-text-centered">Credits Added!</h3>
          <p class="subtitle is-6 has-text-grey has-text-centered mb-5">
            <strong class="has-text-success">${{ purchasedAmount.toFixed(2) }}</strong>
            in credits have been added to your account.
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
          <p class="subtitle is-6 has-text-grey mb-5">
            Credits are used to run AI workloads on the Nosana network.
          </p>

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
            <div v-else-if="!savedMethods.length" class="no-card-notice">
              <p class="is-size-7 mb-2">No payment method on file.</p>
              <nuxt-link
                to="/account/payments"
                class="is-size-7 has-text-dark"
                @click="closeModal"
              >
                Add a card on the Payments page &rarr;
              </nuxt-link>
            </div>
            <div
              v-else
              ref="methodPickerRef"
              class="payment-method-picker"
              :class="{ 'is-open': methodMenuOpen }"
            >
              <button
                type="button"
                class="payment-method-trigger"
                :disabled="savedMethods.length <= 1"
                :aria-expanded="methodMenuOpen"
                aria-haspopup="listbox"
                @click="toggleMethodMenu"
              >
                <AccountCardBrandIcon
                  :brand="selectedMethod?.brand ?? null"
                  class="payment-method-icon"
                />
                <span class="payment-method-label">
                  {{ formatMethodLabel(selectedMethod) }}
                </span>
                <span
                  v-if="savedMethods.length > 1"
                  class="payment-method-chevron"
                  :class="{ 'is-open': methodMenuOpen }"
                  aria-hidden="true"
                />
              </button>
              <ul
                v-if="methodMenuOpen && savedMethods.length > 1"
                class="payment-method-menu"
                role="listbox"
              >
                <li v-for="method in savedMethods" :key="method.id" role="none">
                  <button
                    type="button"
                    class="payment-method-option"
                    :class="{ 'is-selected': method.id === selectedMethodId }"
                    role="option"
                    :aria-selected="method.id === selectedMethodId"
                    @click="selectMethod(method.id)"
                  >
                    <AccountCardBrandIcon :brand="method.brand" class="payment-method-icon" />
                    <span class="payment-method-label">
                      {{ formatMethodLabel(method) }}
                    </span>
                  </button>
                </li>
              </ul>
            </div>
            <p v-if="savedMethods.length" class="is-size-7 mt-2 mb-0">
              <nuxt-link to="/account/payments" class="has-text-grey" @click="closeModal">
                Manage cards
              </nuxt-link>
            </p>
          </div>

          <button
            class="button is-dark is-fullwidth is-medium"
            :disabled="!canSubmit || purchasing"
            :class="{ 'is-loading': purchasing }"
            style="border-radius: 8px"
            @click="handlePurchase"
          >
            Pay ${{ effectiveAmount }}
          </button>
          <p v-if="purchaseError" class="help is-danger has-text-centered mt-2">
            {{ purchaseError }}
          </p>
        </template>

        <div class="mt-4" v-if="!purchasing && !purchasedSuccessfully">
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
import type { SavedPaymentMethod } from "~/composables/usePaymentMethods";

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
  if (purchasing.value || justOpened.value) return;
  emit("update:modelValue", false);
  setTimeout(() => {
    purchasedSuccessfully.value = false;
    purchaseError.value = "";
    isCustom.value = false;
    customAmount.value = null;
    selectedAmount.value = 25;
    selectedMethodId.value = null;
    methodMenuOpen.value = false;
  }, 300);
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
.buy-credits-modal.is-active {
  overflow: visible;
}

.buy-credits-modal-content {
  overflow: visible;
}

.buy-credits-modal-box {
  overflow: visible;
}

.payment-method-section {
  overflow: visible;
}

.payment-method-picker {
  position: relative;
  z-index: 2;
}

.payment-method-trigger {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  background-color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease;
}

.payment-method-trigger:not(:disabled):hover,
.payment-method-picker.is-open .payment-method-trigger {
  border-color: #10e80c;
}

.payment-method-trigger:disabled {
  cursor: default;
}

.payment-method-icon {
  flex-shrink: 0;
}

.payment-method-label {
  flex: 1;
  min-width: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9rem;
}

.payment-method-chevron {
  flex-shrink: 0;
  width: 0.45rem;
  height: 0.45rem;
  margin-right: 0.15rem;
  border-right: 2px solid #10e80c;
  border-bottom: 2px solid #10e80c;
  transform: rotate(45deg);
  transition: transform 0.15s ease;
}

.payment-method-chevron.is-open {
  transform: rotate(-135deg);
}

.payment-method-menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  left: 0;
  right: 0;
  z-index: 50;
  margin: 0;
  padding: 0.35rem;
  list-style: none;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 4px 16px rgba(10, 10, 10, 0.08);
}

.payment-method-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.6rem 0.65rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 0.95rem;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.12s ease;
}

.payment-method-option:hover {
  background-color: #f5f5f5;
}

.payment-method-option.is-selected {
  background-color: #f6fff5;
}

.no-card-notice {
  padding: 0.75rem 1rem;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  background-color: #fafafa;
}
</style>

<style lang="scss">
html.dark-mode {
  .buy-credits-modal {
    .payment-method-trigger,
    .payment-method-menu {
      border-color: #4a4a4a;
      background-color: #1a1a1a;
      color: #f5f5f5;
    }

    .payment-method-option {
      color: #f5f5f5;

      &:hover {
        background-color: #2a2a2a;
      }

      &.is-selected {
        background-color: #1e2e1e;
      }
    }

    .no-card-notice {
      border-color: #4a4a4a;
      background-color: #1a1a1a;
      color: #dbdbdb;
    }

    .no-card-notice a {
      color: #10e80c !important;
    }
  }
}
</style>
