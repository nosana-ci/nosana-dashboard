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

            <!-- Email/Password Form -->
            <form @submit.prevent="handleEmailSubmit" class="email-form">
              <div class="form-field">
                <input
                  v-model="email"
                  type="email"
                  placeholder="Email address"
                  class="form-input"
                  :disabled="emailLoading"
                  required
                />
              </div>
              <div class="form-field">
                <input
                  v-model="password"
                  type="password"
                  placeholder="Password"
                  class="form-input"
                  :disabled="emailLoading"
                  required
                  minlength="8"
                />
              </div>
              <div v-if="authError" class="auth-error">
                {{ authError }}
              </div>
              <div class="form-actions">
                <button
                  type="submit"
                  class="login-button email-button"
                  :disabled="emailLoading"
                  :class="{ 'is-loading': emailLoading }"
                >
                  {{ isSignUpMode ? 'Create Account' : 'Sign In' }}
                </button>
              </div>
              <div class="form-toggle">
                <span v-if="!isSignUpMode">
                  Don't have an account?
                  <a href="#" @click.prevent="isSignUpMode = true">Sign up</a>
                </span>
                <span v-else>
                  Already have an account?
                  <a href="#" @click.prevent="isSignUpMode = false">Sign in</a>
                </span>
              </div>
            </form>

            <template v-if="!isCampaignMode">
              <div class="divider">
                <span>OR</span>
              </div>

              <!-- Google Login Button -->
              <button
                class="login-button google-button py-4"
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

              <!-- GitHub Login Button -->
              <button
                class="login-button github-button py-4"
                @click="selectGithubLogin"
                :disabled="githubLoading"
                :class="{ 'is-loading': githubLoading }"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <path
                    d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                  />
                </svg>
                Continue with GitHub
              </button>

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
                    signingMessage ? "Signing Message..." : "Connect Wallet"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useWallet } from "@nosana/solana-vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { trackEvent } from "~/utils/analytics";
import WalletIcon from "~/components/WalletIcon.vue";
import { useNosanaWallet } from "~/composables/useNosanaWallet";
import { useSuperTokens } from "~/composables/useSuperTokens";

definePageMeta({
  layout: false, // No sidebar/layout for login page
});

const { connected, disconnect, connect, account } = useWallet();
import { useSolanaWallets } from "@nosana/solana-vue";
const { wallets } = useSolanaWallets();
const { generateAuthHeaders, signMessageError } = useNosanaWallet();
const { signIn, signUp, checkSession, isAuthenticated: superTokensAuth, getThirdPartyAuthUrl } = useSuperTokens();

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

// Email/Password form state
const email = ref("");
const password = ref("");
const emailLoading = ref(false);
const authError = ref("");
const isSignUpMode = ref(false);

const googleLoading = ref(false);
const showWalletModal = ref(false);
const signingMessage = ref(false);
const backgroundImageKey = ref(0);
const currentWalletName = ref<string | null>(null);

