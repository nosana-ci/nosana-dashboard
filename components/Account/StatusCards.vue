<template>
  <div class="columns is-multiline mb-4">
    <div class="column is-3">
      <div class="box has-text-centered">
        <p class="heading">Deployments</p>
        <p class="title is-flex is-align-items-center is-justify-content-center">
          <slot name="deployments-icon" />
          {{ totalDeployments }}
        </p>
      </div>
    </div>
    <div class="column is-3">
      <div class="box has-text-centered">
        <p class="heading">NOS Balance</p>
        <p class="title" v-if="balance && nosPrice">
          {{ balance.uiAmount.toFixed(2) }} NOS
          <span class="has-text-grey is-size-6">(${{ (balance.uiAmount * nosPrice).toFixed(2) }})</span>
        </p>
        <p class="title" v-else>-</p>
      </div>
    </div>
    <div v-if="nosStaked && nosStaked.amount > 0" class="column is-3">
      <div class="box has-text-centered">
        <p class="heading">NOS Staked</p>
        <p class="title is-flex is-align-items-center is-justify-content-center">
          <span v-if="nosStaked && nosStaked.amount >= 0">
            {{ (nosStaked.amount / 1e6).toFixed(2) }} NOS
          </span>
          <span v-else>-</span>
          <slot name="stake-link" />
        </p>
      </div>
    </div>
    <div v-if="pendingRewards > 0" class="column is-3">
      <div class="box has-text-centered">
        <p class="heading">Pending Rewards</p>
        <p class="title is-flex is-align-items-center is-justify-content-center">
          {{ pendingRewards.toFixed(2) }} NOS
          <button @click="$emit('claim-rewards')" class="ml-2 button is-small is-primary" :class="{ 'is-loading': claimingRewards }">
            Claim
          </button>
        </p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps({
  totalDeployments: Number,
  balance: Object,
  nosPrice: Number,
  nosStaked: Object,
  pendingRewards: Number,
  claimingRewards: Boolean
});
</script> 