<template>
  <div>
    <TopBar
      :title="'Staking'"
      :subtitle="'Stake NOS and earn rewards'"
      ref="topBar"
      v-model="showSettingsModal"
    />
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
