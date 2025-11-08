import { useWallet } from "solana-wallets-vue";
import Cookies from "universal-cookie";

import type { MessageSignerWalletAdapter } from "@solana/wallet-adapter-base";

export function useNosanaWallet() {
  const { nosana } = useSDK();
  const { connected, publicKey, wallet } = useWallet();
  const runtime = useRuntimeConfig().public;
  const cookies = new Cookies();
  const buildCookiesKey = (owner: string) => `nosana_node_auth_${runtime.network}_${owner}`;

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

  // Cache keys and TTL (cookies only)
  const DEFAULT_TTL_SECONDS = 10 * 60; // 10 minutes
  const cookieKeyFor = (owner: string | undefined): string | null =>
    owner ? buildCookiesKey(owner) : null;

  const loadCachedAuth = (): string | null => {
    try {
      const owner = publicKey.value?.toString();
      const cookieKey = cookieKeyFor(owner);
      if (!cookieKey) return null;
      const fromCookie = cookies.get(cookieKey) as string | undefined;
      return fromCookie ?? null;
    } catch {
      return null;
    }
  };

  const saveCachedAuth = (value: string, ttlSeconds = DEFAULT_TTL_SECONDS) => {
    try {
      const owner = publicKey.value?.toString();
      const key = cookieKeyFor(owner);
      if (key) {
        const secure = typeof location !== 'undefined' && location.protocol === 'https:';
        cookies.set(key, value, {
          maxAge: ttlSeconds,
          sameSite: 'strict',
          path: '/',
          secure,
        });
      }
    } catch {
      /* ignore */
    }
  };

  const clearCachedAuth = () => {
    try {
      const owner = publicKey.value?.toString();
      const key = cookieKeyFor(owner);
      if (key) cookies.remove(key, { path: '/' });
    } catch {
      /* ignore */
    }
  };

  const signMessageError = ref(false);
  const hasSessionAuth = computed<boolean>(() => Boolean(loadCachedAuth()));
  // Transient in-flight dedupe using a shared Promise
  let nodeAuthPromise: Promise<string> | null = null;

  const generateAuthHeaders = async (
    options?: { key?: string; includeTime?: boolean; forceNew?: boolean }
  ): Promise<Headers> => {
    
    if (!connected.value || !publicKey.value) {
      throw new Error("Wallet not connected or not found");
    }

    const key = options?.key ?? 'Authorization';

    // Fast path: cached or coalesce concurrent generate calls
    if (!options?.includeTime && !options?.forceNew) {
      const cached = loadCachedAuth();
      if (cached) {
        const headers = new Headers();
        headers.set(key, cached);
        return headers;
      }
      if (nodeAuthPromise) {
        const inFlight = await nodeAuthPromise;
        const headers = new Headers();
        headers.set(key, inFlight);
        return headers;
      }
    }

    try {
      signMessageError.value = false;
      const isTimeBound = options?.includeTime ?? false;
      const authString =
        (isTimeBound || options?.forceNew)
          ? await nosana.value.authorization.generate('Hello Nosana Node!', { includeTime: isTimeBound })
          : await (nodeAuthPromise ||= nosana.value.authorization
              .generate('Hello Nosana Node!', { includeTime: false })
              .then((s) => {
                saveCachedAuth(s);
                return s;
              })
              .finally(() => {
                nodeAuthPromise = null;
              }));

      // Cache only if not time-bound
      if (!options?.includeTime) {
        saveCachedAuth(authString);
      }

      const headers = new Headers();
      headers.set(key, authString);
      return headers;
    } catch (error) {
      console.error('authorization.generate error:', error);
      signMessageError.value = true;
      throw error as Error;
    }
  };

  watch(
    publicKey,
    async (newPublicKey, oldPublicKey) => {
      if (!newPublicKey || (oldPublicKey && newPublicKey?.toString() !== oldPublicKey?.toString())) {
        clearCachedAuth();
      }
    },
    { immediate: true }
  );

  return {
    userBalances,
    connected,
    publicKey,
    generateAuthHeaders,
    hasSessionAuth,
    loadCachedAuth,
  };
}
