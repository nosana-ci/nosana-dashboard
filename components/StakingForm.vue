<template>
  <form @submit.prevent="showStakeModal = true">
    <div class="box">
      <div class="tabs is-fullwidth is-size-5">
        <ul>
          <li
            :class="{'is-active': tab === 'stake', 'is-inactive' : activeStake && activeStake.stakeEndDate } "
          >
            <a @click="!activeStake || !stakeEndDate ? tab = 'stake' : null" class="is-justify-content-flex-start">STAKE</a>
          </li>
          <li 
            :class="{'is-active': tab === 'unstake' || activeStake && stakeEndDate, 'is-inactive' : !activeStake}"
          >
            <a @click="activeStake ? tab = 'unstake' : null" class="is-justify-content-flex-start" :class="{ 'is-disabled': !activeStake }">UNSTAKE</a>
          </li>
        </ul>
      </div>
      <div v-if="errorStake" class="has-text-danger">
        Error fetching data <a @click="refreshStake">retry</a>
        <p>{{ errorStake }}</p>
      </div>
      <div v-if="loadingStake">Loading...</div>
      <div v-if="tab === 'stake'">
        <div class="field" v-if="!activeStake">
          <label class="label">Add NOS:</label>
          <div class="control columns is-variable is-5 mb-5 is-multiline">
            <div class="is-flex is-align-items-center column" style="min-width: 200px">
              <input class="input is-medium" v-model="amount" required min="1" :max="balance" step="0.1" type="number"
                placeholder="0">
              <span class="ml-2 has-text-grey">NOS</span>
            </div>
            <div class="column is-narrow">
              <div class="buttons is-centered">
                <a class="button is-primary is-outlined mr-2" :disabled="balance === null ? true : null"
                  @click="balance !== null ? amount = parseInt((balance / 2)) : null">
                  HALF
                </a>
                <a class="button is-primary is-outlined" :disabled="balance === null ? true : null"
                  @click="balance !== null ? amount = balance : null">
                  MAX
                </a>
              </div>
            </div>
          </div>
        </div>
        <div class="field" v-if="!activeStake">
          <label class="label">Unstake period of:</label>
          <div class="control columns is-variable is-5 mb-5 is-multiline">
            <div class="is-flex is-align-items-center column is-narrow">
              <input v-model="unstakeDays" required class="input has-text-centered is-medium" type="number"
                :min="unstakeDays" step="1" :max="365" placeholder="0">
              <span class="ml-2 has-text-grey">Days</span>
            </div>
          </div>
        </div>
        <!-- Your stake block -->
        <div v-if="activeStake">
          <p class="has-text-black is-uppercase mb-4">Your stake</p>
          <div class="columns is-multiline">
            <div class="column is-4 mb-">
              <label class="label is-size-6 mb-0">NOS Staked</label>
              <div class="has-text-black is-size-3">
                {{ (activeStake.amount / 1e6).toFixed() }}
              </div>
            </div>
            <div class="column is-4">
              <label class="label mb-0">Multiplier</label>
              <div class="has-text-black is-size-3">
                <CustomCountUp :end-val="multiplier" :decimal-places="2">
                  <template #prefix>
                    <span>x</span>
                  </template>
                </CustomCountUp>
              </div>
            </div>
            <div class="column is-4">
              <label class="label mb-0">xNOS</label>
              <div class="has-text-black is-size-3">
                <CustomCountUp v-if="xNOS !== null" :end-val="xNOS">
                </CustomCountUp>
              </div>
            </div>
            <div class="column is-4">
              <label class="label mb-0">Unstake period of</label>
              <div class="has-text-black">
                <span class="is-size-3">{{ activeStake.duration / 60 / 60 / 24 }}</span> days
              </div>
            </div>
            <div class="column is-4">
              <label class="label mb-0">APY</label>
              <div class="has-text-black is-size-3">
                <CustomCountUp v-if="APY !== null" :end-val="APY" :decimal-places="1">
                  <template #suffix>
                    <span>%</span>
                  </template>
                </CustomCountUp>
              </div>
            </div>
            <div class="column is-4">
              <label class="label mb-0">Daily NOS rewards</label>
              <div class="has-text-black is-size-3">
                <CustomCountUp v-if="expectedRewards !== null" :end-val="(expectedRewards as number)"></CustomCountUp>
              </div>
            </div>
            <div class="column is-12">
              <button class="button is-fullwidth is-primary is-large" @click="alert('increase')">
                Increase Your Stake
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else-if="tab === 'unstake'">
        <div v-if="activeStake">
            <div class="has-text-centered has-limited-width-small is-horizontal-centered mb-6">
              <h3 class="has-text-centered title pt-3 is-4 has-text-weight-semibold">
                Unstake your tokens here.
              </h3>
              <p>
                Be aware that after you unstake,
                you will have to wait until your unstake period ends to claim your tokens<br><br>
                If you were to unstake now, you can claim your tokens on:
              </p>
              <h3 class="title is-5 mt-4">
                {{
                // current date + unstakedays 
                new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
                  .format(new Date().setDate(new Date().getDate() + parseInt(activeStake.duration / 60 / 60 / 24))) }}
              </h3>
            </div>
            <form @submit.prevent="unstake">
              <button
                type="submit"
                class="button is-fullwidth is-primary is-large is-outlined"
                :class="{ 'is-loading': loading }"
              >
                Unstake NOS
              </button>
            </form>
          </div>
      </div>
    </div>
    <div v-if="activeStake" class="box has-text-centered">
      <label class="label is-uppercase has-text-black is-size-3">Your Pending NOS rewards</label>
      <div class="is-size-1 has-text-black">
        <CustomCountUp v-if="pendingRewards !== null" :end-val="pendingRewards" :decimal-places="4" :duration="1.5">
        </CustomCountUp>
        <span v-else>-</span>
      </div>
      <div class="column is-12">
        <button class="button mt-2 is-fullwidth is-primary is-large" @click.prevent="claimAndRestakeRewards()" :class="{ 'is-loading': loading }">
          Restake
        </button>
        <button class="button mt-2 is-fullwidth is-primary is-large is-outlined" @click.prevent="claimRewards()" :class="{ 'is-loading': loading }">
          Claim your rewards
        </button>
      </div>
    </div>
    <div class="columns" v-if="!activeStake">
      <div class="column is-6">
        <div class="box">
          <label class="label">Expected daily NOS rewards</label>
          <div class="is-size-1 has-text-black">
            <CustomCountUp v-if="expectedRewards !== null" :end-val="(expectedRewards as number)"></CustomCountUp>
            <span v-else>-</span>
          </div>
        </div>
      </div>
      <div class="column is-6">
        <div class="box">
          <!-- <label class="label">Pending NOS rewards</label>
          <div class="is-size-1 has-text-black">
            <CustomCountUp v-if="pendingRewards !== null" :end-val="pendingRewards" :decimal-places="4" :duration="1.5">
            </CustomCountUp>
            <span v-else>-</span>
          </div> -->
          <label class="label">Staked NOS</label>
          <div class="is-size-1 has-text-black">
            <CustomCountUp v-if="amount !== null" :end-val="amount">
            </CustomCountUp>
            <span v-else>-</span>
          </div>
        </div>
      </div>
    </div>
    <div class="columns" v-if="!activeStake">
      <div class="column is-4">
        <div class="box">
          <label class="label">xNOS Score</label>
          <div class="is-size-2 has-text-black">
            <CustomCountUp v-if="xNOS !== null" :end-val="xNOS">
            </CustomCountUp>
            <span v-else>-</span>
          </div>
        </div>
      </div>
      <div class="column is-4">
        <div class="box">
          <label class="label">Multiplier</label>
          <div class="is-size-2 has-text-black">
            <CustomCountUp :end-val="multiplier" :decimal-places="2">
              <template #prefix>
                <span>x</span>
              </template>
            </CustomCountUp>
          </div>
        </div>
      </div>
      <div class="column is-4">
        <div class="box">
          <label class="label">APY</label>
          <div class="is-size-2 has-text-black">
            <CustomCountUp v-if="APY !== null" :end-val="APY" :decimal-places="1">
              <template #suffix>
                <span>%</span>
              </template>
            </CustomCountUp>
            <span v-else>-</span>
          </div>
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
      <button :disabled="errorStake ? true : undefined" v-else-if="!activeStake && tab === 'stake'" :class="{ 'is-loading': loadingStake }"
        class="button is-fullwidth is-primary is-large" type="submit">
        Stake NOS
      </button>
    </ClientOnly>
  </form>
  <div class="modal" :class="{ 'is-active': showStakeModal }">
    <div class="modal-background" @click="showStakeModal = false"></div>
    <div class="modal-content">
      <div class="box">
        <h2 class="is-size-4 mb-5 has-text-weight-semibold">ARE YOU SURE YOU WANT TO STAKE?</h2>
        <p class="block is-size-5">
          Are you aware your tokens will only be linearly released based on your unstake period AFTER you unstake?
        </p>
        <p class="block is-size-5">
          For more information about Nosana staking click
          <a href="https://docs.nosana.io/protocols/staking.html" target="_blank">
            <u>here</u>
          </a>
        </p>
        <p class="block buttons is-right">
          <a class="button is-text mr-3 is-large" @click="showStakeModal = false">Cancel</a>
          <a class="button is-primary is-wide is-large" @click="submit">Stake</a>
        </p>
      </div>
    </div>
    <button class="modal-close is-large" @click="showStakeModal = false" aria-label="close"></button>
  </div>
