<template>
  <form @submit.prevent="submit">
    <div class="box">
      <div class="tabs is-fullwidth is-size-5">
        <ul>
          <li :class="{ 'is-active': tab === 'stake' }"><a @click="tab = 'stake'"
              class="is-justify-content-flex-start">STAKE</a></li>
          <li :class="{ 'is-active': tab === 'unstake' }"><a @click="tab = 'unstake'"
              class="is-justify-content-flex-start" :class="{ 'is-disabled': !stakedNos }">UNSTAKE</a></li>
        </ul>
      </div>
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
    </div>
    <div class="columns">
      <div class="column is-6">
        <div class="box">
          <label class="label">Expected daily NOS rewards:</label>
          <div class="is-size-1 has-text-black">
            <CustomCountUp v-if="expectedRewards !== null" :end-val="expectedRewards"></CustomCountUp>
            <span v-else>-</span>
          </div>
        </div>
      </div>
      <div class="column is-6">
        <div class="box">
          <label class="label">Pending NOS rewards:</label>
          <div class="is-size-1 has-text-black">
            <CustomCountUp v-if="pendingRewards !== null" :end-val="pendingRewards" :decimal-places="4" :duration="1.5">
            </CustomCountUp>
            <span v-else>-</span>
          </div>
        </div>
      </div>
    </div>
    <div class="columns">
      <div class="column is-4">
        <div class="box">
          <label class="label">xNOS Score:</label>
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
            <CustomCountUp v-if="APY !== null" :end-val="APY * 100" :decimal-places="1">
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
      <button v-else-if="activeStake" class="button is-fullwidth is-primary is-large" type="submit">
        Increase Stake
      </button>
      <button v-else class="button is-fullwidth is-primary is-large" type="submit">
        Stake NOS
      </button>
    </ClientOnly>
  </form>
</template>

<script lang="ts" setup>
import { WalletModalProvider, useWallet } from "solana-wallets-vue";
const { connected, publicKey } = useWallet();
const { nosana } = useSDK();
const SECONDS_PER_DAY = 24 * 60 * 60;

const activeStake: Ref<any> = ref(null);
const loading: Ref<Boolean> = ref(false);
const balance: Ref<number | null> = ref(null);
const amount: Ref<number | null> = ref(null);
const unstakeDays: Ref<number> = ref(14);
const stakedNos: Ref<number | null> = ref(null);
const tab: Ref<string> = ref('stake');
const expectedRewards: Ref<number | null> = ref(100);
const pendingRewards: Ref<number | null> = ref(0);

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
      (formAmount + (activeStake.value.amount.toNumber()/1e6)) * multiplier.value :
        formAmount * multiplier.value
})

const APY: ComputedRef<number | null> = computed(() => {
  if (expectedRewards.value && amount.value) {
    return (expectedRewards.value * 365) / (amount.value)
  }
  return null;
})

const submit = () => {
  if (activeStake.value) {
    topup()
  } else {
    stake()
  }
}

useIntervalFn(() => {
  if (pendingRewards.value !== null) {
    pendingRewards.value += 0.0043;
  }
}, 1000)

const getStake = async () => {
  if (publicKey) {
    loading.value = true;
    try {
      // @ts-ignore
      activeStake.value = await nosana.value.stake.get(publicKey.value);
      console.log('stake', activeStake.value);
    } catch (e) {
      console.error('cant get stake', e);
    }
    loading.value = false;
  }
}

const getBalance = async () => {
  if (publicKey) {
    try {
      // @ts-ignore
      const nos = await nosana.value.solana.getNosBalance(publicKey.value)
      balance.value = Number(nos?.uiAmount);
      console.log('balance', balance.value);
    } catch (e) {
      console.error('cant get balance', e);
    }
  }
}

const topup = async () => {
  console.log('topup', amount.value);
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
  if (amount.value && publicKey.value && unstakeDays.value) {
    try {
      const stake = await nosana.value.stake.create(publicKey.value, amount.value * 1e6, unstakeDays.value);
      console.log('stake', stake);
    } catch (e) {
      console.error('cant stake', e);
    }
  }
}

const getRewardsAndPoolInfo = async () => {
  try {
    const info = await nosana.value.stake.getRewardsAndPoolInfo();
    console.log('info', info);
  } catch (e) {
    console.error('cant fetch rewards info', e);
  }
}

onMounted(() => {
  if (connected) {
    getBalance()
    getStake()
  }
});
</script>