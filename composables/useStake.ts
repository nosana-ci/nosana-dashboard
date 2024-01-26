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
  // const { data: poolInfo, pending: loadingPoolInfo, error: errorPoolInfo, refresh: refreshPoolInfo } =
  //   await useLazyAsyncData('getPoolInfo',
  //     async () => {
  //       errorPoolInfo.value = null;
  //       return nosana.value.stake.getPoolInfo()
  //     }, {
  //     watch: [activeStake],
  //     server: false
  //   });

  // const { data: rewardsInfo, pending: loadingRewardsInfo, error: errorRewardsInfo, refresh: refreshRewardsInfo } =
  // await useLazyAsyncData('getRewardsInfo',
  //   async () => nosana.value.stake.getRewardsInfo(), {
  //   watch: [activeStake],
  //   server: false
  // });
    
  return { 
    activeStake, loadingStake
    // poolInfo, loadingPoolInfo, errorPoolInfo, refreshPoolInfo,
  };
};
