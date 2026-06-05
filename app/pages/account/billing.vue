<template>
  <div>
    <TopBar title="Billing" subtitle="Manage your payment methods and purchase history" />
    <div v-if="!isAuthenticated && !isLoading" class="section has-text-centered">
      <p class="has-text-grey">Please sign in to manage billing.</p>
    </div>
    <Loader v-else-if="isLoading" />
    <div v-else class="mt-6">
      <div class="is-flex is-justify-content-flex-end mb-5">
        <button class="button is-primary" @click="openBuyCreditsModal">
          Buy Credits
        </button>
      </div>

      <div class="columns">
        <!-- Saved Payment Methods -->
        <div class="column is-5">
          <h3 class="title is-4 mb-0">Connected Cards</h3>
          <div class="mb-4"></div>
          <div class="box">
            <progress
              v-if="loadingMethods && !methods.length"
              class="progress is-small is-info"
              max="100"
            ></progress>
            <div v-else-if="!methods.length && !showAddCard" class="has-text-centered py-3">
              <p class="has-text-grey mb-3">No saved payment methods.</p>
            </div>
            <div v-else>
              <div
                v-for="method in methods"
                :key="method.id"
                class="saved-card mb-3"
              >
                <div class="is-flex is-align-items-center is-flex-wrap-wrap">
                  <AccountCardBrandIcon :brand="method.brand" class="mr-3" />
                  <span class="is-family-monospace is-size-6">
                    &bull;&bull;&bull;&bull; {{ method.last4 }}
                  </span>
                  <span class="has-text-grey is-size-7 ml-3">
                    {{ method.expMonth }}/{{ method.expYear }}
                  </span>
                  <span
                    v-if="method.isDefault"
                    class="tag is-success is-light is-small ml-3"
                  >
                    Default
                  </span>
                  <button
                    v-else
                    class="button is-small is-light ml-3"
                    :class="{ 'is-loading': settingDefaultId === method.id }"
                    :disabled="!!settingDefaultId || !!deletingId"
                    style="border-radius: 6px"
                    @click="setDefault(method.id)"
                  >
                    Set as default
                  </button>
                  <button
                    class="button is-small is-light ml-auto has-text-grey"
                    :class="{ 'is-loading': deletingId === method.id }"
                    :disabled="!!deletingId"
                    style="border-radius: 6px"
                    @click="deleteMethod(method.id)"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            <!-- Add card section -->
            <div v-if="!showAddCard" class="mt-3">
              <button
                class="button is-small is-light"
                style="border-radius: 6px"
                @click="openAddCard"
              >
                + Add a card
              </button>
            </div>
            <div v-else class="mt-4">
              <label class="label is-small">New Card</label>
              <div ref="addCardElementRef" class="stripe-card-element mb-3"></div>
              <p v-if="addCardError" class="help is-danger mb-2">{{ addCardError }}</p>
              <div class="is-flex" style="gap: 0.5rem">
                <button
                  class="button is-primary is-small"
                  :disabled="!addCardReady || addingCard"
                  :class="{ 'is-loading': addingCard }"
                  style="border-radius: 6px"
                  @click="handleAddCard"
                >
                  Save Card
                </button>
                <button
                  class="button is-small is-light"
                  style="border-radius: 6px"
                  @click="cancelAddCard"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Purchase History -->
        <div class="column is-7">
          <h3 class="title is-4 mb-0">Purchase History</h3>
          <div class="mb-4"></div>
          <div class="box" style="padding: 0; overflow: hidden">
            <progress
              v-if="loadingPurchases && !purchases.length"
              class="progress is-small is-info"
              max="100"
            ></progress>
            <div
              v-else-if="!purchases.length"
              class="has-text-centered py-5"
            >
              <p class="has-text-grey">No purchases yet.</p>
            </div>
            <table
              v-else
              class="table is-fullwidth is-hoverable"
              style="margin-bottom: 0"
            >
              <thead>
                <tr>
                  <th class="px-5 py-4">Date</th>
                  <th class="px-5 py-4">Amount</th>
                  <th class="px-5 py-4">Card</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="purchase in purchases" :key="purchase.id">
                  <td class="px-5 py-4">{{ formatDate(purchase.createdAt) }}</td>
                  <td class="px-5 py-4">
                    <strong>${{ purchase.amountUsd.toFixed(2) }}</strong>
                  </td>
                  <td class="px-5 py-4">
                    <div
                      v-if="purchase.cardLast4"
                      class="is-flex is-align-items-center"
                    >
                      <AccountCardBrandIcon
                        :brand="purchase.cardBrand"
                        class="mr-2"
                      />
                      <span class="is-family-monospace is-size-7">
                        &bull;&bull;&bull;&bull; {{ purchase.cardLast4 }}
                      </span>
                    </div>
                    <span v-else class="has-text-grey is-size-7">Unknown</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <AccountClaimModal
      v-model="showFreeCreditsModal"
      type="grant"
      :amount="freeCreditsAmount"
      @claimed="handleFreeCreditsClaimed"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed, watch } from "vue";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe, StripeCardElement } from "@stripe/stripe-js";
