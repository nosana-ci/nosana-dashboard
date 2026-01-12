// Import styles for wallet modal and button
import "@nosana/solana-vue/styles";

export default defineNuxtPlugin(() => {
  // The wallet-standard library auto-discovers wallets from browser extensions
  // No manual wallet adapter configuration needed
  // WalletProvider is configured in app.vue with autoConnect enabled
});
