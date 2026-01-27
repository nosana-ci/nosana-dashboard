<template>
  <div class="login-page" :class="{ 'dark-mode': isDarkMode }">
    <!-- Main Content -->
    <div class="content-wrapper">
      <!-- World Map Background -->
      <div class="world-map-background">
        <img :key="backgroundImageKey" src="/img/worldmap.png" alt="" class="world-map-image" />
      </div>
      <!-- Center Login Card -->
      <div class="login-card-container">
        <div class="login-card">
          <!-- Header with Logo -->
          <div class="login-header">
            <logo width="120px" :animated="true" class="light-only" />
            <logo
              width="120px"
              :white="true"
              class="dark-only"
              :animated="true"
            />
          </div>

          <!-- Main Login Content -->
          <div class="login-content">
            <h1 class="login-title">
              {{ isCampaignMode ? 'Claim your Free Credits' : 'Build with Nosana' }}
            </h1>
            <p class="login-subtitle">
              {{ isCampaignMode 
                ? 'Sign in or create an account to receive $50 in free compute credits.' 
                : 'Sign in or create an account to build with the Nosana AI Platform' 
              }}
            </p>

            <!-- Google Login Button -->
            <button
              class="login-button google-button"
              @click="selectGoogleLogin"
              :disabled="googleLoading"
              :class="{ 'is-loading': googleLoading }"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            <button
              class="login-button twitter-button"
              @click="selectTwitterLogin"
              :disabled="twitterLoading"
              :class="{ 'is-loading': twitterLoading }"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                />
              </svg>
              Continue with X
            </button>

            <template v-if="!isCampaignMode">
              <div class="divider">
                <span>OR</span>
              </div>

              <!-- Wallet Connection Button -->
              <div class="wallet-section">
                <!-- Connection Status -->
                <div v-if="connected && account" class="wallet-connection-status">
                  <div class="status-indicator">
                    <span class="status-dot connected"></span>
                    <span class="status-text">
                      Connected: {{ getWalletName() || 'Unknown Wallet' }}
                    </span>
                  </div>
                  <div v-if="account?.address" class="wallet-address">
                    {{ account.address.substring(0, 8) }}...{{ account.address.substring(account.address.length - 6) }}
                  </div>
                  <div v-if="signingMessage" class="signing-status">
                    <span class="status-dot signing"></span>
                    Signing authentication message to login...
                  </div>
                  <div v-if="!signingMessage && !signMessageError && connected && account" class="sign-message-section">
                    <button 
                      class="sign-message-button" 
                      @click="handleSignMessage"
                      :disabled="signingMessage"
                    >
                      Sign Message to Login
                    </button>
                  </div>
                  <div v-if="signMessageError && !signingMessage" class="signing-error">
                    <span class="error-text">Signing failed</span>
                    <button class="retry-button" @click="retrySignMessage" :disabled="signingMessage">
                      Retry Signing
                    </button>
                  </div>
                </div>
                
                <button
                  v-if="!connected"
                  class="login-button wallet-button"
                  @click="handleWalletConnect"
                  :disabled="signingMessage"
                  :class="{ 'is-loading': signingMessage }"
                >
                  <WalletIcon :size="20" />
                  {{
                    signingMessage ? "Signing Message..." : "Select Wallet"
                  }}
                </button>
                
                <button
                  v-else
                  class="login-button wallet-button"
                  @click="handleDisconnect"
                  :disabled="signingMessage"
                >
                  <WalletIcon :size="20" />
                  Disconnect Wallet
                </button>
              </div>
            </template>

            <!-- Wallet Selection Modal -->
            <div
              v-if="showWalletModal"
              class="wallet-selection-modal"
              @click="showWalletModal = false"
            >
              <div class="wallet-modal-content" @click.stop>
                <h3 class="wallet-modal-title">Select a Wallet</h3>
                <div class="wallet-list">
                  <div
                    v-for="wallet in wallets"
                    :key="wallet.name"
                    class="wallet-item"
                    @click="selectWallet(wallet)"
                  >
                    <img
                      :src="wallet.icon"
                      :alt="wallet.name"
                      class="wallet-icon"
                    />
                    <span class="wallet-name">{{ wallet.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- <Loader v-if="loading" /> -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useWallet } from "@nosana/solana-vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { generateCodeVerifier, generateCodeChallenge } from "~/utils/pkce";
import { trackEvent } from "~/utils/analytics";
import WalletIcon from "~/components/WalletIcon.vue";
import Loader from "~/components/Loader.vue";
import { useAPI } from "~/composables/useAPI";
import { useNosanaWallet } from "~/composables/useNosanaWallet";

definePageMeta({
  layout: false, // No sidebar/layout for login page
});

const { connected, disconnect, connect, account } = useWallet();
import { useSolanaWallets } from "@nosana/solana-vue";
const { wallets } = useSolanaWallets();
const { generateAuthHeaders, signMessageError } = useNosanaWallet();

// Compatibility: create publicKey-like object from account
const publicKey = computed(() => {
  if (!account.value?.address) return null;
  return {
    toString: () => account.value!.address,
    toBase58: () => account.value!.address,
  };
});
const { status, signOut, data: userData } = useAuth();
const router = useRouter();
const route = useRoute();
const toast = useToast();
const config = useRuntimeConfig().public;

const googleLoading = ref(false);
const twitterLoading = ref(false);
const showWalletModal = ref(false);
const codeVerifier = ref("");
const loading = ref(false);
const signingMessage = ref(false);
const backgroundImageKey = ref(0);
const currentWalletName = ref<string | null>(null);

// Get wallet name from account or stored name
const getWalletName = () => {
  if (currentWalletName.value) {
    return currentWalletName.value;
  }
  if (account.value) {
    // Try to find wallet name from wallets list
    const wallet = wallets.value?.find((w: any) => w.accounts?.some((acc: any) => acc.address === account.value?.address));
    return wallet?.name || 'Connected Wallet';
  }
  return null;
};

// Handle disconnect
const handleDisconnect = async () => {
  try {
    await disconnect();
    currentWalletName.value = null;
    toast.info('Wallet disconnected');
  } catch (error) {
    toast.error('Failed to disconnect wallet');
  }
};

// Handle sign message button click (user gesture required for mobile wallets)
const handleSignMessage = async () => {
  if (!currentWalletName.value) {
    toast.error('No wallet name stored. Please reconnect.');
    return;
  }
  
  if (!connected.value || !account.value) {
    toast.error('Wallet not connected. Please reconnect.');
    return;
  }
  
  // Clear any previous error
  if (signMessageError) {
    signMessageError.value = false;
  }
  
  await signAuthMessage(currentWalletName.value);
};

// Retry signing message
const retrySignMessage = async () => {
  if (!currentWalletName.value) {
    toast.error('No wallet name stored. Please reconnect.');
    return;
  }
  
  // Clear error state
  if (signMessageError) {
    signMessageError.value = false;
  }
  
  // Wait a moment before retrying (this seems to help with mobile wallets)
      await new Promise(resolve => setTimeout(resolve, 500));
  
  await signAuthMessage(currentWalletName.value);
};

// Watch for auto-connect and set wallet name if not already set
watch([connected, account, wallets], () => {
  // Only set wallet name if connected, has account, and wallet name is not already set
  if (connected.value && account.value && !currentWalletName.value && wallets.value && wallets.value.length > 0) {
    // Find the wallet that matches the connected account
    const wallet = wallets.value.find((w: any) => 
      w.accounts?.some((acc: any) => acc.address === account.value?.address)
    );
    
    if (wallet?.name) {
      currentWalletName.value = wallet.name;
    }
  }
}, { immediate: true });

const isCampaignMode = computed(() => {
  // Check for specific campaign code, but only if not in an OAuth popup flow
  return route.query.context === 'get-started' && (typeof window !== 'undefined' && !window.opener);
});

// Redirect if already authenticated (for Google/Twitter login)
// Wallet redirects are handled manually after message signing
watch(
  status,
  (authStatus) => {
    if (authStatus === "authenticated") {
      const redirect =
        (router.currentRoute.value.query.redirect as string) || "/account";
      router.replace(redirect);
    }
  },
  { immediate: true }
);

// Check if user is already authenticated on mount
onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const state = urlParams.get("state");

  if (code && window.opener) {
    // This is a popup window completing OAuth (Google or Twitter)

    // Check if this is Twitter (has state param) or Google
    if (state) {
      // Twitter OAuth
      window.opener.postMessage(
        {
          type: "TWITTER_AUTH_CODE",
          code: code,
          state: state,
        },
        window.location.origin
      );
    } else {
      // Google OAuth
      window.opener.postMessage(
        {
          type: "GOOGLE_AUTH_CODE",
          code: code,
        },
        window.location.origin
      );
    }
    window.close();
    return;
  }

  // Check if we're returning from a mobile wallet connection
  // Mobile Wallet Adapter uses Android Intents which may redirect back
  // The auto-connect should handle this, but give it a moment to restore state
  if (!connected.value && wallets.value && wallets.value.length > 0) {
    // Wait a bit for auto-connect to restore connection state
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check connection state after waiting
    if (connected.value && account.value) {
      // Ensure wallet name is set (watcher should handle this, but double-check here)
      if (!currentWalletName.value && wallets.value && wallets.value.length > 0) {
        const wallet = wallets.value.find((w: any) => 
          w.accounts?.some((acc: any) => acc.address === account.value?.address)
        );
        if (wallet?.name) {
          currentWalletName.value = wallet.name;
        }
      }
      toast.success(`Wallet connected: ${account.value.address.substring(0, 8)}...`);
    } else {
      // Check if we have a mobile wallet in the list
      const hasMobileWallet = wallets.value.some((w: any) => 
        w.name?.toLowerCase().includes('mobile') || w.id?.toLowerCase().includes('mobile')
      );
      
      if (hasMobileWallet) {
        // Wait a bit more for mobile wallet connection
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (connected.value && account.value) {
          // Ensure wallet name is set
          if (!currentWalletName.value && wallets.value && wallets.value.length > 0) {
            const wallet = wallets.value.find((w: any) => 
              w.accounts?.some((acc: any) => acc.address === account.value?.address)
            );
            if (wallet?.name) {
              currentWalletName.value = wallet.name;
            }
          }
          toast.success(`Wallet connected: ${account.value.address.substring(0, 8)}...`);
        }
      }
    }
  }

  if (status.value === "authenticated") {
    const redirect =
      (router.currentRoute.value.query.redirect as string) || "/account";
    router.replace(redirect);
  }
});

