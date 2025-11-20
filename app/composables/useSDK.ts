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
    api: {
      backend_url: config.public.apiBase,
    },
    apiKey: (token.value as any) || undefined,
  };

  return new Client(
    // @ts-ignore - Todo: fix config typing
    config.public.network,
    walletValue,
    clientConfig
  );
});

export const useSDK = () => {
  return { nosana, prioFee };
};
