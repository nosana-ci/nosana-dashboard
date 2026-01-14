// Import styles for wallet modal and button
import "@nosana/solana-vue/styles";
import { useMobileWalletAdapter } from "@nosana/solana-vue";

export default defineNuxtPlugin(() => {
  // The wallet-standard library auto-discovers wallets from browser extensions
  // No manual wallet adapter configuration needed
  // WalletProvider is configured in app.vue with autoConnect enabled

  // Register Mobile Wallet Adapter for mobile device support
  if (process.client) {
    // Get app URI from current origin
    const appUri = typeof window !== "undefined" ? window.location.origin : "https://deploy.nosana.com";

    useMobileWalletAdapter({
      appIdentity: {
        name: "Nosana Deploy",
        uri: appUri,
        icon: "/icon.png", // relative path resolves to {uri}/icon.png
      },
    });
  }
});
