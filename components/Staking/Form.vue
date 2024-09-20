<template>
  <form @submit.prevent="showStakeModal = true">
    <div class="box">
      <div class="tabs is-fullwidth is-size-4">
        <ul>
          <li :class="{ 'is-active': tab === 'stake' && !(activeStake && stakeEndDate) }">
            <a :class="{ 'is-disabled': activeStake && stakeEndDate }" @click="tab = 'stake'"
              class="is-justify-content-flex-start">STAKE</a>
          </li>
          <li :class="{ 'is-active': tab === 'unstake' || (activeStake && stakeEndDate) }">
            <a @click="tab = 'unstake'" class="is-justify-content-flex-start"
              :class="{ 'is-disabled': !activeStake || !activeStake.address }">UNSTAKE</a>
          </li>
        </ul>
      </div>
      <div class="my-2" v-if="connected">
        <div v-if="loadingStake">Loading...</div>
        <div v-else-if="errorStake" class="has-text-danger">
          <p>Error fetching stake account.
            <a class="has-text-danger" @click="refreshStake"><u><b>Retry</b></u></a>
          </p>
        </div>
      </div>
      <div v-if="tab === 'stake' && !stakeEndDate">
        <div class="field" v-if="!activeStake || !activeStake.address">
          <div class="is-flex is-justify-content-space-between mb-0 is-align-items-center">
            <label class="label">Add NOS:</label>
            <span class="is-size-7 mr-1">
              <span v-if="loadingBalance">....... NOS</span>
              <CustomCountUp v-else-if="balance !== null" class="is-clickable" @click="refreshBalance" :end-val="balance"
                :decimal-places="2" :duration=".5">
                <template #suffix>
                  <span> NOS</span>
                </template>
              </CustomCountUp>
              <div v-if="errorBalance" class="has-text-danger">
                <p>Error fetching balance: {{ errorBalance }}.
                  <a class="has-text-danger" @click="refreshBalance"><u>retry</u></a>
                </p>
              </div>
            </span>
          </div>
          <div class="control columns is-variable is-5 mb-5 is-multiline is-align-items-end">
            <div class="is-flex column is-flex-direction-column" style="min-width: 200px">
              <div class="is-flex is-align-items-center">
                <input class="input is-medium" v-model="amount" required min="1" :max="balance" step="0.1" type="number"
                  placeholder="0">
                <span class="has-text-grey ml-2">NOS</span>
              </div>
            </div>
            <div class="column is-narrow">
              <div class="buttons is-centered">
                <a class="button is-primary is-outlined mr-2 mb-3" :disabled="balance === null ? true : null"
                  @click="balance !== null ? amount = parseInt((balance / 2)) : null">
                  HALF
                </a>
                <a class="button is-primary is-outlined mb-3" :disabled="balance === null ? true : null"
                  @click="balance !== null ? amount = parseInt(balance) : null">
                  MAX
                </a>
              </div>
            </div>
          </div>
        </div>
        <div class="field" v-if="!activeStake || !activeStake.address">
          <label class="label">Unstake period of:</label>
          <div class="control columns is-variable is-5 is-multiline">
            <div class="is-flex is-align-items-center column is-narrow">
              <input v-model="newUnstakeDays" required class="input has-text-centered is-medium" type="number" :min="14"
                step="1" :max="365" placeholder="0">
              <span class="ml-2 has-text-grey">Days</span>
            </div>
          </div>
        </div>
        <!-- Your stake block -->
        <div v-if="activeStake && activeStake.address">
          <p class="has-text-black is-uppercase mb-4">Your stake</p>
          <div class="columns is-multiline">
            <div class="column is-4 mb-">
              <label class="label is-size-6 mb-0">NOS Staked</label>
              <div class="has-text-black is-size-3">
                <CustomCountUp :end-val="(activeStake.amount / 1e6)" :decimal-places="2">
                </CustomCountUp>
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
              <div class="has-text-black is-flex is-align-items-center">
                <div><span class="is-size-3">{{ unstakeDays }}</span> days</div>
                <button v-if="unstakeDays < 365" @click.prevent="showExtendModal = true;"
                  class="button is-size-7 is-small is-outlined is-primary extend px-1 mt-1 ml-2">
                  Extend <img src="@/assets/img/icons/arrow-right.svg" style="height: 8px;" class="ml-1">
                </button>
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
                <CustomCountUp v-if="expectedRewards !== null" :end-val="expectedRewards" :decimal-places="2">
                </CustomCountUp>
              </div>
            </div>
            <div class="column is-12">
              <button class="button is-fullwidth is-primary is-large" @click.prevent="showTopupModal = true;">
                Increase Your Stake
              </button>
            </div>
          </div>
        </div>
      </div>
      <StakingUnstake v-else-if="tab === 'unstake' || stakeEndDate" />
    </div>
    <StakingPendingRewards v-if="activeStake && activeStake.address && !stakeEndDate" />
    <div class="columns" v-if="!activeStake || !activeStake.address">
      <div class="column is-6">
        <div class="box">
          <label class="label">Expected daily NOS rewards</label>
          <div class="is-size-1 has-text-black">
            <CustomCountUp v-if="expectedRewards !== null" :end-val="expectedRewards" :decimal-places="2">
            </CustomCountUp>
            <span v-else-if="loadingPoolInfo">....</span>
          </div>
          <p class="has-text-danger" v-if="errorPoolInfo">Error fetching pool info: {{ errorPoolInfo }}.
            <a class="has-text-danger" @click="refreshPoolInfo"><u>retry</u></a>
          </p>
        </div>
      </div>
      <div class="column is-6">
        <div class="box">
          <label class="label">Staked NOS</label>
          <div class="is-size-1 has-text-black">
            <CustomCountUp v-if="amount !== null" :end-val="Math.max(0, amount)">
            </CustomCountUp>
            <span v-else>-</span>
          </div>
        </div>
      </div>
    </div>
    <div class="columns" v-if="!activeStake || !activeStake.address">
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
            <span v-else-if="loadingPoolInfo">....</span>
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
      <button :disabled="errorStake || !amount || !balance || amount > balance ? true : undefined"
        v-else-if="(!activeStake || !activeStake.address) && tab === 'stake'" :class="{ 'is-loading': loading }"
        class="button is-fullwidth is-primary is-large" type="submit">
        <span v-if="amount && balance !== null && amount > balance">Insufficient NOS</span>
        <span v-else>Stake NOS</span>
      </button>
    </ClientOnly>
  </form>
  <!--- Modals -->
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
          <a href="https://docs.nosana.com/protocols/staking.html" target="_blank">
            <u>here</u>
          </a>
        </p>
        <p class="block buttons is-right">
          <a class="button is-text mr-3 is-large" @click="showStakeModal = false">Cancel</a>
          <a class="button is-primary is-wide is-large" @click="stakeOrTopup">Stake</a>
        </p>
      </div>
    </div>
    <button class="modal-close is-large" @click="showStakeModal = false" aria-label="close"></button>
  </div>
  <div class="modal" v-if="activeStake && activeStake.address" :class="{ 'is-active': showTopupModal }">
    <div class="modal-background" @click="showTopupModal = false"></div>
    <div class="modal-content">
      <div class="box">
        <h2 class="is-size-2 mb-5 has-text-weight-semibold has-text-centered">Increase Stake</h2>
        <div class="columns pt-3">
          <div class="column is-3">
            <label class="label is-size-6 mb-0">NOS Staked</label>
            <div class="has-text-black is-size-3">
              {{ (activeStake.amount / 1e6).toFixed() }}
            </div>
          </div>
          <div class="column is-3">
            <label class="label mb-0">xNOS</label>
            <div class="has-text-black is-size-3">
              <CustomCountUp v-if="xNOS !== null" :end-val="xNOS">
              </CustomCountUp>
            </div>
          </div>
          <div class="column is-4">
            <label class="label mb-0">Expected Daily NOS rewards</label>
            <div class="has-text-black is-size-3">
              <CustomCountUp v-if="expectedRewards !== null" :end-val="(expectedRewards as number)" :decimal-places="2">
              </CustomCountUp>
            </div>
          </div>
        </div>
        <div class="field">
          <div class="control columns is-variable is-5 mb-5 is-multiline is-align-items-end">
            <div class="is-flex column is-flex-direction-column" style="min-width: 200px">
              <div class="is-flex is-justify-content-space-between mb-0 is-align-items-center">
                <label class="label mb-2">Add NOS</label>
                <span class="is-size-7 mb-2 mr-6" v-if="balance !== null">
                  <CustomCountUp :end-val="balance" :decimal-places="2" :duration=".5">
                    <template #suffix>
                      <span> NOS</span>
                    </template>
                  </CustomCountUp>
                </span>
              </div>
              <div class="is-flex is-align-items-center">
                <input class="input is-medium" v-model="amount" required min="1" :max="balance" step="0.1" type="number"
                  placeholder="0">
                <span class="has-text-grey ml-2">NOS</span>
              </div>
            </div>
            <div class="column is-narrow">
              <div class="buttons is-centered">
                <a class="button is-primary is-outlined mr-2 mb-3" :disabled="balance === null ? true : null"
                  @click="balance !== null ? amount = parseInt((balance / 2)) : null">
                  HALF
                </a>
                <a class="button is-primary is-outlined mb-3" :disabled="balance === null ? true : null"
                  @click="balance !== null ? amount = balance : null">
                  MAX
                </a>
              </div>
            </div>
          </div>
        </div>
        <button class="button is-fullwidth is-primary is-large" @click.prevent="topup()"
          :class="{ 'is-loading': loading }">
          Increase Stake
        </button>
      </div>
    </div>
    <button class="modal-close is-large" @click="showTopupModal = false" aria-label="close"></button>
  </div>
  <div class="modal" v-if="activeStake && activeStake.address" :class="{ 'is-active': showExtendModal }">
    <div class="modal-background" @click="showExtendModal = false, extraUnstakeDays = 0"></div>
    <div class="modal-content">
      <div class="box">
        <h2 class="is-size-2 mb-5 has-text-weight-semibold has-text-centered">Extend Unstake Period</h2>
        <div class="columns pt-3">
          <div class="column is-3">
            <label class="label mb-0">Unstake period of</label>
            <div class="has-text-black is-flex is-align-items-center">
              <div><span class="is-size-3">{{ unstakeDays }}</span> days</div>
            </div>
          </div>
          <div class="column is-3">
            <label class="label mb-0">xNOS</label>
            <div class="has-text-black is-size-3">
              <CustomCountUp v-if="xNOS !== null" :end-val="xNOS">
              </CustomCountUp>
            </div>
          </div>
          <div class="column is-4">
            <label class="label mb-0">Expected Daily NOS rewards</label>
            <div class="has-text-black is-size-3">
              <CustomCountUp v-if="expectedRewards !== null" :end-val="(expectedRewards as number)" :decimal-places="2">
              </CustomCountUp>
            </div>
          </div>
        </div>
        <label class="label">Extend unstake period with:</label>
        <div class="control columns is-variable is-5 is-multiline">
          <div class="is-flex is-align-items-center column is-narrow">
            <input v-model="extraUnstakeDays" required class="input has-text-centered" type="number" :min="1" step="1"
              :max="365 - unstakeDays" placeholder="0" style="width: auto;">
            <span class="ml-2 has-text-grey">Days</span>
            <button class="px-2 button is-accent is-outlined has-text-weight-semibold is-uppercase is-size-7"
              style="width: 45px; height: 22px; margin-left: 10px;" @click.prevent="extraUnstakeDays = 365 - unstakeDays">
              Max
            </button>
          </div>
        </div>
        <button class="button is-fullwidth is-primary is-large" @click.prevent="extend()"
          :class="{ 'is-loading': loading }">
          Extend Unstake
        </button>
      </div>
    </div>
    <button class="modal-close is-large" @click="showExtendModal = false, extraUnstakeDays = 0"
      aria-label="close"></button>
  </div>