</template>

<script lang="ts" setup>
import { WalletModalProvider, useWallet } from "solana-wallets-vue";
import * as BN from 'bn.js';

const { connected, publicKey } = useWallet();
const { nosana } = useSDK();
const SECONDS_PER_DAY = 24 * 60 * 60;

const rewardsInfo: Ref<any> = ref(null);
const poolInfo: Ref<any> = ref(null);
const loading: Ref<boolean> = ref(false);
const showStakeModal: Ref<boolean> = ref(false);
const amount: Ref<number | null> = ref(null);
const unstakeDays: Ref<number> = ref(14);
const rate: Ref<number | null> = ref(null);
const stakeTotals: Ref<any> = ref(null);
const tab: Ref<string> = ref('stake');

const { data: activeStake, pending: loadingStake, error: errorStake, refresh: refreshStake } =
  await useAsyncData('getStake',
    async () => {
      errorStake.value = null;
      if (publicKey.value) {
        try {
          const stakeData = await nosana.value.stake.get(publicKey.value);
          unstakeDays.value = stakeData.duration / 60 / 60 / 24;
          return stakeData;
        } catch (error: any) {
          if (!error.message.includes('Account does not exist')) {
            throw error;
          }
        }
      }
    }, {
    watch: [publicKey],
    lazy: true
  });

