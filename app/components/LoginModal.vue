<template>
  <div v-if="isOpen" class="login-modal-overlay" @click="closeModal">
    <div class="login-modal" @click.stop>
      <!-- Header with Logo -->
      <div class="login-header">
        <logo width="120px" :animated="true" class="light-only" />
        <logo width="120px" :white="true" class="dark-only" :animated="true" />
      </div>

      <!-- Main Login Content -->
      <div class="login-content">
        <h1 class="login-title">{{ modalTitle }}</h1>
        <p class="login-subtitle">{{ modalSubtitle }}</p>

        <!-- Google Login Button -->
        <button 
          v-if="allowGoogle"
          class="login-button google-button" 
          @click="selectGoogleLogin" 
          :disabled="googleLoading"
          :class="{ 'is-loading': googleLoading }"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <button 
          v-if="allowTwitter"
          class="login-button twitter-button" 
          @click="selectTwitterLogin" 
          :disabled="twitterLoading"
          :class="{ 'is-loading': twitterLoading }"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
            <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Continue with X
        </button>

        <div v-if="allowGoogle && allowWallet" class="divider">
          <span>OR</span>
        </div>

        <!-- Wallet Connection Button -->
        <div v-if="allowWallet" class="wallet-section">
          <button 
            class="login-button wallet-button" 
            @click="handleWalletConnect"
            :disabled="connected"
          >
            <WalletIcon :size="20" />
            {{ connected ? 'Wallet Connected' : 'Select Wallet' }}
          </button>
        </div>

        <!-- Wallet Selection Modal -->
        <div v-if="showWalletModal" class="wallet-selection-modal" @click="showWalletModal = false">
          <div class="wallet-modal-content" @click.stop>
            <h3 class="wallet-modal-title">Select a Wallet</h3>
            <div class="wallet-list">
              <div 
                v-for="wallet in wallets" 
                :key="wallet.adapter.name"
                class="wallet-item"
                @click="selectWallet(wallet.adapter.name)"
              >
                <img 
                  :src="wallet.adapter.icon" 
                  :alt="wallet.adapter.name"
                  class="wallet-icon"
                />
                <span class="wallet-name">{{ wallet.adapter.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Close button -->
      <button class="modal-close-button" @click="closeModal">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useWallet } from 'solana-wallets-vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { generateCodeVerifier, generateCodeChallenge } from '~/utils/pkce';
import { trackEvent } from '~/utils/analytics';
import WalletIcon from '~/components/WalletIcon.vue';

interface LoginModalProps {
  isOpen: boolean;
  mode: 'both' | 'google' | 'wallet' | 'twitter';
  redirectPath?: string;
}

const props = withDefaults(defineProps<LoginModalProps>(), {
  mode: 'both',
  redirectPath: '/account/deployer'
});

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const { connected, disconnect, select, connect, wallets, publicKey, wallet, readyState } = useWallet();
const { status, signOut, data: userData } = useAuth();
const router = useRouter();
const toast = useToast();
const config = useRuntimeConfig().public;

const googleLoading = ref(false);
const twitterLoading = ref(false);
const showWalletModal = ref(false);
const codeVerifier = ref('');

// Compute what authentication methods are allowed
const allowGoogle = computed(() => props.mode === 'both' || props.mode === 'google');
const allowWallet = computed(() => props.mode === 'both' || props.mode === 'wallet');
const allowTwitter = computed(() => props.mode === 'both' || props.mode === 'twitter');

// Compute modal title and subtitle based on mode
const modalTitle = computed(() => {
  switch (props.mode) {
    case 'google':
      return 'Build with Nosana';
    case 'wallet':
      return 'Build with Nosana';
    default:
      return 'Build with Nosana';
  }
});

const modalSubtitle = computed(() => {
  switch (props.mode) {
    case 'google':
      return 'Sign in or create an account to build with the Nosana AI Platform';
    case 'wallet':
      return 'Connect your wallet to view host earnings and manage your nodes';
    default:
      return 'Sign in or create an account to build with the Nosana AI Platform';
  }
});

const closeModal = () => {
  emit('close');
};

// used for event tracking, we can assume sign up if account was created within the last 10 seconds
const checkIsSignUp = (createdAt: string | undefined): boolean => {
  if (!createdAt) return false;
  
  const createdAtTime = new Date(createdAt).getTime();
  const now = Date.now();
  const timeDifference = now - createdAtTime;
  
  return timeDifference <= 10000;
};

// Google login logic (copied from original login page)
const selectGoogleLogin = async () => {
  googleLoading.value = true;
  let popup: Window | null = null;
  
  try {
    // Disconnect wallet if connected (mutual exclusivity)
    if (connected.value) {
      await disconnect();
    }
    
    const query = {
      client_id: config.googleClientId as string,
      response_type: "code",
      redirect_uri: config.googleRedirectUri as string,
      scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
    };
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams(query).toString();
    
    // Open Google auth in a popup
    popup = window.open(
      url.toString(),
      'google-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
    
    if (!popup) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }
    
    // Listen for postMessage from redirect page
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GOOGLE_AUTH_CODE' && event.data.code) {
        window.removeEventListener('message', handleMessage);
        popup?.close();
        authenticateLogin(event.data.code);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
  } catch (error) {
    if (popup) popup.close();
    toast.error('Error preparing Google login');
    googleLoading.value = false;
  }
};

// Google OAuth authentication logic
const authenticateLogin = async (code: string) => {
  let originalEndpoint: any;
  
  try {
    const { signIn } = useAuth();

    // Temporarily override the auth endpoint for Google login
    originalEndpoint = config.auth.provider.endpoints.signIn;
    config.auth.provider.endpoints.signIn = {
      path: "/api/auth/login/google",
      method: "post",
      propertyName: "token",
    };

    // Call the Google login endpoint with the OAuth code
    await signIn(
      {
        code: code,
        redirectUri: config.googleRedirectUri as string,
      },
      {
        redirect: false
      }
    );

    // Restore original endpoint
    config.auth.provider.endpoints.signIn = originalEndpoint;

    googleLoading.value = false;

    try {
      // Check if this is a sign-up vs login based on created_at timestamp
      const isSignUp = checkIsSignUp(userData.value?.created_at);
      const eventType = isSignUp ? 'sign_up' : 'login';
      trackEvent(eventType, {
        user_id: userData.value?.generatedAddress,
        provider: 'google',
      });
    } catch (error) {
      console.warn('Error tracking Google login:', error);
    }
    
    // Close modal and emit success
    // Small delay to ensure auth state is fully set before redirect
    setTimeout(() => {
      emit('success');
      emit('close');
    }, 100);
    
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
    // Disconnect Google if authenticated (mutual exclusivity)
    if (status.value === "authenticated") {
      await signOut({ redirect: false });
    }

    if (wallets.value && wallets.value.length > 0) {
      showWalletModal.value = true;
    } else {
      toast.error("No wallets found");
    }
  } catch (error) {
    console.error("Error preparing wallet selection:", error);
    toast.error("Failed to prepare wallet connection.");
  }
};

// Select specific wallet
const selectWallet = async (walletName: string) => {
  showWalletModal.value = false;
  
  try {
    console.log("selecting wallet", walletName);
    await select(walletName as any);
    await connect();
    console.log("connected", connected.value);
    try {
      trackEvent('wallet_connected', {
        user_id: publicKey.value?.toString(),
        wallet: walletName,
      });
    } catch (error) {
      console.warn('Error tracking wallet connected:', error);
    }
    
  } catch (error) {
    console.error("Error selecting wallet:", error);
    toast.error(`Failed to connect to ${walletName}. Please try again.`);
  }
};

// Watch for wallet connection success
watch(connected, (isConnected) => {
  if (isConnected) {
    // Disconnect Google if authenticated (mutual exclusivity)
    if (status.value === "authenticated") {
      signOut({ redirect: false });
    }
    
    // Close modal and emit success
    emit('success');
    emit('close');
  }
});

// Google auth success is handled in authenticateLogin function
// No need for additional status watcher

// Twitter login logic
const selectTwitterLogin = async () => {
  twitterLoading.value = true;
  let popup: Window | null = null;
  
  try {
    // Disconnect wallet if connected (mutual exclusivity)
    if (connected.value) {
      await disconnect();
    }

    // Generate PKCE values
    codeVerifier.value = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier.value);
    
    const query = {
      response_type: 'code',
      client_id: config.twitterClientId as string,
      redirect_uri: config.twitterRedirectUri as string,
      scope: 'users.read users.email offline.access tweet.read',
      state: crypto.randomUUID(),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    };

    const url = new URL('https://twitter.com/i/oauth2/authorize');
    url.search = new URLSearchParams(query).toString();
    
    // Open Twitter auth in a popup
    popup = window.open(
      url.toString(),
      'twitter-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
    
    if (!popup) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }
    
    // Listen for the popup to complete authentication
    const checkPopup = setInterval(() => {
      try {
        if (popup?.closed) {
          clearInterval(checkPopup);
          twitterLoading.value = false;
          return;
        }
        
        if (popup?.location.href.includes(window.location.origin)) {
          const popupUrl = new URL(popup.location.href);
          const code = popupUrl.searchParams.get('code');
          const state = popupUrl.searchParams.get('state');
          
          if (code) {
            clearInterval(checkPopup);
            popup.close();
            
            // Process the authentication code
            authenticateTwitterLogin(code, state || '', codeVerifier.value);
          }
        }
      } catch (e) {
        // Cross-origin restrictions - popup hasn't returned to our domain yet
      }
    }, 1000);
    
  } catch (error) {
    if (popup) popup.close();
    toast.error('Error preparing Twitter login');
    twitterLoading.value = false;
  }
};