// Stats data
const { data: runningNodesData } = useAPI("/api/jobs/running", {
  transform: (data: any) => {
    if (!data) return { total: 0 };
    return {
      total: Object.values(data).reduce(
        (sum: number, market: any) => sum + (market.running || 0),
        0
      ),
    };
  },
  default: () => ({ total: 0 }),
});

const colorMode = useColorMode();
const isDarkMode = computed(() => colorMode.value === "dark");

// used for event tracking, we can assume sign up if account was created within the last 10 seconds
const checkIsSignUp = (createdAt: string | undefined): boolean => {
  if (!createdAt) return false;

  const createdAtTime = new Date(createdAt).getTime();
  const now = Date.now();
  const timeDifference = now - createdAtTime;

  return timeDifference <= 10000;
};

// Google login logic
const selectGoogleLogin = async () => {
  googleLoading.value = true;
  let popup: Window | null = null;

  try {
    if (connected.value) {
      await disconnect();
    }


    const query = {
      client_id: config.googleClientId as string,
      response_type: "code",
      redirect_uri: config.googleRedirectUri as string,
      scope:
        "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    };
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams(query).toString();

    popup = window.open(
      url.toString(),
      "google-auth",
      "width=500,height=600,scrollbars=yes,resizable=yes"
    );

    if (!popup) {
      throw new Error("Popup blocked. Please allow popups for this site.");
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "GOOGLE_AUTH_CODE" && event.data.code) {
        window.removeEventListener("message", handleMessage);
        popup?.close();
        
        // Force background image re-render to fix disappearing issue
        backgroundImageKey.value++;
        
        authenticateLogin(event.data.code);
      }
    };

    window.addEventListener("message", handleMessage);
  } catch (error) {
    if (popup) popup.close();
    toast.error("Error preparing Google login");
    googleLoading.value = false;
  }
};