const { data: balance, pending: loadingBalance, error: errorBalance, refresh: refreshBalance } =
  await useAsyncData('getBalance',
    async () => {
      errorStake.value = null;
      if (publicKey.value) {
        const nos = await nosana.value.solana.getNosBalance(publicKey.value)
        return Number(nos?.uiAmount);
      }
    }, {
    watch: [publicKey],
    lazy: true
  });


const multiplier: ComputedRef<number> = computed(() => {
  let unstakeTime;
  unstakeTime = unstakeDays.value * SECONDS_PER_DAY;
  const multiplierSeconds = (SECONDS_PER_DAY * 365) / 3; // 4 months
  const multiplier = unstakeTime / multiplierSeconds;
  return multiplier + 1;
})

const xNOS: ComputedRef<number | null> = computed(() => {
  const formAmount = amount.value ? amount.value : 0;
  return activeStake.value ?
    (formAmount + (activeStake.value.amount.toNumber() / 1e6)) * multiplier.value :
    formAmount * multiplier.value
})

const APY: ComputedRef<number | null> = computed(() => {
  if (expectedRewards.value) {
    const apy = (
      (expectedRewards.value * 365) / ((activeStake.value && activeStake.value.amount
        ? (activeStake.value.amount / 1e6) : 0) + (amount.value ? amount.value : 0)) * 100)
    return apy;
  }
  return null;
})

const expectedRewards: ComputedRef<number | null> = computed(() => {
  if (!stakeTotals.value || !poolInfo.value) { return null; }
  let totalXnos = parseFloat(stakeTotals.value.xnos);
  if (activeStake.value && activeStake.value.amount) {
    totalXnos -= activeStake.value.amount;
  }
  return ((xNOS.value! * 1e6) / (totalXnos + (xNOS.value! * 1e6))) * ((poolInfo.value.emission.toNumber() / 1e6) * 60 * 60 * 24);
})

