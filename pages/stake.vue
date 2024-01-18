<template>
  <div>
    <div class="is-flex is-justify-content-space-between mb-5">
      <div>
        <h2 class="title">Earn by staking</h2>
        <h3 class="subtitle">Stake NOS and receive rewards</h3>
      </div>
      <ClientOnly>
        <wallet-multi-button :dark="$colorMode.value === 'dark'"></wallet-multi-button>
      </ClientOnly>
    </div>

    <div class="columns">
      <div class="column is-6">
        <div class="box has-background-white-ter">
          <div class="box">
            <div class="tabs is-fullwidth is-size-5">
              <ul>
                <li class="is-active"><a class="is-justify-content-flex-start">STAKE</a></li>
                <li><a class="is-justify-content-flex-start">UNSTAKE</a></li>
              </ul>
            </div>
            <form @submit.prevent="stake">
              <div class="field">
                <label class="label">Add NOS:</label>
                <div class="control columns is-variable is-5 mb-5 is-multiline">
                  <div class="is-flex is-align-items-center column" style="min-width: 200px">
                    <input class="input" v-model="amount" required min="1" :max="balance" step="0.1" type="number"
                      placeholder="0">
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
                    <input v-model="unstakeDays" required class="input has-text-centered" type="number" :min="14"
                      step="0.1" :max="365" placeholder="0">
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
          </div>
          <div class="box">
            test
          </div>
        </div>
      </div>
      <div class="column is-6">
        <div class="box has-background-white-ter">
          <div class="box">
            test
          </div>
          <div class="box">
            test
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { WalletMultiButton, WalletModalProvider, useWallet } from "solana-wallets-vue";
const { connected } = useWallet();
const balance = ref(null);
const amount = ref(null);
const unstakeDays = ref(14);
const stake = () => {
  alert('stake');
}
</script>