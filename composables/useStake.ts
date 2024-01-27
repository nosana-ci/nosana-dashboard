import { useWallet } from "solana-wallets-vue";
import { useToast } from "vue-toastification";
const { nosana } = useSDK();
const toast = useToast();
const SECONDS_PER_DAY = 24 * 60 * 60;

export function useStake(publicKey: any) {
  let unstakeDays;
  console.log('publicKey', publicKey.value.toString());
  const { data: activeStake, pending: loadingStake, error: errorStake, refresh: refreshStake } =
    useLazyAsyncData('getStake',
      async () => {
        errorStake.value = null;
        if (publicKey.value) {
          try {
            const stakeData = await nosana.value.stake.get(publicKey.value);
            unstakeDays = stakeData.duration / SECONDS_PER_DAY;
            return stakeData;
          } catch (error: any) {
            if (!error.message.includes('Account does not exist')) {
              toast.error(error.message);
              throw error;
            }
          }
        }
      }, {
      watch: [publicKey],
      server: false
    });

  console.log('activestake', activeStake);
  const { data: poolInfo, pending: loadingPoolInfo, error: errorPoolInfo, refresh: refreshPoolInfo } =
    useLazyAsyncData('getPoolInfo',
      async () => {
        errorPoolInfo.value = null;
        return nosana.value.stake.getPoolInfo()
      }, {
      watch: [activeStake],
      server: false
    });

  const { data: rewardsInfo, pending: loadingRewardsInfo, error: errorRewardsInfo, refresh: refreshRewardsInfo } =
  useLazyAsyncData('getRewardsInfo',
    async () => nosana.value.stake.getRewardsInfo(), {
    watch: [activeStake],
    server: false
  });

  const { data: balance, pending: loadingBalance, error: errorBalance, refresh: refreshBalance } =
  useMyAsyncData('getBalance',
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
    
  return { 
    activeStake, loadingStake, errorStake, refreshStake,
    poolInfo, loadingPoolInfo, errorPoolInfo, refreshPoolInfo,
    rewardsInfo, loadingRewardsInfo, errorRewardsInfo, refreshRewardsInfo,
    balance, loadingBalance, errorBalance, refreshBalance,
    unstakeDays
  };
};
