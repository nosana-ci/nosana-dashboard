<template>
  <div>
    <div class="is-flex is-justify-content-space-between mb-5">
      <div>
        <h2 class="title">Earn by staking</h2>
        <h3 class="subtitle">Stake NOS and receive rewards</h3>
      </div>
      <ClientOnly>
        <wallet-multi-button></wallet-multi-button>
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
            <div class="field column is-8">
              <div>
                <label class="label">Add NOS:</label>
                <div class="control is-flex">
                  <input class="input" required min="1" step="0.1" type="number" placeholder="0">
                  <span class="mt-2 ml-2 has-text-grey">NOS</span>
                </div>
              </div>
            </div>
            <button class="button is-fullwidth is-primary is-large">Connect Wallet</button>
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
import { WalletMultiButton } from "solana-wallets-vue";
</script>