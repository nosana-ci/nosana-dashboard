<template>
  <div class="tabs is-fullwidth is-size-5">
    <ul>
      <li :class="{ 'is-active': tab === 'stake' }"><a @click="tab = 'stake'"
          class="is-justify-content-flex-start">STAKE</a></li>
      <li :class="{ 'is-active': tab === 'unstake' }"><a @click="tab = 'unstake'" class="is-justify-content-flex-start"
          :class="{ 'is-didsabled': !stakedNos }">UNSTAKE</a></li>
    </ul>
  </div>
  <form @submit.prevent="stake">
    <div class="field">
      <label class="label">Add NOS:</label>
      <div class="control columns is-variable is-5 mb-5 is-multiline">
        <div class="is-flex is-align-items-center column" style="min-width: 200px">
          <input class="input" v-model="amount" required min="1" :max="balance" step="0.1" type="number" placeholder="0">
          <span class="ml-2 has-text-grey">NOS</span>
        </div>
        <div class="column is-narrow">
          <div class="buttons is-centered">
            <a class="button is-primary is-outlined mr-2" @click="amount = parseInt((balance / 2))">
              HALF
            </a>
            <a class="button is-primary is-outlined" @click="amount = parseInt(balance)">
              MAX
            </a>
          </div>
        </div>
      </div>
    </div>
    <div class="field">
      <label class="label">Unstake period of:</label>
      <div class="control columns is-variable is-5 mb-5 is-multiline">
        <div class="is-flex is-align-items-center column is-narrow">
          <input v-model="unstakeDays" required class="input has-text-centered" type="number" :min="14" step="0.1"
            :max="365" placeholder="0">
          <span class="ml-2 has-text-grey">Days</span>
        </div>
      </div>
    </div>
    <ClientOnly>
      <wallet-modal-provider v-if="!connected" :dark="$colorMode.value === 'dark'">
        <template #default="modalScope">
          <a class="button is-fullwidth is-primary is-large" @click="modalScope.openModal()">
            Connect Wallet
          </a>
        </template>
      </wallet-modal-provider>
      <button v-else class="button is-fullwidth is-primary is-large" type="submit">
        Stake NOS
      </button>
    </ClientOnly>
  </form>
</template>

<script lang="ts" setup>
import { WalletModalProvider, useWallet } from "solana-wallets-vue";
const { connected } = useWallet();
const balance: Ref<boolean | null> = ref(null);
const amount: Ref<number | null> = ref(null);
const unstakeDays: Ref<number | null> = ref(14);
const stakedNos: Ref<number | null> = ref(null);
const tab: Ref<string> = ref('stake');

const stake = () => {
  alert('stake');
}
</script>