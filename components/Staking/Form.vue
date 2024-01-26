<template>
  <form @submit.prevent="showStakeModal = true">
    <div class="box">
      <div class="tabs is-fullwidth is-size-4">
        <ul>
          <li :class="{ 'is-active': tab === 'stake' && !(activeStake && stakeEndDate) }">
            <a :claass="{ 'is-disabled': activeStake && stakeEndDate }" @click="tab = 'stake'"
              class="is-justify-content-flex-start">STAKE</a>
          </li>
          <li :class="{ 'is-active': tab === 'unstake' || (activeStake && stakeEndDate) }">
            <a @click="tab = 'unstake'" class="is-justify-content-flex-start"
              :class="{ 'is-disabled': !activeStake }">UNSTAKE</a>
          </li>
        </ul>
      </div>
      <div class="my-2">
        <div v-if="loadingStake">Loading...</div>
        <div v-else-if="errorStake" class="has-text-danger">
          <p>Error fetching stake: {{ errorStake }}.
            <a class="has-text-danger" @click="refreshStake"><u>retry</u></a>
          </p>
        </div>
      </div>
      <div v-if="tab === 'stake'">
        <div class="field" v-if="!activeStake">
          <div class="control columns is-variable is-5 mb-5 is-multiline is-align-items-end">
            <div class="is-flex column is-flex-direction-column" style="min-width: 200px">
              <div class="is-flex is-justify-content-space-between mb-0 is-align-items-center">
                <label class="label mb-2">Add NOS:</label>
                <span class="is-size-7 mb-2 mr-6">
                  <span v-if="loadingBalance">....... NOS</span>
                  <CustomCountUp v-else-if="balance !== null" class="is-clickable" @click="refreshBalance"
                    :end-val="balance" :decimal-places="2" :duration=".5">
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
        <div class="field" v-if="!activeStake">
          <label class="label">Unstake period of:</label>
          <div class="control columns is-variable is-5 is-multiline">
            <div class="is-flex is-align-items-center column is-narrow">
              <input v-model="unstakeDays" required class="input has-text-centered is-medium" type="number" :min="14"
                step="1" :max="365" placeholder="0">
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
      <div v-else-if="tab === 'unstake'">
        <div v-if="activeStake && !stakeEndDate">
          <div class="has-text-centered is-horizontal-centered mb-6">
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
                  .format(new Date().setDate(new Date().getDate() + unstakeDays)) }}
            </h3>
          </div>
          <form @submit.prevent="unstake">
            <button type="submit" class="button is-fullwidth is-primary is-large is-outlined"
              :class="{ 'is-loading': loading }">
              Unstake NOS
            </button>
          </form>
        </div>
        <div v-else-if="activeStake && stakeEndDate">
          <div class="unstaked">
            <h3 class="has-text-centered title is-4 has-text-weight-semibold">
              You have unstaked your tokens
            </h3>
            <div class="has-text-centered is-block mb-1">
              <h5 class="mb-0">
                Unstaked at:
              </h5>
              <span class="is-size-5">{{ new Intl.DateTimeFormat('en-US', {
                dateStyle: 'full', timeStyle: 'medium'
              }).format(activeStake.timeUnstake * 1000) }}</span><br>

              <div class="has-background-light box mt-5">
                <h5 v-if="!countdownFinished" class="mb-3">
                  All tokens will be released in
                </h5>
                <vue-countdown v-if="!countdownFinished" ref="countdown" :time="stakeEndDate * 1000 - Date.now()"
                  @end="finishCountdown()" v-slot="{ days, hours, minutes, seconds }">
                  <div class="columns is-mobile is-multiline">
                    <div class="column is-3-desktop is-6-touch">
                      <div class="has-background-white has-radius title mb-0 py-4 px-2">
                        {{ days }}d
                      </div>
                    </div>
                    <div class="column is-3-desktop is-6-touch">
                      <div class="has-background-white has-radius title mb-0 py-4 px-2">
                        {{ hours }}h
                      </div>
                    </div>
                    <div class="column is-3-desktop is-6-touch">
                      <div class="has-background-white has-radius title mb-0 py-4 px-2">
                        {{ minutes }}m
                      </div>
                    </div>
                    <div class="column is-3-desktop is-6-touch">
                      <div class="has-background-white has-radius title mb-0 py-4 px-2">
                        {{ seconds }}s
                      </div>
                    </div>
                  </div>
                </vue-countdown>
                <div v-if="countdownFinished">
                  <h3 class="title is-4 has-text-weight-semibold">Claim back your tokens:</h3>
                  <button class="button is-fullwidth is-primary mt-2" :class="{ 'is-loading': loading }"
                    @click.prevent="close">
                    Claim <span v-if="vaultBalance">&nbsp;{{ Math.floor(vaultBalance) }}&nbsp;</span> NOS
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!countdownFinished" class="mt-5 has-text-centered">
            <div class="box has-background-light">
              <p>Withdrawable tokens</p>
              <h2 class="title is-2 has-text-success mb-0 mt-1">
                <CustomCountUp :end-val="withdrawAvailable" :decimal-places="4" :duration="1.5" />
              </h2>
              <p>NOS</p>
            </div>
            <button class="button is-fullwidth is-primary" :class="{ 'is-loading': loading }" @click.prevent="restake">
              Restake<span v-if="vaultBalance">&nbsp;{{ Math.floor(vaultBalance) }}&nbsp;</span> NOS
            </button>
            <button class="button is-fullwidth is-primary is-outlined mt-2" :class="{ 'is-loading': loading }"
              @click.prevent="withdraw">
              Withdraw released tokens
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="activeStake && !stakeEndDate" class="box has-text-centered">
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
    <div class="columns" v-if="!activeStake">
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
      <button :disabled="errorStake ? true : undefined" v-else-if="!activeStake && tab === 'stake'"
        :class="{ 'is-loading': loadingStake }" class="button is-fullwidth is-primary is-large" type="submit">
        Stake NOS
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
          <a href="https://docs.nosana.io/protocols/staking.html" target="_blank">
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
  <div class="modal" v-if="activeStake" :class="{ 'is-active': showTopupModal }">
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
  <div class="modal" v-if="activeStake" :class="{ 'is-active': showExtendModal }">
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
              <input
                v-model="extraUnstakeDays"
                required
                class="input has-text-centered"
                type="number"
                :min="1"
                step="1"
                :max="365 - unstakeDays"
                placeholder="0"
                style="width: auto;"
              >
              <span class="ml-2 has-text-grey">Days</span>
              <button
                class="px-2 button is-accent is-outlined has-text-weight-semibold is-uppercase is-size-7"
                style="width: 45px; height: 22px; margin-left: 10px;"
                @click.prevent="extraUnstakeDays = 365 - unstakeDays"
              >
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
    <button class="modal-close is-large" @click="showExtendModal = false, extraUnstakeDays = 0" aria-label="close"></button>
  </div>