const authenticateLogin = async (code: string) => {
  let originalEndpoint: any;

  try {
    const { signIn } = useAuth();

    originalEndpoint = config.auth.provider.endpoints.signIn;
    config.auth.provider.endpoints.signIn = {
      path: "/api/auth/login/google",
      method: "post",
      propertyName: "token",
    };

    await signIn(
      {
        code: code,
        redirectUri: config.googleRedirectUri as string,
      },
      {
        redirect: false,
      }
    );

    config.auth.provider.endpoints.signIn = originalEndpoint;
    googleLoading.value = false;

    try {
      const isSignUp = checkIsSignUp(userData.value?.created_at);
      const eventType = isSignUp ? "sign_up" : "login";
      trackEvent(eventType, {
        user_id: userData.value?.generatedAddress,
        provider: "google",
      });
    } catch (error) {
      console.warn("Error tracking Google login:", error);
    }

    const redirect =
      (router.currentRoute.value.query.redirect as string) || "/account";
    router.replace(redirect);
  } catch (error) {
    console.error("Authentication error in authenticateLogin:", error);

    if (originalEndpoint) {
      config.auth.provider.endpoints.signIn = originalEndpoint;
    }

    toast.error("Failed to authenticate. Please try again.");
    googleLoading.value = false;
  }
};

