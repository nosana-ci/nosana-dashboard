// Import styles for wallet modal and button
import "@nosana/solana-vue/styles";
import { useMobileWalletAdapter } from "@nosana/solana-vue";

export default defineNuxtPlugin({
  name: 'mobile-wallet-adapter',
  enforce: 'pre', // Must run before WalletProvider initializes
  setup() {
    // The wallet-standard library auto-discovers wallets from browser extensions
    // No manual wallet adapter configuration needed
    // WalletProvider is configured in app.vue with autoConnect enabled

    // Register Mobile Wallet Adapter for mobile device support
    // Note: Requires HTTPS (secure context) to work
    if (process.client && typeof window !== "undefined") {
      // Get app URI from current origin
      const appUri = window.location.origin;

      useMobileWalletAdapter({
        appIdentity: {
          name: "Nosana Deploy",
          uri: appUri,
          icon: "/icon.png", // relative path resolves to {uri}/icon.png
        },
      });
    }
  }
});