const getStakeTotals = async () => {
  try {
    // TODO: url in config
    const response = await fetch('https://backend.k8s.prd.nos.ci/stake/totals');
    stakeTotals.value = await response.json();
  } catch (error) {
    console.error(error);
  }
};

const stakeEndDate: ComputedRef<any> = computed(() => {
  console.log('time_unstkae', activeStake.value.time_unstake);
  return activeStake.value && activeStake.value.time_unstake ? activeStake.value.time_unstake : null;
});

const calculateRewards = () => {
  if (poolInfo.value && rewardsInfo.value) {
    rate.value = rewardsInfo.value.global.rate;
    const now = new Date().getTime();
    const secondsBetween = (now / 1000) - parseInt(poolInfo.value.startTime);
    const fees =
      new BN(
        Math.max(secondsBetween, 0) * parseInt(poolInfo.value.emission) -
        parseInt(poolInfo.value.claimedTokens)
      );
    const newTotalXnos = rewardsInfo.value.global.totalXnos.add(fees);
    if (poolInfo.value.poolBalance > 0) {
      rate.value = new BN(rewardsInfo.value.global.totalReflection / newTotalXnos);
    }
  }
}

const pendingRewards: ComputedRef<number | null> = computed(() => {
  let reward = 0;
  if (rewardsInfo.value && rewardsInfo.value.account && rate.value) {
    reward = (rewardsInfo.value.account.reflection / rate.value) -
      rewardsInfo.value.account.xnos;
  }
  return +(reward / 1e6).toFixed(4);
})

useIntervalFn(() => {
  calculateRewards();
}, 1000)


// Staking methods
const submit = () => {
  if (activeStake.value) {
    topup()
  } else {
    stake()
  }
}

const topup = async () => {
  if (amount.value) {
    loading.value = true;
    try {
      const topup = await nosana.value.stake.topup(amount.value * 1e6);
      console.log('topup', topup);
    } catch (e) {
      console.error('cant topup', e);
    }
    loading.value = false;
  }
}

const stake = async () => {
  console.log('stake', amount.value);
  showStakeModal.value = false;
  if (amount.value && publicKey.value && unstakeDays.value) {
    try {
      const stake = await nosana.value.stake.create(publicKey.value, amount.value * 1e6, unstakeDays.value);
      console.log('stake', stake);
    } catch (e) {
      console.error('cant stake', e);
    }
  }
}

const claimRewards = async () => {
  loading.value = true;
  try {
    const claim = await nosana.value.stake.claimRewards();
    await refreshStake();
    await refreshBalance();
    await getRewardsAndPoolInfo();
    console.log('claim', claim);
  } catch (e) {
    console.error('cant claim rewards', e);
  }
  loading.value = false;
}

const claimAndRestakeRewards = async () => {
  showStakeModal.value = false;
  loading.value = true;
  try {
    console.log('pendingRewards', pendingRewards.value)
    const claim = await nosana.value.stake.claimAndRestakeRewards(pendingRewards.value as number);
    await refreshStake();
    await refreshBalance();
    await getRewardsAndPoolInfo();
    console.log('claim & restake', claim);
  } catch (e) {
    console.error('cant cant claim & restake', e);
  }
  loading.value = false;
}

const unstake = async () => {
  loading.value = true;
  try {
    const claim = await nosana.value.stake.unstake();
    await refreshStake();
    await refreshBalance();
    await getRewardsAndPoolInfo();
    console.log('unstake', claim);
  } catch (e) {
    console.error('cant unstake', e);
  }
  loading.value = false;
}

const getRewardsAndPoolInfo = async () => {
  try {
    rewardsInfo.value = await nosana.value.stake.getRewardsInfo();
    poolInfo.value = await nosana.value.stake.getPoolInfo();
    console.log('poolInfo', poolInfo.value);
    console.log('rewardsInfo', rewardsInfo.value);
  } catch (e) {
    console.error('cant fetch rewards info', e);
  }
}

getStakeTotals();
getRewardsAndPoolInfo();
</script>