</template>

<script lang="ts" setup>
import { WalletModalProvider, useWallet } from "solana-wallets-vue";
import VueCountdown from '@chenfengyuan/vue-countdown';
import * as BN from 'bn.js';
const timestamp = useTimestamp({ interval: 1000 })

const { connected, publicKey } = useWallet();
const { nosana } = useSDK();
const SECONDS_PER_DAY = 24 * 60 * 60;

const loading: Ref<boolean> = ref(false);
const showStakeModal: Ref<boolean> = ref(false);
const showTopupModal: Ref<boolean> = ref(false);
const showExtendModal: Ref<boolean> = ref(false);
const amount: Ref<number | null> = ref(null);
const unstakeDays: Ref<number> = ref(14);
const extraUnstakeDays: Ref<number> = ref(0);
const rate: Ref<number | null> = ref(null);
const tab: Ref<string> = ref('stake');
const countdownFinished: Ref<Boolean> = ref(false);

const { data: activeStake, pending: loadingStake, error: errorStake, refresh: refreshStake } =
  await useLazyAsyncData('getStake',
    async () => {
      errorStake.value = null;
      if (publicKey.value) {
        try {
          const stakeData = await nosana.value.stake.get(publicKey.value);
          unstakeDays.value = stakeData.duration / SECONDS_PER_DAY;
          return stakeData;
        } catch (error: any) {
          console.error(error)
          if (!error.message.includes('Account does not exist')) {
            throw error;
          }
        }
      }
    }, {
    watch: [publicKey],
    server: false
  });

const { data: balance, pending: loadingBalance, error: errorBalance, refresh: refreshBalance } =
  await useLazyAsyncData('getBalance',
    async () => {
      errorBalance.value = null;
      if (publicKey.value) {
        const nos = await nosana.value.solana.getNosBalance(publicKey.value)
        return Number(nos?.uiAmount);
      }
      return null;
    }, {
    watch: [publicKey],
    server: false
  });



