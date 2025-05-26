import SolanaWallets from "solana-wallets-vue";

// You can either import the default styles or create your own.
import "solana-wallets-vue/styles.css";

import { WalletAdapterNetwork, WalletReadyState } from "@solana/wallet-adapter-base";

import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

const walletOptions = {
  wallets: [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network: WalletAdapterNetwork.Devnet }),
  ],
  autoConnect: true,
};

export default defineNuxtPlugin((nuxtContext) => {
  const app = nuxtContext.vueApp;
  app.use(SolanaWallets, walletOptions);
  
  // Listen for wallet readyState changes to detect newly available wallets
  if (process.client) {
    const checkWalletAvailability = () => {
      walletOptions.wallets.forEach(wallet => {
        if (wallet.readyState === WalletReadyState.NotDetected) {
          // Force re-check wallet availability
          setTimeout(() => {
            wallet.emit('readyStateChange', wallet.readyState);
          }, 1000);
        }
      });
    };
    
    // Check periodically for newly available wallets
    setInterval(checkWalletAvailability, 3000);
  }
});
