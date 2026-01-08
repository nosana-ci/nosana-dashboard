import { createNosanaClient, type NosanaClient, NosanaNetwork, type AuthorizationStore, type GenerateOptions, type Wallet } from "@nosana/kit";
import { useWalletAccountSigner, useWalletAccountTransactionSigner, useWallet } from "@nosana/solana-vue";
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
  
  // Combine signers to create a complete Wallet (MessageSigner & TransactionSigner)
  const walletSigner = useWalletAccountSigner(account, currentChain);
  const transactionSigner = useWalletAccountTransactionSigner(account, currentChain);
  
  const wallet = computed<Wallet | null>(() => {
    if (!account.value?.address) {
      return null;
    }
    
    const sendingSigner = walletSigner.value;
    const signingSigner = transactionSigner.value;
    
    if (!sendingSigner || !signingSigner) {
      return null;
    }
    
    // Combine both signers - signingSigner should have signTransaction/signTransactions
    // The order matters: signingSigner last so its methods override sendingSigner if there are conflicts
    const combinedWallet: any = {
      ...sendingSigner,
      ...signingSigner,
      address: account.value.address,
    };
    
    // If wallet has modifyAndSignTransactions but not signTransactions, create a wrapper
    // modifyAndSignTransactions returns Transaction[], but signTransactions should return SignatureDictionary[]
    // We need to extract signatures from the modified transactions
    if ('modifyAndSignTransactions' in combinedWallet && !('signTransactions' in combinedWallet)) {
      const originalModifyAndSign = combinedWallet.modifyAndSignTransactions;
      combinedWallet.signTransactions = async (transactions: any[]) => {
        // Call modifyAndSignTransactions which returns modified transactions with signatures
        const modifiedTransactions = await originalModifyAndSign.call(combinedWallet, transactions);
        // Extract signatures from the modified transactions
        // Each transaction has a signatures property which is a SignatureDictionary
        return modifiedTransactions.map((tx: any) => {
          if (tx && typeof tx === 'object' && 'signatures' in tx) {
            return tx.signatures;
          }
          // Fallback: return empty dict if structure is unexpected
          return {};
        });
      };
    }
    
    // If wallet has modifyAndSignMessages but not signMessages, add signMessages as alias
    if ('modifyAndSignMessages' in combinedWallet && !('signMessages' in combinedWallet)) {
      combinedWallet.signMessages = combinedWallet.modifyAndSignMessages;
    }
    
    return combinedWallet as Wallet;
  });
  
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
      
      const clientConfig: {
        api?: { apiKey?: string; backend_url?: string };
        authorization?: { store: AuthorizationStore['actions'] };
        solana?: { rpcEndpoint: string };
        wallet?: typeof walletAdapter;
      } = {};
      
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