// Wallet connection logic
const handleWalletConnect = async () => {
  try {
    if (status.value === "authenticated") {
      await signOut({ redirect: false });
    }


    if (wallets.value && wallets.value.length > 0) {
      showWalletModal.value = true;
    } else {
      // Check if we're on mobile
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      
      if (isMobile && isAndroid) {
        toast.error("No wallets found. Make sure you have a compatible Solana wallet app installed (e.g., Phantom Mobile, Solflare Mobile).");
      } else if (isMobile) {
        toast.error("Mobile Wallet Adapter is only available on Android devices.");
      } else {
        toast.error("No wallets found. Please install a Solana wallet browser extension (e.g., Phantom, Solflare).");
      }
    }
  } catch (error) {
    console.error("Error preparing wallet selection:", error);
    toast.error("Failed to prepare wallet connection.");
  }
};

const selectWallet = async (wallet: any) => {
  showWalletModal.value = false;
  const walletName = wallet.name;

  try {
    // Check if this is a mobile wallet adapter
    const isMobileWallet = walletName?.toLowerCase().includes('mobile') || 
                          wallet.id?.toLowerCase().includes('mobile');
    
    
    await connect(wallet);
    
    // For mobile wallets, the redirect might cause the page to reload
    // If we're still here, wait a bit for the connection to be established
    if (!isMobileWallet) {
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      // For mobile wallets, give it a moment before checking
      // The redirect might happen, so this code may not execute
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Check if connection was successful
    // Note: For mobile wallets, if redirect happened, this code might not execute
    // The connection will be restored by auto-connect on page reload
    if (!connected.value || !account.value) {
      // For mobile wallets, if we're not connected, it might be because
      // the page is about to redirect or has redirected
      if (isMobileWallet) {
        // Don't show error yet, let the redirect happen
        return;
      }
      
      toast.error(`Failed to connect to ${walletName}. Please try again.`);
      return;
    }

    // Store wallet name for retry functionality
    currentWalletName.value = walletName;
    
    toast.success(`Connected to ${walletName}!`);

    try {
      trackEvent("wallet_connected", {
        user_id: publicKey.value?.toString(),
        wallet: walletName,
      });
    } catch (error) {
      console.warn("Error tracking wallet connected:", error);
    }

    // For mobile wallets, don't auto-sign - Android requires user gesture to open apps
    // Show a button instead that the user must click
    const isMobileWalletAdapter = walletName?.toLowerCase().includes('mobile');
    
    if (isMobileWalletAdapter) {
      toast.success('Wallet connected! Please click "Sign Message" to login.');
      // Don't auto-sign - user must click the button (user gesture required)
      return;
    }
    
    // For non-mobile wallets, we can auto-sign
    // After connecting, wait a moment for wallet to be fully ready before signing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check wallet is still connected before signing
    if (!connected.value || !account.value) {
      toast.warning('Wallet connection lost. Please reconnect.');
      return;
    }
    
    // After connecting, trigger message signing
    await signAuthMessage(walletName);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Don't show error for mobile wallets if it's a redirect-related error
    const isRedirectError = errorMessage.includes('redirect') || 
                           errorMessage.includes('navigation') ||
                           errorMessage.includes('aborted');
    
    if (!isRedirectError) {
      toast.error(`Failed to connect to ${walletName}: ${errorMessage}`);
    } else {
      toast.info('Redirecting to wallet app...');
    }
  }
};

const signAuthMessage = async (walletName: string) => {
  signingMessage.value = true;
  const sessionCookie = useCookie<{ authenticated: boolean; address: string; timestamp: number } | null>('nosana-wallet-session');

  try {
    // Check if wallet is still connected before signing
    if (!connected.value || !account.value) {
      const errorMsg = 'Wallet disconnected before signing. Please reconnect.';
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Check if this is a mobile wallet - they may need special handling
    const isMobileWallet = walletName?.toLowerCase().includes('mobile');
    
    if (isMobileWallet) {
      // Give mobile wallet a moment to be ready and ensure connection is stable
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Double-check wallet is still connected before signing
      if (!connected.value || !account.value) {
        const errorMsg = 'Wallet disconnected before signing. Please reconnect.';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    }
    
    try {
      // For mobile wallets, signing might trigger another redirect to the wallet app
      // The page might reload after signing, so we handle that gracefully
      await generateAuthHeaders();
      
      // If we're still here (no redirect), signing was successful
    } catch (signError: any) {
      const errorMsg = signError?.message || String(signError);
      
      // Check if this is the mobile wallet protocol error
      if (errorMsg.includes('mobile wallet protocol') || errorMsg.includes('no installed wallet')) {
        toast.error('Mobile wallet not found for signing. This may happen if the wallet app closed. Please ensure Phantom/Jupiter is installed and try reconnecting.');
        
        // Check wallet state
        if (!connected.value || !account.value) {
          toast.warning('Wallet is disconnected. Please reconnect and try again.');
        }
      } else {
        toast.error(`Failed to sign message: ${errorMsg}`);
      }
      
      // Check if wallet is still connected after error
      if (!connected.value || !account.value) {
        toast.warning('Wallet disconnected during signing. This may be why the error occurred.');
      }
      // Don't throw - let the error be handled below so we can show retry button
      signingMessage.value = false;
      return; // Exit early, don't proceed with redirect
    }
    
    // Clear any previous error on success
    if (signMessageError) {
      signMessageError.value = false;
    }
    
    // Store wallet session in cookie for middleware to read
    // Middleware can't access WalletProvider context, so we use a cookie
    const walletAddress = publicKey.value?.toString();
    if (walletAddress) {
      sessionCookie.value = {
        authenticated: true,
        address: walletAddress,
        timestamp: Date.now()
      };
    } else {
      toast.warning('Wallet address not found after signing');
    }

    try {
      trackEvent("wallet_authorized", {
        user_id: walletAddress,
        wallet: walletName,
      });
    } catch (error) {
      console.warn("Error tracking wallet authorized:", error);
    }

    const redirect =
      (router.currentRoute.value.query.redirect as string) || "/account";
    
    await navigateTo(redirect);
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    toast.error(`Error: ${errorMessage}`);

    // Don't disconnect automatically - let user retry
    // Only clear session cookie
    try {
      sessionCookie.value = null;
    } catch (e) {
      // Ignore
    }
  } finally {
    signingMessage.value = false;
  }
};

// Removed immediate redirect - will handle after message signing

// Twitter login logic
const selectTwitterLogin = async () => {
  twitterLoading.value = true;
  let popup: Window | null = null;

  try {
    if (connected.value) {
      await disconnect();
    }

    codeVerifier.value = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier.value);

    const query = {
      response_type: "code",
      client_id: config.twitterClientId as string,
      redirect_uri: config.twitterRedirectUri as string,
      scope: "users.read users.email offline.access tweet.read",
      state: crypto.randomUUID(),
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    };

    const url = new URL("https://twitter.com/i/oauth2/authorize");
    url.search = new URLSearchParams(query).toString();

    popup = window.open(
      url.toString(),
      "twitter-auth",
      "width=500,height=600,scrollbars=yes,resizable=yes"
    );

    if (!popup) {
      throw new Error("Popup blocked. Please allow popups for this site.");
    }

    // Use postMessage pattern like Google OAuth instead of polling
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "TWITTER_AUTH_CODE" && event.data.code) {
        window.removeEventListener("message", handleMessage);
        popup?.close();
        
        // Force background image re-render to fix disappearing issue
        backgroundImageKey.value++;
        
        authenticateTwitterLogin(
          event.data.code,
          event.data.state || "",
          codeVerifier.value
        );
      }
    };

    window.addEventListener("message", handleMessage);
  } catch (error) {
    if (popup) popup.close();
    toast.error("Error preparing Twitter login");
    twitterLoading.value = false;
  }
};

