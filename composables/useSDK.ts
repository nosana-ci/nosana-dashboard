import { Client, type ClientConfig } from "@nosana/sdk";
import Cookies from "universal-cookie";
import {
  useAnchorWallet,
  type AnchorWallet,
  useWallet,
} from "solana-wallets-vue";
const config = useRuntimeConfig();
const cookies = new Cookies();
const buildCookiesKey = (key: string) => `nosana_auth_${config.public.network}_${key}`;

const prioFee = useLocalStorage("prio-fee", {
  strategy: "medium",
  staticFee: 100000,
  dynamicPriorityFee: true,
  maxPriorityFee: 15000000,
});

const nosana = computed(() => {
  // Include wallet connection state to trigger reactivity when wallet connects/disconnects
  const { connected, publicKey } = useWallet();
  // Include auth token so API client updates when session changes
  const { token } = useAuth();
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
      // Provide cookie-backed auth store (client-only)
      authorization: {
        store: {
          get: (key: string): string | undefined => {
            try {
              return cookies.get(buildCookiesKey(key)) as (string | undefined);
            } catch {
              return undefined;
            }
          },
          set: (key: string, value: string): void => {
            if (typeof document === 'undefined') return;
            try {
              cookies.set(buildCookiesKey(key), value, {
                maxAge: 240, // seconds
                sameSite: 'strict',
                path: '/',
                secure: typeof location !== 'undefined' && location.protocol === 'https:',
              });
            } catch {
              /* ignore */
            }
          },
        }
      }
    }
  };

  const client = new Client(
    // @ts-ignore - Todo: fix config typing
    config.public.network,
    walletValue,
    clientConfig
  );

  try { /* SDK Client created */ } catch {}
  return client;
});

export const useSDK = () => {
  return { nosana, prioFee };
};
