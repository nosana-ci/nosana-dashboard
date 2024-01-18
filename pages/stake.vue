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
            <StakingForm />
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