const authenticateTwitterLogin = async (
  code: string,
  state: string,
  codeVerifier: string
) => {
  let originalEndpoint: any;

  try {
    const { signIn } = useAuth();

    originalEndpoint = config.auth.provider.endpoints.signIn;
    config.auth.provider.endpoints.signIn = {
      path: "/api/auth/login/twitter",
      method: "post",
      propertyName: "token",
    };

    await signIn(
      {
        code,
        state,
        codeVerifier,
      },
      {
        redirect: false,
      }
    );

    config.auth.provider.endpoints.signIn = originalEndpoint;
    twitterLoading.value = false;

    try {
      const isSignUp = checkIsSignUp(userData.value?.created_at);
      const eventType = isSignUp ? "sign_up" : "login";

      trackEvent(eventType, {
        user_id: userData.value?.generatedAddress,
        provider: "twitter",
      });
    } catch (error) {
      console.warn("Error tracking Twitter login:", error);
    }

    const redirect =
      (router.currentRoute.value.query.redirect as string) || "/account";
    router.replace(redirect);
  } catch (error) {
    console.error("Authentication error in authenticateTwitterLogin:", error);

    if (originalEndpoint) {
      config.auth.provider.endpoints.signIn = originalEndpoint;
    }

    toast.error("Failed to authenticate with X. Please try again.");
    twitterLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
@use "sass:color";

.login-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #f9f9f9;

  &.dark-mode {
    background: #121212;

    .login-card {
      background: $black-bis;
      color: $white;
      h1 {
        color: $white;
      }
    }

    .world-map-background {
      opacity: 0.2;
    }
    
  }
}

.world-map-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  will-change: transform;
}

