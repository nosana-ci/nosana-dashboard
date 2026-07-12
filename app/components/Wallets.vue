<template>
  <div>
    <div v-if="!connected">
      <SolanaWalletButton />
    </div>
    <div v-else-if="account">
      {{ account.address }}
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
import { SolanaWalletButton, useWallet } from "@nosana/solana-vue";

const { account, connected, disconnect } = useWallet();
</script>
