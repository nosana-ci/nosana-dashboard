<template>
  <template v-if="publicKey">
    <!-- Account -->
    <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">Account</span>
        <span class="quick-detail-value account-address">{{ publicKey }}</span>
      </div>
    </div>

    <!-- NOS Balance -->
    <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">NOS Balance</span>
        <span class="quick-detail-value">
          <span v-if="balance">{{ balance.uiAmount.toFixed(4) }} NOS</span>
          <span v-else-if="loading">...</span>
          <span v-else>-</span>
        </span>
      </div>
    </div>

    <!-- NOS Staked -->
    <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">NOS Staked</span>
        <span class="quick-detail-value">
          <span v-if="nosStaked && nosStaked.amount && !parseInt(nosStaked.timeUnstake)">
            {{ (nosStaked.amount / 1e6).toFixed(4) }} NOS
          </span>
          <span v-else-if="loading">...</span>
          <span v-else>-</span>
        </span>
      </div>
    </div>

    <!-- SOL Balance -->
    <div class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">SOL Balance</span>
        <span class="quick-detail-value">
          <span v-if="solBalance">{{ (solBalance / 1e9).toFixed(4) }} SOL</span>
          <span v-else-if="loading">...</span>
          <span v-else>-</span>
        </span>
      </div>
    </div>

    <!-- Solana Address - hide in job context since it's already shown in header -->
    <div v-if="!props.showInJobContext" class="column is-one-fifth is-full-mobile no-padding" style="min-width: 220px; margin-bottom: 0.75rem;">
      <div class="quick-detail-item">
        <span class="quick-detail-label">Solana Address</span>
        <span class="quick-detail-value">
          <a :href="`https://solscan.io/account/${props.address}`" target="_blank" class="address is-family-monospace">
            {{ props.address }}
          </a>
        </span>
      </div>
    </div>
  </template>
  <template v-else>
    <div class="column is-full">
      <div v-if="loading">Loading account details...</div>
      <div v-else class="notification is-danger">
        Account {{ address }} not found or failed to load.
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { PublicKey } from "@solana/web3.js";

interface Props {
  address: string;
  showInJobContext?: boolean;
}
const props = defineProps<Props>();

const { nosana } = useSDK();

const publicKey = ref<string | null>(null);
const balance = ref<any | null>(null);
const solBalance = ref<any | null>(null);
const nosStaked = ref<any | null>(null);
const loading: Ref<boolean> = ref(false);

const checkAddressAndBalance = async () => {
  loading.value = true;
  try {
    const pk = new PublicKey(props.address);
    publicKey.value = pk.toString();

    try {
      balance.value = await nosana.value.solana.getNosBalance(publicKey.value);
      solBalance.value = await nosana.value.solana.getSolBalance(
        publicKey.value
      );
      try {
        nosStaked.value = await nosana.value.stake.get(publicKey.value);
      } catch (error) {
        // Account has no stake, this is normal - set to null silently
        nosStaked.value = null;
      }
    } catch (e) {
      console.error("cant get balance", e);
    }
  } catch (error) {
    console.error("not a valid address", error);
    publicKey.value = null;
  }
  loading.value = false;
};

checkAddressAndBalance();
</script>

<style lang="scss" scoped>
.account-address {
  word-break: break-all;
  white-space: normal; // Allows wrapping
  display: inline-block; // Needed for word-break to work well with wrapping
  line-height: 1.3; // Adjust for better readability if text wraps
}

.quick-detail-item {
  padding: 0.2rem 0.5rem; // Added some horizontal padding
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  height: 100%;

  .quick-detail-label {
    font-size: 0.7rem; // Slightly smaller for conciseness
    font-weight: 600;
    color: #7a7a7a;
    text-transform: uppercase;
    margin-bottom: 0.1rem; // Small space
  }

  .quick-detail-value {
    font-size: 0.85rem; // Slightly smaller
    font-weight: 500;
    color: #363636;
    word-break: break-word;

    .icon-text {
      color: #363636;
    }
  }
}

.no-padding {
  padding: 0 !important;
}

// Ensure columns in this specific context have some breathing room if they wrap
.columns.is-multiline .column.no-padding {
   // margin-bottom: 0.75rem; // Spacing for items when they wrap
}


html.dark-mode {
  .quick-detail-item {
    .quick-detail-label {
      color: #b0b0b0;
    }

    .quick-detail-value,
    .quick-detail-value .icon-text {
      color: #ffffff;
    }
    
    .quick-detail-value a,
    .quick-detail-value nuxt-link {
      color: #10E80C !important; // Nosana green for links in dark mode
    }
    
    .quick-detail-value a:hover,
    .quick-detail-value nuxt-link:hover {
      color: #33ff33 !important; // Lighter green on hover
    }
  }
  .account-address {
    color: #ffffff;
  }
}
</style>