.world-map-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  filter: blur(4px) grayscale(30%);
  opacity: 0.55;
  will-change: transform;
}

.world-map-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
  overflow: hidden;

  :deep(.box) {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  :deep(.world-map-container) {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
}

.content-wrapper {
  position: absolute;
  z-index: 9999;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;

  @media screen and (max-width: 1024px) {
    padding: 1rem;
  }
}

.login-card-container {
  pointer-events: auto;
  z-index: 10000;
}

.login-card {
  background: $white;
  color: $black;
  border-radius: 16px;
  padding: 3rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  text-align: center;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  @media screen and (max-width: 640px) {
    padding: 2rem;
  }
}

.login-header {
  margin-bottom: 2rem;
}

.login-content {
  margin-bottom: 2rem;
}

.login-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: $black;

  @media screen and (max-width: 640px) {
    font-size: 1.75rem;
  }
}

.login-subtitle {
  font-size: 1rem;
  color: $grey;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.login-button {
  width: 100%;
  padding: 0.875rem 1.5rem;
  border: 1px solid $grey-light;
  border-radius: 8px;
  background: $white-bis;
  color: $black;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  position: relative;

  &:hover:not(:disabled) {
    background: $white-ter;
    border-color: $grey;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.google-button {
  background: $white;
  border-color: $grey-light;

  &:hover:not(:disabled) {
    background: $white-bis;
    border-color: $grey;
  }
}

.twitter-button {
  background: $black;
  color: $white;
  border-color: $grey-dark;

  &:hover:not(:disabled) {
    background: $grey-darker;
    border-color: $grey;
  }
}

.divider {
  margin: 1.5rem 0;
  text-align: center;

  span {
    color: $grey;
    font-size: 0.875rem;
  }
}

.wallet-section {
  margin-bottom: 0;
}

.login-button.is-loading {
  color: transparent !important;
  pointer-events: none;

  &::after {
    content: "";
    position: absolute;
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid;
    border-color: $black transparent $black transparent;
    border-radius: 50%;
    animation: button-loading-spinner 1.2s linear infinite;
  }
}

.twitter-button.is-loading::after {
  border-color: $white transparent $white transparent !important;
}

@keyframes button-loading-spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.wallet-selection-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.wallet-modal-content {
  background: $white;
  color: $black;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  margin: 0 auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.wallet-modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: $black;
  text-align: center;
  margin-bottom: 1.5rem;
}

.wallet-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.wallet-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid $grey-light;
  border-radius: 8px;
  background: $white-bis;
  color: $black;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $secondary;
    background: $white-ter;
  }
}

.wallet-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
}

