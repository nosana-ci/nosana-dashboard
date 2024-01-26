<template>
  <div class="box has-text-centered">
    <label class="label is-uppercase has-text-black is-size-3">Your Pending NOS rewards</label>
    <div class="is-size-1 has-text-black">
      <CustomCountUp v-if="pendingRewards !== null" :end-val="pendingRewards" :decimal-places="4" :duration="1.5">
      </CustomCountUp>
      <span v-else>-</span>
    </div>
    <div class="column is-12">
      <button class="button mt-2 is-fullwidth is-primary is-large" @click.prevent="claimAndRestakeRewards()"
        :class="{ 'is-loading': loading }">
        Restake
      </button>
      <button class="button mt-2 is-fullwidth is-primary is-large is-outlined" @click.prevent="claimRewards()"
        :class="{ 'is-loading': loading }">
        Claim your rewards
      </button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useWallet } from "solana-wallets-vue";
import * as BN from 'bn.js';
const timestamp = useTimestamp({ interval: 1000 })

const { publicKey } = useWallet();
const { nosana } = useSDK();
const SECONDS_PER_DAY = 24 * 60 * 60;

const loading: Ref<boolean> = ref(false);
const unstakeDays: Ref<number> = ref(14);

const { data: activeStake, pending: loadingStake, error: errorStake, refresh: refreshStake } =
  await useMyAsyncData('getStake',
    async () => {
      errorStake.value = null;
      if (publicKey.value) {
        try {
          const stakeData = await nosana.value.stake.get(publicKey.value);
          unstakeDays.value = stakeData.duration / SECONDS_PER_DAY;
          return stakeData;
        } catch (error: any) {
          if (!error.message.includes('Account does not exist')) {
            throw error;
          }
        }
      }
    }, {
    watch: [publicKey]
  });

const { data: balance, pending: loadingBalance, error: errorBalance, refresh: refreshBalance } =
  await useMyAsyncData('getBalance',
    async () => {
      errorBalance.value = null;
      if (publicKey.value) {
        const nos = await nosana.value.solana.getNosBalance(publicKey.value)
        return nos ? Number(nos.uiAmount) : 0;
      }
      return null;
    }, {
    watch: [publicKey]
  });

const pendingRewards: ComputedRef<number | null> = computed(() => {
  if (rewardsInfo.value && rewardsInfo.value.account && poolInfo.value) {
    let rate = rewardsInfo.value.global.rate;
    const secondsBetween = (timestamp.value / 1000) - parseInt(poolInfo.value.startTime);
    const fees =
      new BN(
        Math.max(secondsBetween, 0) * parseInt(poolInfo.value.emission) -
        parseInt(poolInfo.value.claimedTokens)
      );
    const newTotalXnos = rewardsInfo.value.global.totalXnos.add(fees);
    if (poolInfo.value.poolBalance > 0) {
      rate = new BN(rewardsInfo.value.global.totalReflection / newTotalXnos);
    }
    const reward = (rewardsInfo.value.account.reflection / rate) -
      rewardsInfo.value.account.xnos;
    return +(reward / 1e6).toFixed(4);
  }
  return null;
})

const claimRewards = async () => {
  loading.value = true;
  try {
    const claim = await nosana.value.stake.claimRewards();
    await refreshStake();
    await refreshBalance();
    console.log('claim', claim);
  } catch (e) {
    console.error('cant claim rewards', e);
  }
  loading.value = false;
}

const claimAndRestakeRewards = async () => {
  loading.value = true;
  try {
    const claim = await nosana.value.stake.claimAndRestakeRewards(pendingRewards.value as number);
    await refreshStake();
    await refreshBalance();
    console.log('claim & restake', claim);
  } catch (e) {
    console.error('cant cant claim & restake', e);
  }
  loading.value = false;
}

const { data: rewardsInfo, pending: loadingRewardsInfo, error: errorRewardsInfo, refresh: refreshRewardsInfo } =
  await useMyAsyncData('getRewardsInfo',
    async () => nosana.value.stake.getRewardsInfo(), {
    watch: [activeStake]
  });
const { data: poolInfo, pending: loadingPoolInfo, error: errorPoolInfo, refresh: refreshPoolInfo } =
  await useMyAsyncData('getPoolInfo',
    async () => {
      errorPoolInfo.value = null;
      return nosana.value.stake.getPoolInfo()
    }, {
    watch: [activeStake]
  });

</script>