// Get wallet name from account or stored name
const getWalletName = () => {
  if (currentWalletName.value) {
    return currentWalletName.value;
  }
  if (account.value) {
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
  
  if (signMessageError) {
    signMessageError.value = false;
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
  await signAuthMessage(currentWalletName.value);
};

// Watch for auto-connect and set wallet name if not already set
watch([connected, account, wallets], () => {
  if (connected.value && account.value && !currentWalletName.value && wallets.value && wallets.value.length > 0) {
    const wallet = wallets.value.find((w: any) => 
      w.accounts?.some((acc: any) => acc.address === account.value?.address)
    );
    
    if (wallet?.name) {
      currentWalletName.value = wallet.name;
    }
  }
}, { immediate: true });

const isCampaignMode = computed(() => {
  return route.query.context === 'get-started' && (typeof window !== 'undefined' && !window.opener);
});

const colorMode = useColorMode();
const isDarkMode = computed(() => colorMode.value === "dark");

// Handle email/password form submission
const handleEmailSubmit = async () => {
  authError.value = "";
  emailLoading.value = true;

  try {
    const response = isSignUpMode.value 
      ? await signUp(email.value, password.value)
      : await signIn(email.value, password.value);

    if (response.status === "OK") {
      toast.success(isSignUpMode.value ? "Account created successfully!" : "Signed in successfully!");
      
      trackEvent(isSignUpMode.value ? "sign_up" : "login", {
        provider: "email",
      });

      const redirect = (route.query.redirect as string) || "/account";
      router.replace(redirect);
    } else if (response.status === "WRONG_CREDENTIALS_ERROR") {
      authError.value = "Invalid email or password";
    } else if (response.status === "FIELD_ERROR") {
      const fieldErrors = response.formFields.map((f: any) => f.error).join(", ");
      authError.value = fieldErrors || "Please check your input";
    } else if (response.status === "SIGN_UP_NOT_ALLOWED") {
      authError.value = "Sign up is not allowed. Please contact support.";
    } else {
      authError.value = "An error occurred. Please try again.";
    }
  } catch (error: any) {
    console.error("Email auth error:", error);
    authError.value = error?.message || "An error occurred. Please try again.";
  } finally {
    emailLoading.value = false;
  }
};

// Check authentication on mount
onMounted(async () => {
  // Check SuperTokens session
  const hasSession = await checkSession();
  
  // Check if user is already authenticated
  const walletAuthenticated = checkWalletAuth();
  const isAuthenticated = status.value === "authenticated" || walletAuthenticated || hasSession;

  if (isAuthenticated) {
    const redirect = (route.query.redirect as string) || "/account";
    router.replace(redirect);
    return;
  }

  // Handle OAuth popup callback
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (code && window.opener) {
    window.opener.postMessage(
      {
        type: "GOOGLE_AUTH_CODE",
        code: code,
      },
      window.location.origin
    );
    window.close();
    return;
  }

  // Wait for wallet auto-connect
  if (!connected.value && wallets.value && wallets.value.length > 0) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (connected.value && account.value && !currentWalletName.value) {
      const wallet = wallets.value.find((w: any) => 
        w.accounts?.some((acc: any) => acc.address === account.value?.address)
      );
      if (wallet?.name) {
        currentWalletName.value = wallet.name;
      }
      toast.success(`Wallet connected: ${account.value.address.substring(0, 8)}...`);
    }
  }
});

// Helper to check wallet authentication cookie
const checkWalletAuth = () => {
  try {
    const sessionCookie = useCookie('nosana-wallet-session');
    if (sessionCookie.value) {
      const authTime = (sessionCookie.value as any).timestamp || 0;
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      return (sessionCookie.value as any).authenticated && (now - authTime < maxAge);
    }
  } catch (error) {
    // Ignore cookie errors
  }
  return false;
};

// used for event tracking
const checkIsSignUp = (createdAt: string | undefined): boolean => {
  if (!createdAt) return false;
  const createdAtTime = new Date(createdAt).getTime();
  const now = Date.now();
  return now - createdAtTime <= 10000;
};

// Google login logic
const selectGoogleLogin = async () => {
  googleLoading.value = true;
  let popup: Window | null = null;

  try {
    if (connected.value) {
      await disconnect();
    }

    const redirectUri = `${window.location.origin}/auth/callback/google`;
    const authUrl = await getThirdPartyAuthUrl("google", redirectUri);
    
    // Open popup window at top right
    const width = 500;
    const height = 600;
    const left = window.screen.width - width;
    const top = 0;
    
    popup = window.open(
        authUrl,
        "google-auth",
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      throw new Error("Popup blocked. Please allow popups for this site.");
    }

    // Listen for message from popup
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "SUPERTOKENS_AUTH_SUCCESS") {
        window.removeEventListener("message", handleMessage);
        popup?.close();
        
        await checkSession();
        
        toast.success("Signed in successfully!");
        const redirect = (route.query.redirect as string) || "/account";
        router.replace(redirect);
      } else if (event.data.type === "SUPERTOKENS_AUTH_ERROR") {
        window.removeEventListener("message", handleMessage);
        popup?.close();
        toast.error(event.data.error || "Authentication failed");
        googleLoading.value = false;
      }
    };

    window.addEventListener("message", handleMessage);

    // Check if popup was closed manually
    const timer = setInterval(() => {
        if (popup && popup.closed) {
            clearInterval(timer);
            window.removeEventListener("message", handleMessage);
            if (googleLoading.value) {
                googleLoading.value = false;
            }
            if (githubLoading.value) {
                githubLoading.value = false;
            }
        }
    }, 1000);

  } catch (error: any) {
    if (popup) popup.close();
    console.error("Error starting Google login:", error);
    if (error.isSuperTokensGeneralError === true) {
      toast.error(error.message);
    } else {
      toast.error("Error starting Google login");
    }
    googleLoading.value = false;
  }
};

// GitHub login logic
const githubLoading = ref(false);