import { useToast } from "vue-toastification";
import type { SetupIntentResponse } from "~/composables/usePaymentMethods";
import AccountClaimModal from "~/components/Account/ClaimModal.vue";
import { clearFreeCreditsVerifyDismissed } from "~/utils/freeCreditsVerifyDismissal";

const config = useRuntimeConfig().public;
const toast = useToast();
const route = useRoute();
const router = useRouter();
const { isAuthenticated, isLoading, userData } = useSuperTokens();
const { triggerCreditRefresh } = useCreditRefresh();
const { openBuyCreditsModal, purchasedTick } = useBuyCreditsModal();
const colorMode = useColorMode();
const showFreeCreditsModal = ref(false);
const freeCreditsAmount = ref<number | null>(null);
const isFreeCreditsFlow = computed(() => route.query.source === "free-credits");

const {
  methods,
  paymentVerified,
  loading: loadingMethods,
  settingDefaultId,
  fetchPaymentMethods,
  setDefaultPaymentMethod,
} = usePaymentMethods();

const deletingId = ref<string | null>(null);

const setDefault = async (id: string) => {
  try {
    await setDefaultPaymentMethod(id);
    toast.success("Default payment method updated.");
  } catch {
    toast.error("Failed to update default payment method.");
  }
};

const tryOpenFreeCreditsClaimModal = async () => {
  try {
    const data = await $fetch<{ eligible: boolean; amount?: number; message?: string }>(
      `${config.apiBase}/api/credits/request/eligibility`,
      { credentials: "include" },
    );
    if (data?.eligible) {
      clearFreeCreditsVerifyDismissed(userData.value?.id);
      freeCreditsAmount.value = data.amount ?? null;
      showFreeCreditsModal.value = true;
    }
  } catch {
    // Ineligible or request failed — no UI feedback
  }
};

const handleFreeCreditsClaimed = async () => {
  triggerCreditRefresh();
  if (isFreeCreditsFlow.value) {
    await router.replace({ path: "/account/billing" });
  }
};

