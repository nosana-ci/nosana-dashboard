import { useWallet } from "solana-wallets-vue";

import type { MessageSignerWalletAdapter } from "@solana/wallet-adapter-base";

export function useNosanaWallet() {
  const { nosana } = useSDK();
  const { connected, publicKey, wallet } = useWallet();

  const userBalances = ref({
    nos: 0,
    sol: 0,
    usdc: 0,
    usdt: 0,
  });

  const refreshAllBalances = async () => {
    try {
      const nosBal = await nosana.value.solana.getNosBalance();
      userBalances.value.nos = nosBal?.uiAmount ?? 0;
    } catch (error) {
      console.error("Failed to refresh NOS balance", error);
    }
  };

  watch(
    connected,
    async (isConnected) => {
      if (isConnected) {
        await refreshAllBalances();
      }
    },
    { immediate: true }
  );

  // Session cache for the auth string (persists across reloads in the same tab/window)
  const AUTH_CACHE_KEY = 'nosanaAuthHeader';
  const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

  const loadCachedAuth = (): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      const raw = sessionStorage.getItem(AUTH_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.value || !parsed?.expiresAt) return null;
      // Ensure the cached header belongs to the currently connected wallet
      const currentOwner = publicKey.value?.toString();
      if (!currentOwner || parsed?.owner !== currentOwner) {
        sessionStorage.removeItem(AUTH_CACHE_KEY);
        return null;
      }
      if (Date.now() >= parsed.expiresAt) {
        sessionStorage.removeItem(AUTH_CACHE_KEY);
        return null;
      }
      return parsed.value as string;
    } catch {
      return null;
    }
  };

  // Reactive session auth mirror so other components can react immediately
  const sessionAuthRef = ref<string | null>(null);
  sessionAuthRef.value = (typeof window !== 'undefined') ? loadCachedAuth() : null;

  const saveCachedAuth = (value: string, ttlMs = DEFAULT_TTL_MS) => {
    try {
      if (typeof window === 'undefined') return;
      const expiresAt = Date.now() + ttlMs;
      sessionStorage.setItem(
        AUTH_CACHE_KEY,
        JSON.stringify({ value, expiresAt, owner: publicKey.value?.toString() })
      );
      sessionAuthRef.value = value;
    } catch {
      /* ignore */
    }
  };

  const clearCachedAuth = () => {
    try {
      if (typeof window === 'undefined') return;
      sessionStorage.removeItem(AUTH_CACHE_KEY);
      sessionAuthRef.value = null;
    } catch {
      /* ignore */
    }
  };

  // In-memory cache for the current runtime (fallback within a session)
  const cachedAuthString = ref<string | null>(null);
  let authInFlight: Promise<string> | null = null;
  const signMessageError = ref(false);
  const hasSessionAuth = computed<boolean>(() => {
    return Boolean(sessionAuthRef.value || cachedAuthString.value);
  });

  const generateAuthHeaders = async (
    options?: { key?: string; includeTime?: boolean; forceNew?: boolean }
  ): Promise<Headers> => {
    if (!connected.value || !publicKey.value) {
      throw new Error("Wallet not connected or not found");
    }

    const key = options?.key ?? 'Authorization';

    // Use cached string when includeTime is false and not forcing new
    if (!options?.includeTime && !options?.forceNew) {
      const value = sessionAuthRef.value || cachedAuthString.value || loadCachedAuth();
      if (value) {
        const headers = new Headers();
        headers.set(key, value);
        return headers;
      }
      // If a generation is already in-flight, reuse it to avoid double prompts
      if (authInFlight) {
        const authString = await authInFlight;
        const headers = new Headers();
        headers.set(key, authString);
        return headers;
      }
    }

    try {
      signMessageError.value = false;
      // Generate a raw authorization string via SDK
      if (!options?.includeTime && !options?.forceNew) {
        authInFlight = nosana.value.authorization.generate('Hello Nosana Node!', {
          includeTime: false,
        });
      }
      const authString = !options?.includeTime && !options?.forceNew
        ? await authInFlight!
        : await nosana.value.authorization.generate('Hello Nosana Node!', {
            includeTime: options?.includeTime ?? false,
          });

      // Cache only if not time-bound
      if (!options?.includeTime) {
        cachedAuthString.value = authString;
        saveCachedAuth(authString);
      }

      const headers = new Headers();
      headers.set(key, authString);
      authInFlight = null;
      return headers;
    } catch (error) {
      console.error('authorization.generate error:', error);
      signMessageError.value = true;
      authInFlight = null;
      throw error as Error;
    }
  };

  watch(
    publicKey,
    async (newPublicKey, oldPublicKey) => {
      // Clear in-memory cache on any wallet change
      cachedAuthString.value = null;
      // Reset session cache when wallet disconnects or switches
      if (!newPublicKey || (oldPublicKey && newPublicKey?.toString() !== oldPublicKey?.toString())) {
        clearCachedAuth();
      }
      // Refresh sessionAuthRef from storage (will null out if owner mismatch)
      sessionAuthRef.value = loadCachedAuth();
    },
    { immediate: true }
  );

  return {
    userBalances,
    connected,
    publicKey,
    generateAuthHeaders,
    hasSessionAuth,
  };
}
