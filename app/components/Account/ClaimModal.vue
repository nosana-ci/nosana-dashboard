<template>
  <div class="modal" :class="{ 'is-active': modelValue }">
    <div class="modal-background" @click="closeModal"></div>
    <div class="modal-content" style="max-width: 450px; width: 100%">
      <div class="box has-text-centered p-6" style="border-radius: 16px;">
        <!-- Type: Manual Code -->
        <template v-if="type === 'manual'">
          <h3 class="title is-4 mb-2">Redeem Code</h3>
          <p class="subtitle is-6 has-text-grey mb-5">
            {{ claimedSuccessfully ? 'Your credits have been added to your balance.' : 'Enter your voucher code to add credits to your balance.' }}
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
                style="border-radius: 8px;"
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
              style="border-radius: 8px;"
            >
              Redeem Credits
            </button>
            <nuxt-link
              v-else
              to="/deployments/create"
              class="button is-dark is-fullwidth is-medium"
              style="border-radius: 8px;"
              @click="closeModal"
            >
              Start Deploying
            </nuxt-link>
          </div>
        </template>

        <!-- Type: Automatic Grant -->
        <template v-else-if="type === 'grant'">
          <h1 class="title is-3 mb-3">{{ claimedSuccessfully ? 'Credits Added' : 'Your Credits Are Ready' }}</h1>
          <p class="subtitle is-6 has-text-grey mb-5">
            <template v-if="claimedSuccessfully">
              <strong class="has-text-success">$10</strong> in compute credits have been added to your account.
            </template>
            <template v-else>
              You can now add <strong class="has-text-success">$10</strong> in compute credits to your account.
            </template>
          </p>
          <div class="mt-5">
            <button
              v-if="!claimedSuccessfully"
              @click="handleClaim"
              :disabled="claiming"
              class="button is-dark is-fullwidth is-medium"
              :class="{ 'is-loading': claiming }"
              style="border-radius: 8px;"
            >
              Claim $10 Credits
            </button>
            <nuxt-link
              v-else
              to="/deployments/create"
              class="button is-dark is-fullwidth is-medium"
              style="border-radius: 8px;"
              @click="closeModal"
            >
              Start Deploying
            </nuxt-link>
          </div>
        </template>

        <!-- Type: Invitation -->
        <template v-else-if="type === 'invitation'">
          <h2 class="title is-3 mb-3">Welcome to Nosana!</h2>
          <p class="subtitle is-6 has-text-grey mb-5" v-if="invitation">
            {{ claimedSuccessfully ? 'Your invitation credits have been claimed.' : `You've been invited to claim $${(invitation.creditsAmount / 1000).toFixed(2)} in credits to start deploying.` }}
          </p>
          <div class="mt-5">
            <button
              v-if="!claimedSuccessfully"
              @click="handleClaim"
              :disabled="claiming"
              class="button is-dark is-fullwidth is-medium"
              :class="{ 'is-loading': claiming }"
              style="border-radius: 8px;"
            >
              Claim Invitation
            </button>
            <nuxt-link
              v-else
              to="/deployments/create"
              class="button is-dark is-fullwidth is-medium"
              style="border-radius: 8px;"
              @click="closeModal"
            >
              Start Deploying
            </nuxt-link>
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
const claimedSuccessfully = ref(false);
const claimCode = ref("");

const closeModal = () => {
  if (!claiming.value) {
    emit('update:modelValue', false);
    // Reset state after a small delay so it doesn't flicker while closing
    setTimeout(() => {
      claimedSuccessfully.value = false;
      claimCode.value = "";
    }, 300);
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
      url = `${config.backend_url}/api/credits/claim`;
      body = { code: claimCode.value.trim() };
    } else if (props.type === 'grant') {
      url = `${config.backend_url}/api/credits/request`;
    } else if (props.type === 'invitation') {
      url = `${config.backend_url}/api/credits/invitations/${props.token}/claim`;
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
      claimedSuccessfully.value = true;
      emit('claimed', data.amount);
      
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
