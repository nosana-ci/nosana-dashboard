<template>
  <div v-if="activeStake && !stakeEndDate">
    <div class="has-text-centered is-horizontal-centered mb-6">
      <h3 class="has-text-centered title pt-3 is-4 has-text-weight-semibold">
        Unstake your tokens here.
      </h3>
      <p>
        Be aware that after you unstake, your tokens will be released linearly
         over the duration of your unstaking period, and you will not receive 
         any rewards during this time.<br><br>
        If you were to unstake now, your last tokens can be claimed on:
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
        }).format(activeStake.time_unstake * 1000) }}</span><br>

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
            <button class="button is-fullwidth is-primary mt-2" :class="{ 'is-loading': loading }" @click.prevent="close">
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
          <CustomCountUp :end-val="(withdrawAvailable as unknown as number)" :decimal-places="4" :duration="1.5" />
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
</template>
<script lang="ts" setup>
import { useWallet } from "solana-wallets-vue";
import VueCountdown from '@chenfengyuan/vue-countdown';
import { useToast } from "vue-toastification";
const toast = useToast();
const timestamp = useTimestamp({ interval: 1000 })
const { publicKey } = useWallet();
const { unstakeDays, activeStake, refreshStake, refreshBalance } = useStake(publicKey);
const { nosana } = useSDK();
const loading: Ref<boolean> = ref(false);
const countdownFinished: Ref<Boolean> = ref(false);

const stakeEndDate: ComputedRef<any> = computed(() => {
  return activeStake.value && parseInt(activeStake.value.time_unstake) > 0 ? Number(activeStake.value.time_unstake) + Number(unstakeDays.value * 24 * 60 * 60) : null;
});

const { data: vaultBalance, pending: loadingVaultBalance, error: errorVaultBalance, refresh: refreshVaultBalance } =
  await useMyAsyncData('getVaultBalance',
    async () => {
      errorVaultBalance.value = null;
      if (stakeEndDate.value) {
        return nosana.value.stake.getStakeVaultBalance();
      }
      return null;
    }, {
    watch: [stakeEndDate]
  });

const finishCountdown = () => {
  console.log('finish countdown');
  countdownFinished.value = true;
}

const withdrawAvailable: ComputedRef<number | null> = computed(() => {
  if (activeStake.value && stakeEndDate && vaultBalance.value) {
    // @ts-ignore
    const emission = parseFloat(parseInt(activeStake.value.amount) / parseInt(activeStake.value.duration));
    const secondsBetween = timestamp.value / 1000 - parseInt(activeStake.value.time_unstake);

    const tokensReleased = emission * secondsBetween;
    const withdrawn = (parseInt(activeStake.value.amount) - (vaultBalance.value * 1e6));
    const available = Math.min(tokensReleased - withdrawn, vaultBalance.value * 1e6);

    return +(available / 1e6);
  }
  return null
});

const unstake = async () => {
  loading.value = true;
  try {
    const unstake = await nosana.value.stake.unstake();
    await refreshStake();
    console.log('unstake', unstake);
    toast.success('Succesfully unstaked NOS');
  } catch (e: any) {
    console.error('cant unstake', e);
    toast.error(e.toString());
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
    toast.success('Succesfully restaked NOS');
  } catch (e: any) {
    console.error('cant restake', e);
    toast.error(e.toString());
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
    toast.success('Succesfully withdrawed NOS');
  } catch (e: any) {
    console.error('cant withdraw', e);
    toast.error(e.toString());
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
    toast.success('Succesfully claimed & closed staking account');
  } catch (e: any) {
    console.error('cant close', e);
    toast.error(e.toString());
  }
  loading.value = false;
}
</script>
