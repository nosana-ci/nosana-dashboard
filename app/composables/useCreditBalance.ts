import { computed } from "vue";

// Single source of truth for the user's credit balance.
//
// The header (TopBar), the account page (Account/CreditBalance) and the deploy
// page (deployments/create) all display the same balance. Previously each held
// its own copy of the state and fetched on different triggers, so they could
// drift out of sync (e.g. the header cached the login-time value while the
// account page refetched on mount). Sharing one useState-backed store here
// guarantees every location shows the exact same number.
export const useCreditBalance = () => {
  const { nosana } = useKit();
  const { isAuthenticated } = useSuperTokens();

  const assignedCredits = useState<number>("credit-balance-assigned", () => 0);
  const settledCredits = useState<number>("credit-balance-settled", () => 0);
  const reservedCredits = useState<number>("credit-balance-reserved", () => 0);
  const loading = useState<boolean>("credit-balance-loading", () => false);
  const hasLoaded = useState<boolean>("credit-balance-has-loaded", () => false);

  // Available balance = assigned minus what has been settled and reserved.
  const creditBalance = computed(() =>
    assignedCredits.value
      ? assignedCredits.value - settledCredits.value - reservedCredits.value
      : 0,
  );

  const reset = () => {
    assignedCredits.value = 0;
    settledCredits.value = 0;
    reservedCredits.value = 0;
    hasLoaded.value = false;
  };

  const fetchBalance = async (signal?: AbortSignal) => {
    if (!isAuthenticated.value) {
      reset();
      return;
    }

    loading.value = true;
    try {
      const data = await nosana.value.api.credits.balance();
      // Bail out if a newer request superseded this one.
      if (signal?.aborted) return;
      assignedCredits.value = data.assignedCredits || 0;
      settledCredits.value = data.settledCredits || 0;
      reservedCredits.value = data.reservedCredits || 0;
      hasLoaded.value = true;
    } catch (error) {
      // Don't log errors for aborted requests.
      if (
        error instanceof Error &&
        error.name !== "AbortError" &&
        !signal?.aborted
      ) {
        console.error("Error fetching credit balance:", error);
      }
    } finally {
      loading.value = false;
    }
  };

  return {
    creditBalance,
    reservedCredits,
    loading,
    hasLoaded,
    fetchBalance,
    reset,
  };
};
