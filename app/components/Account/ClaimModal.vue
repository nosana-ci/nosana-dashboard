<template>
  <div class="modal" :class="{ 'is-active': modelValue }">
    <div class="modal-background" @click="closeModal"></div>
    <div class="modal-content" style="max-width: 450px; width: 100%">
      <div class="box has-text-centered p-6" style="border-radius: 16px">
        <!-- Type: Manual Code -->
        <template v-if="type === 'manual'">
          <h3 class="title is-4 mb-2">Redeem Code</h3>
          <p class="subtitle is-6 has-text-grey mb-5">
            {{
              claimedSuccessfully
                ? "Your credits have been added to your balance."
                : "Enter your voucher code to add credits to your balance."
            }}
          </p>
          <div class="field" v-if="!claimedSuccessfully">
            <div class="control has-icons-left">
              <input
                class="input is-medium"
                type="text"
                placeholder="NOS-XXX-XXX"
                v-model="claimCode"
                :disabled="claiming"
                @keyup.enter="handleClaim"
                style="border-radius: 8px"
              />
              <span class="icon is-left">
                <i class="fas fa-ticket-alt"></i>
              </span>
            </div>
          </div>
          <div class="mt-5">
            <button
              v-if="!claimedSuccessfully"
              class="button is-dark is-fullwidth is-medium"
              @click="handleClaim"
              :disabled="!claimCode.trim() || claiming"
              :class="{ 'is-loading': claiming }"
              style="border-radius: 8px"
            >
              Redeem Credits
            </button>
            <nuxt-link
              v-else
              to="/deployments/create"
              class="button is-dark is-fullwidth is-medium"
              style="border-radius: 8px"
              @click="closeModal"
            >
              Start Deploying
            </nuxt-link>
          </div>
        </template>

        <!-- Type: Automatic Grant -->
        <template v-else-if="type === 'grant'">
          <h1 class="title is-3 mb-3">
            {{
              claimedSuccessfully ? "Credits Added" : "Free Credits"
            }}
          </h1>
          <p class="subtitle is-6 has-text-grey mb-5">
            <template v-if="claimedSuccessfully">
              <strong class="has-text-success">{{ formattedAmount }}</strong> in credits
              have been added to your account.
            </template>
            <template v-else>
              Claim <strong class="has-text-success">{{ formattedAmount }}</strong> in
              free credits to get started.
            </template>
          </p>
          <div class="mt-5">
            <button
              v-if="!claimedSuccessfully"
              @click="handleClaim"
              :disabled="claiming"
              class="button is-dark is-fullwidth is-medium"
              :class="{ 'is-loading': claiming }"
              style="border-radius: 8px"
            >
              Claim {{ formattedAmount }} Credits
            </button>
            <nuxt-link
              v-else
              to="/deployments/create"
              class="button is-dark is-fullwidth is-medium"
              style="border-radius: 8px"
              @click="closeModal"
            >
              Start Deploying
            </nuxt-link>
          </div>
        </template>

        <!-- Type: Invitation -->
        <template v-else-if="type === 'invitation'">
          <h2 class="title is-3 mb-3">Your Credits Are Ready</h2>
          <p class="subtitle is-6 has-text-grey mb-5" v-if="invitation">
            <template v-if="claimedSuccessfully">
              Your invitation credits have been claimed.
            </template>
            <template v-else>
              Claim
              <strong class="has-text-success">
                {{ formattedInvitationAmount }}</strong
              >
              in credits to get started.
            </template>
          </p>
          <div class="mt-5">
            <button
              v-if="!claimedSuccessfully && invitation"
              @click="handleClaim"
              :disabled="claiming"
              class="button is-dark is-fullwidth is-medium"
              :class="{ 'is-loading': claiming }"
              style="border-radius: 8px"
            >
              Claim {{ formattedInvitationAmount }} Credits
            </button>
            <nuxt-link
              v-else
              to="/deployments/create"
              class="button is-dark is-fullwidth is-medium"
              style="border-radius: 8px"
              @click="closeModal"
            >
              Start Deploying
            </nuxt-link>
          </div>
        </template>

        <div class="mt-4" v-if="!claiming">
          <a
            @click="closeModal"
            class="has-text-grey-light is-size-7 is-clickable is-block"
          >
            Maybe later
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
import { useToast } from "vue-toastification";
import { trackEvent } from "~/utils/analytics";

interface Invitation {
  creditsAmount: number;
}

const props = defineProps<{
  modelValue: boolean;
  type: "manual" | "grant" | "invitation";
  invitation?: Invitation | null;
  token?: string;
  amount?: number | null;
}>();

const emit = defineEmits(["update:modelValue", "claimed"]);

const config = useRuntimeConfig().public;
const { isAuthenticated, userData } = useSuperTokens();
const toast = useToast();
const claiming = ref(false);
const claimedSuccessfully = ref(false);
const claimCode = ref("");

const formattedAmount = computed(() => {
  if (props.amount != null) {
    const dollars = props.amount / 1000;
    return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
  }
  return '$...';
});

const formattedInvitationAmount = computed(() => {
  if (props.invitation?.creditsAmount != null) {
    const dollars = props.invitation.creditsAmount / 1000;
    return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
  }
  return '$...';
});

// Guard against the modal-background receiving a stale click event from the
// same tick the modal was opened (e.g. a propagating click that made it open).
const justOpened = ref(false);
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      justOpened.value = true;
      nextTick(() => {
        justOpened.value = false;
      });
    }
  },
);

const closeModal = () => {
  if (!claiming.value && !justOpened.value) {
    emit("update:modelValue", false);
    // Reset state after a small delay so it doesn't flicker while closing
    setTimeout(() => {
      claimedSuccessfully.value = false;
      claimCode.value = "";
    }, 300);
  }
};

const handleClaim = async () => {
  if (!isAuthenticated.value) return;

  claiming.value = true;
  try {
    let url = "";
    let body = {};

    if (props.type === "manual") {
      url = `${config.backend_url}/api/credits/claim`;
      body = { code: claimCode.value.trim() };
    } else if (props.type === "grant") {
      trackEvent("credits_claim_click", {
        user_id: userData.value?.generatedAddress,
        auth_method: userData.value?.loginMethod,
      });
      url = `${config.backend_url}/api/credits/request`;
    } else if (props.type === "invitation") {
      url = `${config.backend_url}/api/credits/invitations/${props.token}/claim`;
    }

    const response = await $fetch<{ amount: number }>(url, {
      method: "POST",
      credentials: "include",
      body,
    });

    toast.success(`Successfully claimed $${response.amount} in credits!`);
    claimedSuccessfully.value = true;

    if (props.type === "grant") {
      trackEvent("credits_claim_success", {
        credits_amount: response.amount,
        type: props.type,
        user_id: userData.value?.generatedAddress,
        auth_method: userData.value?.loginMethod,
      });
    }

    emit("claimed", response.amount);
  } catch (err: unknown) {
    console.error("Error claiming credits:", err);
    type FetchError = { status?: number; data?: { message?: string }; response?: { status?: number; _data?: { message?: string } } };
    const e = err as FetchError;
    const status = e?.status ?? e?.response?.status;
    const message = e?.data?.message ?? e?.response?._data?.message;

    if (status === 429) {
      toast.error(message ?? "Too many requests. Please come back later to claim your credits.");
    } else if ((status === 400 || status === 403) && message) {
      toast.error(message);
    } else {
      toast.error(message ?? "Failed to claim credits");
    }
  } finally {
    claiming.value = false;
  }
};
</script>
