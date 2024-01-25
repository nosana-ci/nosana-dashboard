import { Client, type ClientConfig } from '@nosana/sdk';
import { useAnchorWallet, type AnchorWallet } from "solana-wallets-vue";
const config = useRuntimeConfig()
let wallet: Ref<AnchorWallet | undefined>;

const network = config.public.network;

const nosana = computed(() => {
  try {
    wallet = useAnchorWallet();
  } catch (error) {}

  console.log('config', config.public);
  const clientConfig: Partial<ClientConfig> = {
    solana: {
      network: config.public.rpcUrl,
      jobs_address: config.public.jobs_address,
      nos_address: config.public.nos_address,
      pool_address: config.public.pool_address,
      pools_address: config.public.pools_address,
      rewards_address: config.public.rewards_address,
    },
  };
  if (wallet && wallet.value) {
    clientConfig.solana!.wallet = wallet.value;
  }

  return new Client(clientConfig);
});

export const useSDK = () => {
  return { nosana, network };
};