const selectGithubLogin = async () => {
  githubLoading.value = true;
  let popup: Window | null = null;

  try {
    if (connected.value) {
      await disconnect();
    }

    const redirectUri = `${window.location.origin}/auth/callback/github`;
    const authUrl = await getThirdPartyAuthUrl("github", redirectUri);
    
    // Open popup window at top right
    const width = 500;
    const height = 600;
    const left = window.screen.width - width;
    const top = 0;
    
    popup = window.open(
        authUrl,
        "github-auth",
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      throw new Error("Popup blocked. Please allow popups for this site.");
    }

    // Listen for message from popup
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "SUPERTOKENS_AUTH_SUCCESS") {
        window.removeEventListener("message", handleMessage);
        popup?.close();
        
        await checkSession();
        
        toast.success("Signed in successfully!");
        const redirect = (route.query.redirect as string) || "/account";
        router.replace(redirect);
      } else if (event.data.type === "SUPERTOKENS_AUTH_ERROR") {
        window.removeEventListener("message", handleMessage);
        popup?.close();
        toast.error(event.data.error || "Authentication failed");
        githubLoading.value = false;
      }
    };

    window.addEventListener("message", handleMessage);

    const timer = setInterval(() => {
        if (popup && popup.closed) {
            clearInterval(timer);
            window.removeEventListener("message", handleMessage);
            if (githubLoading.value) {
                githubLoading.value = false;
            }
        }
    }, 1000);

  } catch (error: any) {
    if (popup) popup.close();
    console.error("Error starting GitHub login:", error);
    if (error.isSuperTokensGeneralError === true) {
      toast.error(error.message);
    } else {
      toast.error("Error starting GitHub login");
    }
    githubLoading.value = false;
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
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      
      if (isMobile && isAndroid) {
        toast.error("No wallets found. Make sure you have a compatible Solana wallet app installed.");
      } else if (isMobile) {
        toast.error("Mobile Wallet Adapter is only available on Android devices.");
      } else {
        toast.error("No wallets found. Please install a Solana wallet browser extension.");
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
    const isMobileWallet = walletName?.toLowerCase().includes('mobile') || 
                          wallet.id?.toLowerCase().includes('mobile');
    
    await connect(wallet);
    
    if (!isMobileWallet) {
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!connected.value || !account.value) {
      if (isMobileWallet) {
        return;
      }
      toast.error(`Failed to connect to ${walletName}. Please try again.`);
      return;
    }

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

    const isMobileWalletAdapter = walletName?.toLowerCase().includes('mobile');
    
    if (isMobileWalletAdapter) {
      toast.success('Wallet connected! Please click "Sign Message" to login.');
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!connected.value || !account.value) {
      toast.warning('Wallet connection lost. Please reconnect.');
      return;
    }
    
    await signAuthMessage(walletName);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
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
    if (!connected.value || !account.value) {
      const errorMsg = 'Wallet disconnected before signing. Please reconnect.';
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    const isMobileWallet = walletName?.toLowerCase().includes('mobile');
    
    if (isMobileWallet) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!connected.value || !account.value) {
        const errorMsg = 'Wallet disconnected before signing. Please reconnect.';
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    }
    
    try {
      await generateAuthHeaders();
    } catch (signError: any) {
      const errorMsg = signError?.message || String(signError);
      
      if (errorMsg.includes('mobile wallet protocol') || errorMsg.includes('no installed wallet')) {
        toast.error('Mobile wallet not found for signing. Please ensure Phantom/Jupiter is installed and try reconnecting.');
        
        if (!connected.value || !account.value) {
          toast.warning('Wallet is disconnected. Please reconnect and try again.');
        }
      } else {
        toast.error(`Failed to sign message: ${errorMsg}`);
      }
      
      if (!connected.value || !account.value) {
        toast.warning('Wallet disconnected during signing.');
      }
      signingMessage.value = false;
      return;
    }
    
    if (signMessageError) {
      signMessageError.value = false;
    }
    
    const walletAddress = publicKey.value?.toString();
    if (walletAddress) {
      sessionCookie.value = {
        authenticated: true,
        address: walletAddress,
        timestamp: Date.now()
      };
    }

    try {
      trackEvent("wallet_authorized", {
        user_id: walletAddress,
        wallet: walletName,
      });
    } catch (error) {
      console.warn("Error tracking wallet authorized:", error);
    }

    const redirect = (route.query.redirect as string) || "/account";
    await navigateTo(redirect);
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    toast.error(`Error: ${errorMessage}`);

    try {
      sessionCookie.value = null;
    } catch (e) {
      // Ignore
    }
  } finally {
    signingMessage.value = false;
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

    .form-input {
      background: $black-ter;
      border-color: $grey-dark;
      color: $white;

      &::placeholder {
        color: $grey;
      }
    }

    .form-toggle {
      color: $grey-light;
      a {
        color: $primary;
      }
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

/* Email Form Styles */
.email-form {
  margin-bottom: 1rem;
}

.form-field {
  margin-bottom: 1rem;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid $grey-light;
  border-radius: 8px;
  background: $white;
  color: $black;
  font-size: 1rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.1);
  }

  &::placeholder {
    color: $grey;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.auth-error {
  color: #d32f2f;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: rgba(#d32f2f, 0.1);
  border-radius: 6px;
}

.form-actions {
  margin-bottom: 1rem;
}

.form-toggle {
  font-size: 0.875rem;
  color: $grey;

  a {
    color: $primary;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
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

.email-button {
  background: $primary;
  color: $white;
  border-color: $primary;

  &:hover:not(:disabled) {
    background: darken($primary, 10%);
    border-color: darken($primary, 10%);
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

.github-button {
  background: #24292e;
  color: $white;
  border-color: #24292e;

  &:hover:not(:disabled) {
    background: #1b1f23;
    border-color: #1b1f23;
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

.email-button.is-loading::after {
  border-color: $white transparent $white transparent;
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
</style>