// Twitter authentication logic
const authenticateTwitterLogin = async (code: string, state: string, codeVerifier: string) => {
  let originalEndpoint: any;
  
  try {
    const { signIn } = useAuth();

    // Temporarily override the auth endpoint for Twitter login
    originalEndpoint = config.auth.provider.endpoints.signIn;
    config.auth.provider.endpoints.signIn = {
      path: "/api/auth/login/twitter",
      method: "post",
      propertyName: "token",
    };

    // Call the Twitter login endpoint
    await signIn(
      {
        code,
        state,
        codeVerifier,
      },
      {
        redirect: false
      }
    );

    // Restore original endpoint
    config.auth.provider.endpoints.signIn = originalEndpoint;

    twitterLoading.value = false;

    try {
      const isSignUp = checkIsSignUp(userData.value?.created_at);
      const eventType = isSignUp ? 'sign_up' : 'login';
      
      trackEvent(eventType, {
        user_id: userData.value?.generatedAddress,
        provider: 'twitter',
      });
    } catch (error) {
      console.warn('Error tracking Twitter login:', error);
    }
    
    // Close modal and emit success
    setTimeout(() => {
      emit('success');
      emit('close');
    }, 100);
    
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

/* ==========================================================================
   Login Modal Overlay
   ========================================================================== */

.login-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* ==========================================================================
   Login Modal - Light Mode (Default)
   ========================================================================== */

.login-modal {
  background: $white;
  color: $black;
  border-radius: 16px;
  padding: 3rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  font-family: 'Outfit', sans-serif;
  text-align: center;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
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

/* Loading state styles */
.login-button.is-loading {
  color: transparent !important;
  pointer-events: none;

  &::after {
    content: '';
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

/* Dark mode styles moved to global.scss following Bulma styling flowchart */

.modal-close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.2s;
  color: $grey;
}

.modal-close-button:hover {
  background-color: $white-ter;
  color: $black;
}

/* Wallet Selection Modal */
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
}

.wallet-item:hover {
  border-color: $secondary;
  background: $white-ter;
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

/* All overrides removed - clean implementation using Bulma variables */

@media (max-width: 640px) {
  .login-modal {
    padding: 2rem;
  }
  
  .login-title {
    font-size: 1.75rem;
  }
}
</style>