</template>

<script lang="ts" setup>
import { WalletModalProvider, useWallet } from "solana-wallets-vue";
import { useToast } from "vue-toastification";
import { useAPI2 } from '~/composables/useAPI2';

const toast = useToast();
const { connected, publicKey } = useWallet();
const { unstakeDays, balance, activeStake, loadingPoolInfo, poolInfo, 
  refreshPoolInfo, errorPoolInfo, refreshStake, refreshBalance, 
  loadingStake, errorStake, loadingBalance, errorBalance } = useStake(publicKey);
const { nosana } = useSDK();
const SECONDS_PER_DAY = 24 * 60 * 60;

const loading: Ref<boolean> = ref(false);
const showStakeModal: Ref<boolean> = ref(false);
const showTopupModal: Ref<boolean> = ref(false);
const showExtendModal: Ref<boolean> = ref(false);
const amount: Ref<number | null> = ref(null);
const extraUnstakeDays: Ref<number> = ref(0);
const tab: Ref<string> = ref('stake');
const newUnstakeDays: Ref<number> = ref(14);

const multiplier: ComputedRef<number> = computed(() => {
  const days = extraUnstakeDays.value > 0 ? extraUnstakeDays.value + unstakeDays.value : (unstakeDays.value ? unstakeDays.value : newUnstakeDays.value);
  let unstakeTime;
  unstakeTime = days * SECONDS_PER_DAY;
  const multiplierSeconds = (SECONDS_PER_DAY * 365) / 3; // 4 months
  const multiplier = unstakeTime / multiplierSeconds;
  return multiplier + 1;
})

