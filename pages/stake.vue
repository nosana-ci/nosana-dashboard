<template>
  <div>
    <div class="is-flex is-justify-content-space-between mb-5">
      <div>
        <h2 class="title">Earn by staking</h2>
        <h3 class="subtitle mb-2">Stake NOS and receive rewards</h3>
      </div>
      <ClientOnly>
        <wallet-multi-button :dark="$colorMode.value === 'dark'"></wallet-multi-button>
      </ClientOnly>
    </div>

    <div class="columns is-multiline">
      <div class="column is-12 is-6-widescreen">
        <div class="box has-background-white-ter">
          <StakingForm />
        </div>
        <!-- <div class="box has-background-white-ter">
          <StakingLeaderboard />
        </div> -->
      </div>
      <div class="column is-12 is-6-widescreen">
        <StakingTestgrid />
        <div class="box has-background-white-ter">
          <StakingStats />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { WalletMultiButton } from "solana-wallets-vue";
</script>