.wallet-name {
  font-size: 1rem;
  font-weight: 500;
  color: $black;
}

.wallet-connection-status {
  background: $white-bis;
  border: 1px solid $grey-light;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: left;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  
  &.connected {
    background: #10e80c;
    box-shadow: 0 0 4px rgba(16, 232, 12, 0.5);
  }
  
  &.signing {
    background: #ffa500;
    animation: pulse 1.5s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: $black;
}

.wallet-address {
  font-size: 0.85rem;
  color: $grey;
  font-family: monospace;
  margin-top: 0.25rem;
}

.signing-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid $grey-light;
  font-size: 0.9rem;
  color: $grey-dark;
}

.signing-error {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid $grey-light;
}

.error-text {
  font-size: 0.9rem;
  color: #d32f2f;
  font-weight: 500;
}

.sign-message-section {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid $grey-light;
}

.sign-message-button {
  width: 100%;
  padding: 0.75rem 1rem;
  background: $primary;
  color: $white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: darken($primary, 10%);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.retry-button {
  padding: 0.5rem 1rem;
  background: $secondary;
  color: $white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: darken($secondary, 10%);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.hosts-stats {
  position: absolute;
  bottom: 2rem;
  left: 2rem;
  pointer-events: auto;
  z-index: 3;

  @media screen and (max-width: 450px) {
    bottom: 1rem;
    left: 1rem;
  }
}

.stats-box {
  border-radius: 8px;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  @media screen and (max-width: 450px) {
    padding: 0.75rem 1rem;

    .is-size-4 {
      font-size: 1.25rem !important;
    }

    .is-size-6 {
      font-size: 0.8rem !important;
    }
  }
}

.rocket-icon {
  width: 28px;
  height: 28px;
  fill: #10e80c;

  @media screen and (max-width: 450px) {
    width: 20px;
    height: 20px;
  }
}
</style>
