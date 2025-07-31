<template>
  <div class="modal" :class="{ 'is-active': show }">
    <div class="modal-background" @click="closeModal"></div>
    <div class="modal-content" style="max-width: 360px; width: 100%">
      <div class="box has-text-centered">
        <logo width="140px" :animated="true" class="light-only my-2" />
        <logo width="140px" :white="true" class="dark-only" :animated="true" />

        <p class="is-size-4 mb-5">Connect Your Wallet</p>

        <div
          class="buttons is-flex is-flex-direction-column justify-content-center"
        >
          <button
            class="button is-black onboarding-button mb-3 is-fullwidth"
            @click="connectWallet"
            :disabled="!connected || connectingWallet"
          >
            {{ connectingWallet ? "Connecting..." : "Connect Wallet" }}
          </button>

          <p style="cursor: pointer;" class="mt-2 has-text-centered has-text-grey" @click="completeOnboarding">
            Skip this step <img src="@/assets/img/icons/arrow-right.svg" style="height: 8px; opacity: 0.7;" class="ml-1">
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet } from "solana-wallets-vue";
import { useToast } from "vue-toastification";
import type { MessageSignerWalletAdapter } from "@solana/wallet-adapter-base";

const config = useRuntimeConfig().public;
const { connected, publicKey, wallet } = useWallet();
const { getSession, token } = useAuth();
const toast = useToast();

const props = defineProps<{
  show: boolean | null | undefined;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
  "onboarding-progress": [value: boolean];
  onComplete: [];
}>();

const connectingWallet = ref(false);

const closeModal = () => {
  emit("update:show", false);
};

const connectWallet = async () => {
  if (!connected.value || !publicKey.value) {
    toast.error("Please connect your wallet first");
    return;
  }

  connectingWallet.value = true;
  const timestamp = Math.floor(+new Date() / 1000);

  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const currentWallet = wallet.value;
    if (!currentWallet || !currentWallet.adapter) {
      throw new Error("Wallet adapter not available");
    }

    const message = `nosana_${timestamp}`;
    const encodedMessage = new TextEncoder().encode(message);
    const adapter = currentWallet.adapter as MessageSignerWalletAdapter;

    if (!adapter.connected) {
      throw new Error(
        "Wallet is not connected. Please try reconnecting your wallet."
      );
    }

    const signedMessage = await adapter.signMessage(encodedMessage);
    const signature = { type: "Buffer", data: Object.values(signedMessage) };

    const response = await fetch(
      `${config.apiBase}/api/auth/add-solana-wallet`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: token.value as string,
        },
        body: JSON.stringify({
          signature,
          timestamp,
          address: publicKey.value?.toBuffer(),
          type: "client",
        }),
      }
    );

    if (response.status === 200) {
      toast.success("Successfully connected wallet");
      await getSession();
      completeOnboarding();
    } else {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Something went wrong, please try again"
      );
    }
  } catch (error: any) {
    console.error("Error connecting wallet:", error);
    if (error.message.includes("users_wallets_address_unique")) {
      toast.error('Wallet already connected to another account');
    } else {
      toast.error(error.message || "Error connecting wallet");
    }
  } finally {
    connectingWallet.value = false;
  }
};

const completeOnboarding = () => {
  emit("onboarding-progress", false);
  emit("onComplete");
  closeModal();
};
</script>

<style lang="scss" scoped>
.onboarding-button {
  height: 48px !important;
  width: 100%;
  font-weight: 500;
  letter-spacing: 0.25px;
  border: 1px solid #747775;
  transition: all 0.218s;
  position: relative;
  overflow: hidden;

  &:disabled {
    cursor: default;
  }
}

// Dark mode support
.dark-mode {
  .onboarding-button {
    &:not(:disabled) {
      &:hover {
        background-color: lighten($black, 10%) !important;
      }
    }
  }
}
</style>
