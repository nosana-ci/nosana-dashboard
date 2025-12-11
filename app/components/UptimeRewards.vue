<template>
  <div class="mt-5">
    <div class="is-flex is-align-items-center mb-3">
      <h4 class="subtitle is-6 mb-0">Uptime Rewards</h4>
      <span
        class="has-tooltip-arrow ml-2"
        data-tooltip="Earn NOS tokens for keeping your node online and available 24/7. These rewards are separate from job execution earnings."
      >
        <InfoIcon
          style="height: 0.8rem; vertical-align: middle"
          alt="Info"
        />
      </span>
    </div>

    <div class="columns mt-4">
      <div class="column is-6">
        <div class="box mb-0">
          <div class="has-text-centered">
            <p class="heading mb-2">Available to Claim</p>
            <div class="mb-4">
              <p class="title is-3 mb-1" v-if="!loadingNodeSpecs">
                {{ claimableRewards.toFixed(6) }}
                <span class="has-text-grey-dark is-size-6">NOS</span>
              </p>
              <p class="title is-3 has-text-grey mb-1" v-else>
                - <span class="has-text-grey-dark is-size-6">NOS</span>
              </p>
            </div>

            <button
              class="button is-success is-fullwidth"
              :class="{ 'is-loading': claimingRewards }"
              :disabled="claimingRewards || !connected || claimableRewards <= 0"
              @click="claimRewards"
            >
              <span>{{
                claimingRewards ? "Claiming..." : "Claim Rewards"
              }}</span>
            </button>
          </div>
        </div>

        <!-- New Box for Total Claimed Rewards -->
        <div class="box mt-0">
          <div class="has-text-centered">
            <p class="heading mb-2">Total Claimed</p>
            <div class="mb-0">
              <!-- Adjusted margin for consistency if no button -->
              <p class="title is-3 mb-1" v-if="!loadingNodeSpecs">
                {{ totalClaimedRewards.toFixed(6) }}
                <span class="has-text-grey-dark is-size-6">NOS</span>
              </p>
              <p class="title is-3 has-text-grey mb-1" v-else>
                - <span class="has-text-grey-dark is-size-6">NOS</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="column is-6">
        <div class="box">
          <div
            class="content is-flex is-flex-direction-column is-align-items-center"
          >
            <h4 class="title is-6 mb-3 has-text-centered">How It Works</h4>

            <div class="uptime-steps">
              <div class="step-item mb-3">
                <span class="step-number">1</span>
                <span class="step-text"
                  >Keep your node online and responsive</span
                >
              </div>
              <div class="step-item mb-3">
                <span class="step-number">2</span>
                <span class="step-text"
                  >Accumulate uptime rewards automatically</span
                >
              </div>
              <div class="step-item">
                <span class="step-number">3</span>
                <span class="step-text"
                  >Claim your earned NOS tokens anytime. Rewards are updated
                  daily.</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { MessageSignerWalletAdapter } from "@solana/wallet-adapter-base";
import { useToast } from "vue-toastification";
import InfoIcon from '@/assets/img/icons/info.svg?component';

// Props
interface Props {
  nodeSpecs: any;
  loadingNodeSpecs: boolean;
  connected: boolean;
  publicKey: any;
  wallet: any;
}

// Emits
interface Emits {
  (e: "refresh-node-specs"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const toast = useToast();
const config = useRuntimeConfig().public;

const createAuthHeader = async (message: string): Promise<string> => {
  if (!props.connected || !props.publicKey || !props.wallet) {
    throw new Error("Wallet not connected or not found");
  }

  const adapter = props.wallet.adapter as MessageSignerWalletAdapter;
  if (!adapter.signMessage) {
    throw new Error("Wallet does not support message signing");
  }

  const encodedMessage = new TextEncoder().encode(message);
  const signedMessage = await adapter.signMessage(encodedMessage);

  // Convert to base64 format expected by backend
  const base64Signature = Buffer.from(signedMessage).toString("base64");

  return `${props.publicKey.toString()}:${base64Signature}`;
};

// Uptime rewards logic
const claimingRewards = ref(false);
const claimableRewards = computed(() => {
  return props.nodeSpecs?.claimableUptimeNosRewards || 0;
});

const totalClaimedRewards = computed(() => {
  return props.nodeSpecs?.totalClaimedUptimeNosRewards || 0;
});

const showClaimRewards = computed(() => {
  return claimableRewards.value > 0;
});

const claimRewards = async () => {
  if (!props.connected || !props.publicKey) {
    toast.error("Please connect your wallet");
    return;
  }

  claimingRewards.value = true;

  try {
    const authHeader = await createAuthHeader("Hello Nosana Node!");

    const response = (await $fetch(`${config.apiBase}/api/nodes/payment`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    })) as {
      message: string;
      success: boolean;
      claimableAmount: number;
      transactionSignature?: string;
    };

    if (response.success) {
      toast.success(
        `Successfully claimed ${response.claimableAmount.toFixed(6)} NOS!`
      );

      // Show transaction link if provided
      if (response.transactionSignature) {
        const explorerUrl = `https://solscan.io/tx/${response.transactionSignature}`;
        toast.success(`Transaction: ${response.transactionSignature}`, {
          onClick: () => window.open(explorerUrl, "_blank"),
          timeout: 10000,
        });
      }

      emit("refresh-node-specs");
    } else {
      toast.error(response.message || "Failed to claim rewards");
    }
  } catch (error: any) {
    console.error("Error claiming rewards:", error);
    const errorMessage =
      error?.data?.message || error?.message || "Failed to claim rewards";
    toast.error(errorMessage);
  } finally {
    claimingRewards.value = false;
  }
};
</script>

<style scoped>
.heading {
  text-transform: uppercase;
  font-size: 0.8rem;
  font-weight: 600;
  color: #7a7a7a;
  margin-bottom: 0.5rem;
}

.uptime-steps {
  margin-top: 1rem;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.step-number {
  background: linear-gradient(135deg, #3273dc 0%, #2366d1 100%);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.step-text {
  color: #4a4a4a;
  font-size: 0.9rem;
  line-height: 1.4;
}
</style>
