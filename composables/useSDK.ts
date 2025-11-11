import { Client, type ClientConfig } from "@nosana/sdk";
import { useCookies } from '@vueuse/integrations/useCookies'
import {
  useAnchorWallet,
  type AnchorWallet,
  useWallet,
} from "solana-wallets-vue";
import type { CookieSetOptions } from "universal-cookie";

import { createAuthCookiesKey } from "~/utils/createAuthCookiesKey";

const config = useRuntimeConfig();

const prioFee = useLocalStorage("prio-fee", {
  strategy: "medium",
  staticFee: 100000,
  dynamicPriorityFee: true,
  maxPriorityFee: 15000000,
});

const cookieOptions: CookieSetOptions = {
  maxAge: 300,
  sameSite: 'strict',
  path: '/',
  secure: typeof location !== 'undefined' && location.protocol === 'https:',
}

const nosana = computed(() => {
  // Include auth token so API client updates when session changes
  const { token } = useAuth();
  // Include wallet connection state to trigger reactivity when wallet connects/disconnects
  const { connected, publicKey } = useWallet();
  const cookies = useCookies(publicKey.value ? [createAuthCookiesKey(publicKey.value.toString())] : []);

  // Promise queue to ensure get waits for pending set operations
  let pendingSetPromise: Promise<void> | null = null;
  let pendingSetResolve: (() => void) | null = null;

  cookies.addChangeListener((cookie) => {
    if (cookie.name === createAuthCookiesKey(publicKey.value?.toString() || '') && cookie.value) {
      if (cookie.options?.maxAge) {
        const cookieParts = cookie.value.split(':');
        if (cookieParts.length === 3) {
          setTimeout(() => {
            cookies.set(createAuthCookiesKey(publicKey.value!.toString()), `${cookieParts[0]}:${cookieParts[1]}:${Date.now()}`, cookieOptions);
          }, (cookie.options.maxAge - 10) * 1000);
        }
      }
    }
  });

  let wallet: Ref<AnchorWallet | undefined>;

  try {
    wallet = useAnchorWallet();
  } catch (error) {
    wallet = ref(undefined);
  }

  // Ensure we have both connection state and wallet before creating client
  const walletValue = connected.value && publicKey.value && wallet?.value ? wallet.value : undefined;

  // Derive apiKey without using 'any'
  const apiKeyValue: string | undefined =
    typeof token.value === 'string' && token.value.trim().length > 0 ? token.value : undefined;

  const clientConfig: Partial<ClientConfig> = {
    solana: {
      network: config.public.rpcUrl,
      priority_fee: prioFee.value.staticFee,
      dynamicPriorityFee: prioFee.value.dynamicPriorityFee,
      // @ts-ignore - Todo: fix config typing
      priorityFeeStrategy:
        prioFee.value.strategy === "disable"
          ? "medium"
          : prioFee.value.strategy,
    },
    apiKey: apiKeyValue,
    api: {
      backend_url: config.public.apiBase,
    },
    authorization: {
      store: {
        get: async (key: string): Promise<string | undefined> => {
          const cookie = cookies.get(createAuthCookiesKey(key));
          if (cookie) return cookie;

          if (pendingSetPromise) {
            await pendingSetPromise;
          } else {
            pendingSetPromise = new Promise<void>((resolve) => {
              pendingSetResolve = resolve;
            });
          }

          return cookies.get(createAuthCookiesKey(key));
        },
        set: (key, _, value): void => {
          if (value) {
            cookies.set(createAuthCookiesKey(key), value, cookieOptions);
          } else {
            cookies.remove(createAuthCookiesKey(key));
          }

          if (pendingSetResolve) {
            pendingSetResolve();
            pendingSetResolve = null;
            pendingSetPromise = null;
          }
        },
      }
    }
  };

  const client = new Client(
    // @ts-ignore - Todo: fix config typing
    config.public.network,
    walletValue,
    clientConfig
  );

  return client;
});

export const useSDK = () => {
  return { nosana, prioFee };
};
