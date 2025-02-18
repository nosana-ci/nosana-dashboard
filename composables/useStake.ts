const { nosana } = useSDK();
const SECONDS_PER_DAY = 24 * 60 * 60;

export function useStake(publicKey: any) {
  const {
    data: activeStake,
    pending: loadingStake,
    error: errorStake,
    refresh: refreshStake,
  } = useMyAsyncData(
    "getStake",
    async () => {
      errorStake.value = null;
      if (publicKey.value) {
        try {
          const stakeAccount = await nosana.value.stake.get(publicKey.value);
          return {
            xnos: stakeAccount.xnos.toString(),
            address: stakeAccount.authority.toString(),
            time_unstake: stakeAccount.timeUnstake.toString(),
            amount: stakeAccount.amount.toString(),
            duration: stakeAccount.duration.toString(),
          };
        } catch (error: any) {
          if (!error.message.includes("Account does not exist")) {
            throw new Error(error.message);
          } else {
            return null;
          }
        }
      }
    },
    {
      watch: [publicKey],
    }
  );

  const unstakeDays: ComputedRef<number> = computed(() => {
    return activeStake.value ? activeStake.value.duration / SECONDS_PER_DAY : 0;
  });

  const {
    data: poolInfo,
    pending: loadingPoolInfo,
    error: errorPoolInfo,
    refresh: refreshPoolInfo,
  } = useMyAsyncData(
    "getPoolInfo",
    async () => {
      errorPoolInfo.value = null;
      return nosana.value.stake.getPoolInfo();
    },
    {
      watch: [activeStake],
    }
  );

  const {
    data: rewardsInfo,
    pending: loadingRewardsInfo,
    error: errorRewardsInfo,
    refresh: refreshRewardsInfo,
  } = useMyAsyncData(
    "getRewardsInfo",
    async () => nosana.value.stake.getRewardsInfo(),
    {
      watch: [activeStake],
    }
  );

  const {
    data: balance,
    pending: loadingBalance,
    error: errorBalance,
    refresh: refreshBalance,
  } = useMyAsyncData(
    "getBalance",
    async () => {
      errorBalance.value = null;
      if (publicKey.value) {
        const nos = await nosana.value.solana.getNosBalance(publicKey.value);
        return nos ? Number(nos.uiAmount) : 0;
      }
      return null;
    },
    {
      watch: [publicKey],
    }
  );

  return {
    activeStake,
    loadingStake,
    errorStake,
    refreshStake,
    poolInfo,
    loadingPoolInfo,
    errorPoolInfo,
    refreshPoolInfo,
    rewardsInfo,
    loadingRewardsInfo,
    errorRewardsInfo,
    refreshRewardsInfo,
    balance,
    loadingBalance,
    errorBalance,
    refreshBalance,
    unstakeDays,
  };
}