const xNOS: ComputedRef<number | null> = computed(() => {
  const formAmount = amount.value ? amount.value : 0;
  const score = activeStake.value && activeStake.value.amount ?
    (formAmount + (activeStake.value.amount / 1e6)) * multiplier.value :
    formAmount * multiplier.value;
  return Math.max(0, score);
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

const { data: stakeTotals, pending: loadingStakeTotals, error: errorStakeTotals, refresh: refreshStakeTotals } =
  await useAPI2('/stake/totals');

const expectedRewards: ComputedRef<number | null> = computed(() => {
  if (!stakeTotals.value || !poolInfo.value) { return null; }

  let totalXnos = parseFloat(stakeTotals.value.xnos);
  if (activeStake.value && activeStake.value.amount) {
    totalXnos -= activeStake.value.amount;
  }
  const rewards = ((xNOS.value! * 1e6) / (totalXnos + (xNOS.value! * 1e6))) * ((poolInfo.value.emission.toNumber() / 1e6) * SECONDS_PER_DAY)
  return Math.max(0, rewards);
})

const stakeEndDate: ComputedRef<any> = computed(() => {
  return activeStake.value && parseInt(activeStake.value.time_unstake) > 0 ? Number(activeStake.value.time_unstake) + Number(unstakeDays.value * 24 * 60 * 60) : null;
});

// Staking methods
const stakeOrTopup = () => {
  if (activeStake.value && activeStake.value.amount) {
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
      await refreshStake();
      await refreshBalance();
      showTopupModal.value = false;
      toast.success('Succesfully topped up stake');
      console.log('topup tx', topup);
    } catch (e: any) {
      console.error('cant topup', e);
      toast.error(e.toString());
    }
    loading.value = false;
  }
}

const extend = async () => {
  if (extraUnstakeDays.value) {
    loading.value = true;
    try {
      const extend = await nosana.value.stake.extend(extraUnstakeDays.value * SECONDS_PER_DAY);
      await refreshStake();
      showExtendModal.value = false;
      extraUnstakeDays.value = 0;
      console.log('extend tx', extend);
      toast.success('Succesfully extended unstake period');
    } catch (e: any) {
      console.error('cant extend', e);
      toast.error(e.toString());
    }
    loading.value = false;
  }
}

const stake = async () => {
  showStakeModal.value = false;
  if (amount.value && publicKey.value && newUnstakeDays.value) {
    loading.value = true;
    try {
      const stake = await nosana.value.stake.create(publicKey.value, amount.value * 1e6, newUnstakeDays.value);
      await refreshStake();
      console.log('stake tx', stake);
      toast.success('Succesfully staked');
    } catch (e: any) {
      console.error('cant stake', e);
      toast.error(e.toString());
    }
    loading.value = false;
  }
}
</script>
<style lang="scss" scoped>
.extend {
  line-height: .2;
  height: 19px;
}
</style>
