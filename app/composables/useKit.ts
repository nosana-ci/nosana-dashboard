import { createNosanaClient, type NosanaClient, NosanaNetwork, type AuthorizationStore, type GenerateOptions, type Wallet, type PartialClientConfig } from "@nosana/kit";
import { useWalletAccountPartialSigner, useWallet } from "@nosana/solana-vue";
import { computed, ref, watch } from "vue";
import { useCookies } from '@vueuse/integrations/useCookies';
import type { CookieSetOptions } from 'universal-cookie';
import { createAuthCookiesKey } from "~/utils/createAuthCookiesKey";

const config = useRuntimeConfig();

const prioFee = useLocalStorage("prio-fee", {
  strategy: "medium",
  staticFee: 100000,
  dynamicPriorityFee: true,
  maxPriorityFee: 15000000,
});

const AUTH_COOKIE_MAX_AGE_SECONDS = 300; // 5 minutes

const cookieOptions: CookieSetOptions = {
  maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  sameSite: 'strict',
  path: '/',
  secure: typeof location !== 'undefined' && location.protocol === 'https:',
};

const network = config.public.network === "devnet"
  ? NosanaNetwork.DEVNET
  : NosanaNetwork.MAINNET;

const currentChain = config.public.network === "devnet"
  ? "solana:devnet"
  : "solana:mainnet";

export function useKit() {
  const { status, token } = useAuth();
  
  // Use useWallet from @nosana/solana-vue (re-exported from wallet-standard-vue)
  const { account, connected: walletConnected } = useWallet();
  
  const creditAuthToken = computed(() => {
    if (status.value === 'authenticated' && token.value) {
      return token.value;
    }
    return null;
  });
  
  // retrieve Wallet from UiWalletAccount.
  const wallet: Ref<Wallet | null> = useWalletAccountPartialSigner(account, currentChain);
  
  const connected = computed(() => walletConnected.value && account.value !== null);
  
  const nosana = ref<NosanaClient>(createNosanaClient(network));
  
  const createAuthorizationStore = (): AuthorizationStore['actions'] | undefined => {
    if (!account.value?.address || process.server) {
      return undefined;
    }

    const cookies = useCookies();

    return {
      get: async (identifier: string, options: Omit<GenerateOptions, "store">): Promise<string | undefined> => {
        return cookies.get(createAuthCookiesKey(identifier)) || undefined;
      },
      set: (identifier: string, options: Omit<GenerateOptions, "store">, value: string | undefined): void => {
        const cookieKey = createAuthCookiesKey(identifier);
        if (value) {
          cookies.set(cookieKey, value, cookieOptions);
        } else {
          cookies.remove(cookieKey);
        }
      },
    };
  };

  watch(
    [creditAuthToken, wallet, account],
    ([apiKey, walletAdapter]) => {
      const backendUrl = config.public.backend_url as string | undefined;
      const rpcUrl = config.public.rpcUrl as string | undefined;
      const store = !apiKey && account.value?.address ? createAuthorizationStore() : undefined;
      
      const clientConfig: PartialClientConfig = {};
      
      if (apiKey || backendUrl) {
        clientConfig.api = {};
        if (apiKey) clientConfig.api.apiKey = apiKey;
        if (backendUrl) clientConfig.api.backend_url = backendUrl;
      }
      
      if (store) {
        clientConfig.authorization = { store };
      }
      
      if (rpcUrl) {
        clientConfig.solana = { rpcEndpoint: rpcUrl };
      }
      
      if (!apiKey && walletAdapter && account.value?.address) {
        clientConfig.wallet = walletAdapter;
      }
      
      const client = createNosanaClient(network, Object.keys(clientConfig).length > 0 ? clientConfig : undefined);
      
      // Set wallet directly on client to ensure reactive updates
      if (!apiKey && walletAdapter && account.value?.address) {
        client.wallet = walletAdapter;
      }
      
      nosana.value = client;
    },
    { immediate: true }
  );

  const publicKey = computed(() => {
    if (account.value?.address) {
      return {
        toString: () => account.value!.address,
        toBase58: () => account.value!.address,
      };
    }
    return null;
  });

  return {
    nosana: computed(() => nosana.value),
    publicKey,
    connected,
    prioFee,
  };
}
