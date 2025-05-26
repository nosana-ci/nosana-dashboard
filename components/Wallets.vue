<template>
  <div>
    <div v-if="!connected">
      <wallet-multi-button></wallet-multi-button>
      <button @click="refreshWallets" class="button is-small is-outlined" style="margin-left: 10px;">
        Refresh Wallets
      </button>
    </div>
    <div v-else-if="publicKey">
      {{ publicKey }}
      <p>
        <button @click="disconnect" class="button is-danger">Disconnect</button>
      </p>
    </div>
    <div v-else>
      Could not find public key. Disconnect and try again
      <p>
        <button @click="disconnect" class="button is-danger">Disconnect</button>
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { WalletMultiButton } from "solana-wallets-vue";
import { useWallet } from "solana-wallets-vue";
const { publicKey, connected, disconnect, select } = useWallet();

const refreshWallets = () => {
  // Force refresh by re-selecting current wallet or triggering a re-check
  window.location.reload();
};
</script>