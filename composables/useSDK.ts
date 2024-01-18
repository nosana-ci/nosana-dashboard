import { Client } from '@nosana/sdk';
import { useWallet, useAnchorWallet } from "solana-wallets-vue";
const wallet = useAnchorWallet();
// TODO config env
const network = 'devnet';

const nosana = computed(() => {
  return new Client({
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
          : 'mineHEHiHxWS8pVkNc5kFkrvv5a9xMVgRY9wfXtkMsS',
      pools_address: 'nosPdZrfDzND1LAR28FLMDEATUPK53K8xbRBXAirevD',
      // @ts-ignore
      wallet: wallet.value
    },
  });
});
export const useSDK = () => {
  return { nosana, network };
};