const deleteMethod = async (id: string) => {
  const method = methods.value.find((m) => m.id === id);
  const cardLabel = method?.last4 ? `card ending in ${method.last4}` : "this card";
  if (
    !confirm(
      `Remove ${cardLabel} from your account? You will need to add a card again to buy credits or claim free credits.`,
    )
  ) {
    return;
  }

  deletingId.value = id;
  try {
    await $fetch(`${config.apiBase}/api/payments/methods/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    methods.value = methods.value.filter((m) => m.id !== id);
    await fetchPaymentMethods();
    toast.success("Card removed.");
  } catch {
    toast.error("Failed to remove card. Please try again.");
  } finally {
    deletingId.value = null;
  }
};

// ─── Add Card ─────────────────────────────────────────────────────
const showAddCard = ref(false);
const addCardElementRef = ref<HTMLElement | null>(null);
const addCardError = ref("");
const addCardReady = ref(false);
const addingCard = ref(false);

let stripe: Stripe | null = null;
let addCardElement: StripeCardElement | null = null;

const openAddCard = async () => {
  showAddCard.value = true;
  await nextTick();
  if (!stripe && config.stripe_publishable_key) {
    stripe = await loadStripe(config.stripe_publishable_key as string);
  }
  if (!stripe || !addCardElementRef.value) return;
  mountStripeCardElement();
};

const cancelAddCard = () => {
  showAddCard.value = false;
  addCardError.value = "";
  addCardReady.value = false;
  if (addCardElement) {
    addCardElement.destroy();
    addCardElement = null;
  }
};

const handleAddCard = async () => {
  if (!stripe || !addCardElement) return;
  addingCard.value = true;
  addCardError.value = "";
  try {
    const result = await stripe.createPaymentMethod({
      type: "card",
      card: addCardElement,
    });
    if (result.error) {
      addCardError.value = result.error.message ?? "Failed to add card";
      return;
    }
    const res = await $fetch<SetupIntentResponse>(
      `${config.apiBase}/api/payments/setup-intent`,
      {
        method: "POST",
        credentials: "include",
        body: { paymentMethodId: result.paymentMethod.id },
      },
    );

    if (res.requiresAction && res.clientSecret) {
      const confirmResult = await stripe.confirmCardSetup(res.clientSecret);
      if (confirmResult.error) {
        addCardError.value =
          confirmResult.error.message ?? "Card authentication failed.";
        return;
      }
      await fetchPaymentMethods();
      if (!paymentVerified.value) {
        addCardError.value =
          "Your card could not be verified. Please try a different card.";
        return;
      }
      toast.success("Payment method verified.");
      cancelAddCard();
      await tryOpenFreeCreditsClaimModal();
      return;
    }

    if (!res.accepted) {
      addCardError.value =
        res.verificationError ??
        "Your card could not be verified. Please try a different card.";
      return;
    }
    toast.success("Payment method verified.");
    paymentVerified.value = res.paymentVerified;
    cancelAddCard();
    await fetchPaymentMethods();

    if (paymentVerified.value) {
      await tryOpenFreeCreditsClaimModal();
    }
  } catch (err: unknown) {
    type FetchError = { data?: { message?: string }; message?: string };
    const e = err as FetchError;
    addCardError.value = e?.data?.message ?? e?.message ?? "Failed to save card.";
  } finally {
    addingCard.value = false;
  }
};

// ─── Purchase History ──────────────────────────────────────────────
interface Purchase {
  id: string;
  amountUsd: number;
  createdAt: string;
  referenceId: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
}

const purchases = ref<Purchase[]>([]);
const loadingPurchases = ref(false);

const fetchPurchases = async () => {
  loadingPurchases.value = true;
  try {
    const data = await $fetch<{ purchases: Purchase[] }>(
      `${config.apiBase}/api/payments/purchases`,
      { credentials: "include" },
    );
    purchases.value = data.purchases;
  } catch {
    purchases.value = [];
  } finally {
    loadingPurchases.value = false;
  }
};

watch(purchasedTick, () => {
  fetchPurchases();
});

const mountStripeCardElement = () => {
  if (!stripe || !addCardElementRef.value) return;
  if (addCardElement) {
    addCardElement.destroy();
    addCardElement = null;
  }
  const elements = stripe.elements();
  const isDark = colorMode.value === "dark";
  addCardElement = elements.create("card", {
    hidePostalCode: true,
    style: {
      base: {
        fontSize: "16px",
        fontFamily:
          "'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
        color: isDark ? "#ffffff" : "#32325d",
        iconColor: isDark ? "#aab7c4" : "#666ee8",
        "::placeholder": { color: isDark ? "#6b7280" : "#aab7c4" },
      },
      invalid: { color: "#f14668" },
    },
  });
  addCardElement.mount(addCardElementRef.value);
  addCardElement.on("change", (e) => {
    addCardError.value = e.error ? e.error.message : "";
    addCardReady.value = e.complete;
  });
};

watch(
  () => colorMode.value,
  async () => {
    if (showAddCard.value) {
      await nextTick();
      mountStripeCardElement();
    }
  },
);

onMounted(async () => {
  if (isAuthenticated.value) {
    await fetchPaymentMethods();
    fetchPurchases();
    if (route.query.buy === "credits") {
      openBuyCreditsModal();
      const query = { ...route.query };
      delete query.buy;
      await router.replace({ path: "/account/billing", query });
    }
    if (isFreeCreditsFlow.value && paymentVerified.value) {
      await tryOpenFreeCreditsClaimModal();
    }
  }
});

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

</script>

<style scoped>
.saved-card {
  padding: 0.75rem 1rem;
  border: 1px solid #dbdbdb;
  border-radius: 8px;
}

.stripe-card-element {
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  padding: 12px 10px;
  transition: border-color 0.15s ease;
}

.stripe-card-element:focus-within {
  border-color: #10e80c;
}
</style>

<style lang="scss">
html.dark-mode {
  .stripe-card-element {
    border-color: #4a4a4a;
    background-color: #1a1a1a;
  }

  .saved-card {
    border-color: #4a4a4a;
  }
}
</style>
