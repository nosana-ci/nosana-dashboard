import { Client, type ClientConfig } from '@nosana/sdk';
import { useWallet, useAnchorWallet, type AnchorWallet } from "solana-wallets-vue";
// const { connected } = useWallet();
let wallet: Ref<AnchorWallet | undefined>;

// TODO config env
const network = 'devnet';

const nosana = computed(() => {
  try {
    wallet = useAnchorWallet();
  } catch (error) {}

  const config: Partial<ClientConfig> = {
    solana: {
      network:
        network === 'devnet'
          ? 'https://rpc.ironforge.network/devnet?apiKey=01HFRX48N027P9XQ07KH3DHBEA'
          : 'https://rpc.ironforge.network/mainnet?apiKey=01HFRX48N027P9XQ07KH3DHBEA',
      jobs_address:
        network === 'devnet'
          ? 'nosJTmGQxvwXy23vng5UjkTbfv91Bzf9jEuro78dAGR'
          : 'nosJhNRqr2bc9g1nfGDcXXTXvYUmxD4cVwy2pMWhrYM',
      nos_address:
        network === 'devnet'
          ? 'devr1BGQndEW5k5zfvG5FsLyZv1Ap73vNgAHcQ9sUVP'
          : 'nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7',
      pool_address:
        network === 'devnet'
          ? 'miF9saGY5WS747oia48WR3CMFZMAGG8xt6ajB7rdV3e'
          : '6CJ9UPNnXzcwuLSE9ebTz4FPbBw1VXJkPxDgTi9ybHBj',
      pools_address: 'nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD',
      rewards_address: 'nosRB8DUV67oLNrL45bo2pFLrmsWPiewe2Lk2DRNYCp',
    },
  };
  if (wallet && wallet.value) {
    config.solana!.wallet = wallet.value;
  }

  return new Client(config);
});

export const useSDK = () => {
  return { nosana, network };
};
