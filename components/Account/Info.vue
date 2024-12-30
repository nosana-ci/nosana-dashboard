<template>
  <div>
    <div v-if="publicKey">
      <table class="table is-fullwidth">
        <tbody>
          <tr>
            <td colspan="2" class="has-background-light">
              <h4 class="title is-5 mb-0">General</h4>
            </td>
          </tr>
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
        Loading..
      </div>
      <div v-else class="notification is-danger">
        Account {{ address }} not found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PublicKey } from "@solana/web3.js";

interface Props {
  address: string;
}
const props = defineProps<Props>();

interface NodeRanking {
  node: string;
  performanceRank: number;
  stabilityRank: number;
  participationRate: number;
}

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
      solBalance.value = await nosana.value.solana.getSolBalance(publicKey.value);
      try {
        nosStaked.value = await nosana.value.stake.get(publicKey.value);
      } catch (error) {
        console.error("cant fetch stake", error);
      }
    } catch (e) {
      console.error("cant get balance", e);
    }
  } catch (error) {
    console.error("not a valid address", error);
    publicKey.value = null;
  }
  loading.value = false;
}

checkAddressAndBalance();
</script>