const multiplier: ComputedRef<number> = computed(() => {
  const days = extraUnstakeDays.value > 0 ? extraUnstakeDays.value + unstakeDays.value : unstakeDays.value;
  let unstakeTime;
  unstakeTime = days * SECONDS_PER_DAY;
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

const { data: stakeTotals, pending: loadingStakeTotals, error: errorStakeTotals, refresh: refreshStakeTotals } =
  await useAPI('/stake/totals');

const expectedRewards: ComputedRef<number | null> = computed(() => {
  if (!stakeTotals.value || !poolInfo.value) { return null; }

  let totalXnos = parseFloat(stakeTotals.value.xnos);
  if (activeStake.value && activeStake.value.amount) {
    totalXnos -= activeStake.value.amount;
  }
  return ((xNOS.value! * 1e6) / (totalXnos + (xNOS.value! * 1e6))) * ((poolInfo.value.emission.toNumber() / 1e6) * 60 * 60 * 24);
})

const stakeEndDate: ComputedRef<any> = computed(() => {
  return activeStake.value && parseInt(activeStake.value.timeUnstake) > 0 ? BN(activeStake.value.timeUnstake).toNumber() + (unstakeDays.value * 24 * 60 * 60) : null;
});

const { data: vaultBalance, pending: loadingVaultBalance, error: errorVaultBalance, refresh: refreshVaultBalance } =
  await useLazyAsyncData('getVaultBalance',
    async () => {
      errorVaultBalance.value = null;
      if (stakeEndDate.value) {
        return nosana.value.stake.getStakeVaultBalance();
      }
      return null;
    }, {
    watch: [stakeEndDate],
    server: false
  });

const finishCountdown = () => {
  console.log('finish countdown');
  countdownFinished.value = true;
}

const withdrawAvailable: ComputedRef<number | null> = computed(() => {
  if (activeStake.value && stakeEndDate && vaultBalance.value) {
    // @ts-ignore
    const emission = parseFloat(parseInt(activeStake.value.amount) / parseInt(activeStake.value.duration));
    const secondsBetween = timestamp.value / 1000 - parseInt(activeStake.value.timeUnstake);

    const tokensReleased = emission * secondsBetween;
    const withdrawn = (parseInt(activeStake.value.amount) - (vaultBalance.value * 1e6));
    const available = Math.min(tokensReleased - withdrawn, vaultBalance.value * 1e6);

    return +(available / 1e6);
  }
  return null
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


// Staking methods
const stakeOrTopup = () => {
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
      await refreshStake();
      await refreshBalance();
      showTopupModal.value = false;
      console.log('topup tx', topup);
    } catch (e) {
      console.error('cant topup', e);
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
    } catch (e) {
      console.error('cant extend', e);
    }
    loading.value = false;
  }
}

const stake = async () => {
  showStakeModal.value = false;
  if (amount.value && publicKey.value && unstakeDays.value) {
    try {
      const stake = await nosana.value.stake.create(publicKey.value, amount.value * 1e6, unstakeDays.value);
      console.log('stake tx', stake);
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
    const claim = await nosana.value.stake.claimAndRestakeRewards(pendingRewards.value as number);
    await refreshStake();
    await refreshBalance();
    console.log('claim & restake', claim);
  } catch (e) {
    console.error('cant cant claim & restake', e);
  }
  loading.value = false;
}

const unstake = async () => {
  loading.value = true;
  try {
    const unstake = await nosana.value.stake.unstake();
    await refreshStake();
    await refreshBalance();
    console.log('unstake', unstake);
  } catch (e) {
    console.error('cant unstake', e);
  }
  loading.value = false;
}

const restake = async () => {
  loading.value = true;
  try {
    const restake = await nosana.value.stake.restake();
    await refreshStake();
    await refreshBalance();
    console.log('restake', restake);
  } catch (e) {
    console.error('cant restake', e);
  }
  loading.value = false;
}

const withdraw = async () => {
  loading.value = true;
  try {
    const withdraw = await nosana.value.stake.withdraw();
    await refreshStake();
    await refreshBalance();
    await refreshVaultBalance();
    console.log('withdraw', withdraw);
  } catch (e) {
    console.error('cant withdraw', e);
  }
  loading.value = false;
}

const close = async () => {
  loading.value = true;
  try {
    const close = await nosana.value.stake.close();
    await refreshStake();
    await refreshBalance();
    console.log('close', close);
  } catch (e) {
    console.error('cant close', e);
  }
  loading.value = false;
}

const { data: rewardsInfo, pending: loadingRewardsInfo, error: errorRewardsInfo, refresh: refreshRewardsInfo } =
  await useLazyAsyncData('getRewardsInfo',
    async () => nosana.value.stake.getRewardsInfo(), {
    watch: [activeStake],
    server: false
  });
const { data: poolInfo, pending: loadingPoolInfo, error: errorPoolInfo, refresh: refreshPoolInfo } =
  await useLazyAsyncData('getPoolInfo',
    async () => {
      errorPoolInfo.value = null;
      return nosana.value.stake.getPoolInfo()
    }, {
    watch: [activeStake],
    server: false
  });

</script>
<style lang="scss" scoped>
.extend {
  line-height: .2;
  height: 19px;
}
</style>
