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

const AUTH_COOKIE_MAX_AGE_SECONDS = 300; // 5 minutes
const AUTH_COOKIE_REFRESH_BUFFER_SECONDS = 10; // Refresh 10 seconds before expiry

const cookieOptions: CookieSetOptions = {
  maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
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
            const keyString = publicKey.value?.toString();
            if (!keyString) return;
            cookies.set(createAuthCookiesKey(keyString), `${cookieParts[0]}:${cookieParts[1]}:${Date.now()}`, cookieOptions);
          }, (cookie.options.maxAge - AUTH_COOKIE_REFRESH_BUFFER_SECONDS) * 1000);
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

  const solanaConfig = {
    network: config.public.rpcUrl,
    priority_fee: prioFee.value.staticFee,
    dynamicPriorityFee: prioFee.value.dynamicPriorityFee,
    priorityFeeStrategy:
      prioFee.value.strategy === "disable"
        ? "medium"
        : prioFee.value.strategy,
  } as unknown as ClientConfig["solana"];

  type AuthStore = {
    authorization: {
      store: {
        get: (key: string) => Promise<string | undefined>;
        set: (key: string, _: unknown, value?: string) => void;
      };
    };
  };

  type ClientConfigWithAuth = Partial<ClientConfig> & AuthStore;

  const clientConfig: ClientConfigWithAuth = {
    solana: solanaConfig,
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
        set: (key: string, _: unknown, value: string | undefined): void => {
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

  const network = (config.public.network === "devnet" || config.public.network === "mainnet")
    ? config.public.network
    : "mainnet";
  const client = new Client(network, walletValue as unknown as any, clientConfig as unknown as ClientConfig);

  return client;
});

export const useSDK = () => {
  return { nosana, prioFee };
};
