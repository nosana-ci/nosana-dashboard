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
      
      // Early return if no valid publicKey
      if (!publicKey.value) {
        return null;
      }
      
      // Validate publicKey is a proper object with toString method
      if (!publicKey.value.toString || typeof publicKey.value.toString !== 'function') {
        return null;
      }
      
      
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
        
        // Handle various error types that indicate no stake account
        const isAccountNotFound = error.message && (
          error.message.includes("Account does not exist") ||
          error.message.includes("buffer length") ||
          error.message.includes("Trying to access beyond buffer length") ||
          error.message.includes("Invalid account data")
        );
        
        if (isAccountNotFound) {
          return null;
        } else {
          console.error("Unexpected stake error:", error);
          throw new Error(error.message);
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
