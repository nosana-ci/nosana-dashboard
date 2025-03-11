<template>
  <div class="box">
    <div v-if="publicKey">
      <h3 class="title is-4 mb-4">General Information</h3>
      <table class="table is-fullwidth">
        <tbody>
          <tr>
            <td>Account</td>
            <td><span class="address">{{ publicKey }}</span></td>
          </tr>
          <tr>
            <td>NOS Balance</td>
            <td>
              <span v-if="balance">{{ balance.uiAmount.toFixed(4) }} NOS</span>
              <span v-else-if="loading">...</span>
              <span v-else>-</span>
            </td>
          </tr>
          <tr>
            <td>NOS Staked</td>
            <td>
              <span v-if="nosStaked && nosStaked.amount">{{ (nosStaked.amount / 1e6).toFixed(4) }} NOS</span>
              <span v-else-if="loading">...</span>
              <span v-else>-</span>
            </td>
          </tr>
          <tr>
            <td>SOL Balance</td>
            <td>
              <span v-if="solBalance">{{ (solBalance / 1e9).toFixed(4) }} SOL</span>
              <span v-else-if="loading">...</span>
              <span v-else>-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <div v-if="loading">
        Loading...
      </div>
      <div v-else class="notification is-danger">
        Account not found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PublicKey } from "@solana/web3.js";
import type { Ref } from 'vue';
import { useWallet } from 'solana-wallets-vue';

const { nosana } = useSDK();
const { publicKey: walletPublicKey } = useWallet();

const publicKey = ref<string | null>(null);
const balance = ref<any | null>(null);
const solBalance = ref<any | null>(null);
const nosStaked = ref<any | null>(null);
const loading: Ref<boolean> = ref(false);

const checkAddressAndBalance = async () => {
  loading.value = true;
  try {
    if (!walletPublicKey.value) throw new Error("No wallet connected");
    
    publicKey.value = walletPublicKey.value.toString();

    try {
      balance.value = await nosana.value.solana.getNosBalance(publicKey.value);
      solBalance.value = await nosana.value.solana.getSolBalance(publicKey.value);
      try {
        nosStaked.value = await nosana.value.stake.get(publicKey.value);
      } catch (error) {
        // Account has no stake, this is normal - set to null silently
        nosStaked.value = null;
      }
    } catch (e) {
      console.error("Cannot get balance", e);
    }
  } catch (error) {
    console.error("Not a valid address", error);
    publicKey.value = null;
  }
  loading.value = false;
}

onMounted(() => {
  checkAddressAndBalance();
});

watch(() => walletPublicKey.value, () => {
  checkAddressAndBalance();
});
</script>

<style scoped>
.address {
  font-family: monospace;
}
</style> 