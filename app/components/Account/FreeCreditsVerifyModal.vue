<template>
  <div class="modal" :class="{ 'is-active': modelValue }">
    <div class="modal-background" @click="dismissModal"></div>
    <div class="modal-content" style="max-width: 450px; width: 100%">
      <div class="box has-text-centered p-6" style="border-radius: 16px">
        <!-- Step 1: prompt -->
        <template v-if="!showCardForm">
          <h1 class="title is-3 mb-3">Verify to claim free credits</h1>
          <p class="subtitle is-6 has-text-grey mb-4">
            <template v-if="formattedAmount">
              Add a valid debit or credit card to unlock
              <strong class="has-text-success">{{ formattedAmount }}</strong> in
              free credits.
            </template>
            <template v-else>
              Add a valid debit or credit card to unlock your free credits.
            </template>
          </p>

          <p v-if="errorMessage" class="help is-danger mb-4">{{ errorMessage }}</p>

          <div class="mt-5">
            <button
              type="button"
              class="button is-dark is-fullwidth is-medium"
              style="border-radius: 8px"
              @click="startCardForm"
            >
              Verify payment method
            </button>
          </div>

          <div class="mt-4">
            <a
              class="has-text-grey-light is-size-7 is-clickable is-block"
              @click="dismissModal"
            >
              Maybe later
            </a>
          </div>
        </template>

        <!-- Step 2: card form -->
        <template v-else>
          <h1 class="title is-4 mb-3">Verify payment method</h1>
          <p class="subtitle is-6 has-text-grey mb-4">
            Your card is used for verification only and will not be charged.
          </p>

          <div ref="cardElementRef" class="stripe-card-element mb-3"></div>
          <p v-if="cardError" class="help is-danger mb-3">{{ cardError }}</p>

          <button
            type="button"
            class="button is-dark is-fullwidth is-medium"
            style="border-radius: 8px"
            :disabled="!cardReady || savingCard"
            :class="{ 'is-loading': savingCard }"
            @click="saveCard"
          >
            Save Card
          </button>

          <div class="mt-4">
            <a
              class="has-text-grey-light is-size-7 is-clickable is-block"
              @click="backToPrompt"
            >
              Back
            </a>
          </div>
        </template>
      </div>
    </div>
    <button
      class="modal-close is-large"
      aria-label="close"
      @click="dismissModal"
    ></button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onBeforeUnmount } from "vue";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe, StripeCardElement } from "@stripe/stripe-js";
import { useToast } from "vue-toastification";
import type { SetupIntentResponse } from "~/composables/usePaymentMethods";

const props = defineProps<{
  modelValue: boolean;
  amount?: number | null;
  errorMessage?: string | null;
}>();

const emit = defineEmits(["update:modelValue", "dismissed", "verified"]);

const config = useRuntimeConfig().public;
const toast = useToast();
const colorMode = useColorMode();
const { paymentVerified, fetchPaymentMethods } = usePaymentMethods();

const showCardForm = ref(false);
const cardElementRef = ref<HTMLElement | null>(null);
const cardError = ref("");
const cardReady = ref(false);
const savingCard = ref(false);

let stripe: Stripe | null = null;
let cardElement: StripeCardElement | null = null;

const formattedAmount = computed(() => {
  if (props.amount != null) {
    const dollars = props.amount / 1000;
    return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
  }
  return null;
});

const justOpened = ref(false);

const destroyCardElement = () => {
  if (cardElement) {
    cardElement.destroy();
    cardElement = null;
  }
  cardReady.value = false;
};

const mountCardElement = () => {
  if (!stripe || !cardElementRef.value) return;
  destroyCardElement();
  const isDark = colorMode.value === "dark";
  const elements = stripe.elements();
  cardElement = elements.create("card", {
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
  cardElement.mount(cardElementRef.value);
  cardElement.on("change", (e) => {
    cardError.value = e.error ? e.error.message : "";
    cardReady.value = e.complete;
  });
};

const resetModal = () => {
  showCardForm.value = false;
  cardError.value = "";
  destroyCardElement();
};

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      justOpened.value = true;
      nextTick(() => {
        justOpened.value = false;
      });
    } else {
      resetModal();
    }
  },
);

watch(
  () => colorMode.value,
  async () => {
    if (showCardForm.value && props.modelValue) {
      await nextTick();
      mountCardElement();
    }
  },
);

const startCardForm = async () => {
  showCardForm.value = true;
  await nextTick();
  if (!stripe && config.stripe_publishable_key) {
    stripe = await loadStripe(config.stripe_publishable_key as string);
  }
  mountCardElement();
};

const backToPrompt = () => {
  resetModal();
};

const saveCard = async () => {
  if (!stripe || !cardElement) return;
  savingCard.value = true;
  cardError.value = "";
  try {
    const result = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });
    if (result.error) {
      cardError.value = result.error.message ?? "Failed to add card";
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
        cardError.value =
          confirmResult.error.message ?? "Card authentication failed.";
        return;
      }
      await fetchPaymentMethods();
      if (!paymentVerified.value) {
        cardError.value =
          "Your card could not be verified. Please try a different card.";
        return;
      }
      toast.success("Payment method verified.");
      emit("verified");
      emit("update:modelValue", false);
      resetModal();
      return;
    }

    if (!res.accepted) {
      cardError.value =
        res.verificationError ??
        "Your card could not be verified. Please try a different card.";
      return;
    }
    paymentVerified.value = res.paymentVerified;
    await fetchPaymentMethods();
    if (!paymentVerified.value) {
      cardError.value =
        "Your card could not be verified. Please try a different card.";
      return;
    }
    toast.success("Payment method verified.");
    emit("verified");
    emit("update:modelValue", false);
    resetModal();
  } catch (err: unknown) {
    type FetchError = { data?: { message?: string }; message?: string };
    const e = err as FetchError;
    cardError.value = e?.data?.message ?? e?.message ?? "Failed to save card.";
  } finally {
    savingCard.value = false;
  }
};

const closeModal = () => {
  if (!justOpened.value) {
    emit("update:modelValue", false);
  }
};

const dismissModal = () => {
  if (!justOpened.value) {
    emit("dismissed");
    emit("update:modelValue", false);
  }
};

onBeforeUnmount(() => {
  destroyCardElement();
});
</script>

<style scoped>
.stripe-card-element {
  border: 1px solid #dbdbdb;
  border-radius: 8px;
  padding: 12px 10px;
  text-align: left;
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
}
</style>
