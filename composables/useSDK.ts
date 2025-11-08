import { Client, type ClientConfig } from "@nosana/sdk";
import {
  useAnchorWallet,
  type AnchorWallet,
  useWallet,
} from "solana-wallets-vue";
const config = useRuntimeConfig();

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
            if (typeof document === 'undefined') return undefined;
            try {
              const fullKey = `nosana_auth_${config.public.network}_${key}`;
              // Fast in-memory cache with TTL (4m)
              const mem = (globalThis as any).__nosanaDashAuthMem as Map<string, { v: string, e: number }> || new Map();
              (globalThis as any).__nosanaDashAuthMem = mem;
              const now = Date.now();
              const hit = mem.get(fullKey);
              if (hit && now < hit.e) {
                return hit.v;
              }

              // LocalStorage fallback (UI-managed TTL)
              try {
                const raw = localStorage.getItem(fullKey);
                if (raw) {
                  const obj = JSON.parse(raw) as { v: string; e: number };
                  if (obj && typeof obj.v === 'string' && typeof obj.e === 'number' && now < obj.e) {
                    mem.set(fullKey, { v: obj.v, e: obj.e });
                    return obj.v;
                  } else {
                    localStorage.removeItem(fullKey);
                  }
                }
              } catch {}

              const { default: Cookies } = require('universal-cookie');
              const cookies = new Cookies();
              const val = cookies.get(fullKey) as (string | undefined);
              if (val) {
                mem.set(fullKey, { v: val, e: now + 240_000 });
                try { localStorage.setItem(fullKey, JSON.stringify({ v: val, e: now + 240_000 })); } catch {}
              }
              return val;
            } catch {
              return undefined;
            }
          },
          set: (key: string, value: string): void => {
            if (typeof document === 'undefined') return;
            try {
              const fullKey = `nosana_auth_${config.public.network}_${key}`;
              // Update in-memory cache first
              const mem = (globalThis as any).__nosanaDashAuthMem as Map<string, { v: string, e: number }> || new Map();
              (globalThis as any).__nosanaDashAuthMem = mem;
              mem.set(fullKey, { v: value, e: Date.now() + 240_000 });

              // Persist to localStorage with TTL metadata
              try { localStorage.setItem(fullKey, JSON.stringify({ v: value, e: Date.now() + 240_000 })); } catch {}

              const { default: Cookies } = require('universal-cookie');
              const cookies = new Cookies();
              const secure = typeof location !== 'undefined' && location.protocol === 'https:';
              cookies.set(fullKey, value, {
                maxAge: 240, // seconds
                sameSite: 'strict',
                path: '/',
                secure,
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
