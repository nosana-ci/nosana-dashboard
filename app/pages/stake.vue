<template>
  <div>
    <TopBar :title="'Staking'" :subtitle="'Stake NOS and earn rewards'" ref="topBar" v-model="showSettingsModal" />
    <div class="notification is-warning is-light">
      <p>
        <strong>Notice:</strong>
        There is an active Nosana Network Proposal (NNP-0001) to better retarget emissions for rewards. If it passes,
        passive staking rewards
        will sunset over a 12-month period. Read more
        <a href="https://github.com/nosana-ci/network-proposals/blob/main/nnp/NNP-0001-tokenomics.md" target="_blank"
          rel="noopener">here</a>.
      </p>
    </div>
    <div class="columns is-multiline">
      <div class="column is-12 is-6-widescreen">
        <div class="box has-background-white-ter">
          <StakingForm />
        </div>
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
const showSettingsModal = ref(false);
</script>
