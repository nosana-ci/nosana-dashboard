<template>
  <div class="modal" :class="{ 'is-active': modelValue }">
    <div class="modal-background" @click="closeModal"></div>
    <div class="modal-content" style="max-width: 450px; width: 100%">
      <div class="box has-text-centered p-6" style="border-radius: 16px;">
        <!-- Type: Manual Code -->
        <template v-if="type === 'manual'">
          <h3 class="title is-4 mb-2">Redeem Code</h3>
          <p class="subtitle is-6 has-text-grey mb-5">
            Enter your voucher code to add credits to your balance.
          </p>
          <div class="field">
            <div class="control has-icons-left">
              <input
                class="input is-medium"
                type="text"
                placeholder="NOS-XXX-XXX"
                v-model="claimCode"
                :disabled="claiming"
                @keyup.enter="handleClaim"
                style="border-radius: 8px;"
              />
              <span class="icon is-left">
                <i class="fas fa-ticket-alt"></i>
              </span>
            </div>
          </div>
          <div class="mt-5">
            <button
              class="button is-dark is-fullwidth is-medium"
              @click="handleClaim"
              :disabled="!claimCode.trim() || claiming"
              :class="{ 'is-loading': claiming }"
              style="border-radius: 8px;"
            >
              Redeem Credits
            </button>
          </div>
        </template>

        <!-- Type: Automatic Grant -->
        <template v-else-if="type === 'grant'">
          <h1 class="title is-3 mb-3">Free Credits!</h1>
          <p class="subtitle is-6 has-text-grey mb-5">
            To help you get started, we've awarded your account a one-time grant of <strong class="has-text-success">$10.00</strong>.
          </p>
          <div class="mt-5">
            <button
              @click="handleClaim"
              :disabled="claiming"
              :class="['button', 'is-dark', 'is-fullwidth', 'is-medium', { 'is-loading': claiming }]"
              style="border-radius: 8px;"
            >
              Claim $10 Credits
            </button>
          </div>
        </template>

        <!-- Type: Invitation -->
        <template v-else-if="type === 'invitation'">
          <h2 class="title is-3 mb-3">Welcome to Nosana!</h2>
          <p class="subtitle is-6 has-text-grey mb-5" v-if="invitation">
            You've been invited to claim <strong class="has-text-success">${{ (invitation.creditsAmount / 1000).toFixed(2) }}</strong> in credits to start deploying.
          </p>
          <div class="mt-5">
            <button
              @click="handleClaim"
              :disabled="claiming"
              :class="['button', 'is-dark', 'is-fullwidth', 'is-medium', { 'is-loading': claiming }]"
              style="border-radius: 8px;"
            >
              Claim Invitation
            </button>
          </div>
        </template>

        <div class="mt-4" v-if="!claiming">
          <a @click="closeModal" class="has-text-grey-light is-size-7 is-clickable is-block">
            Maybe later
          </a>
        </div>
      </div>
    </div>
    <button class="modal-close is-large" aria-label="close" @click="closeModal"></button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useToast } from "vue-toastification";
import { trackEvent } from "~/utils/analytics";

interface Invitation {
  creditsAmount: number;
}

const props = defineProps<{
  modelValue: boolean;
  type: 'manual' | 'grant' | 'invitation';
  invitation?: Invitation | null;
  token?: string;
}>();

const emit = defineEmits(['update:modelValue', 'claimed']);

const config = useRuntimeConfig().public;
const { token: authToken, data: userData } = useAuth();
const toast = useToast();
const claiming = ref(false);
const claimCode = ref("");

const closeModal = () => {
  if (!claiming.value) {
    emit('update:modelValue', false);
  }
};

const handleClaim = async () => {
  if (!authToken.value) return;
  
  claiming.value = true;
  try {
    let url = "";
    let method = "POST";
    let body = {};

    if (props.type === 'manual') {
      url = `${config.apiBase}/api/credits/claim`;
      body = { code: claimCode.value.trim() };
    } else if (props.type === 'grant') {
      url = `${config.apiBase}/api/credits/request`;
    } else if (props.type === 'invitation') {
      url = `${config.apiBase}/api/credits/invitations/${props.token}/claim`;
    }

    const response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authToken.value as string,
      },
      body: Object.keys(body).length ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    
    if (response.ok) {
      toast.success(`Successfully claimed $${data.amount} in credits!`);
      emit('claimed', data.amount);
      emit('update:modelValue', false);
      
      trackEvent('credit_claimed', {
        amount: data.amount,
        type: props.type,
        user_id: userData.value?.generatedAddress,
      });
    } else {
      toast.error(data.message || "Failed to claim credits");
    }
  } catch (err) {
    console.error('Error claiming credits:', err);
    toast.error('Failed to claim credits');
  } finally {
    claiming.value = false;
  }
};
</script>
