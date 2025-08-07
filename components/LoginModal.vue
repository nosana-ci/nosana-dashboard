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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 7H3C2.45 7 2 7.45 2 8V16C2 16.55 2.45 17 3 17H21C21.55 17 22 16.55 22 16V8C22 7.45 21.55 7 21 7Z" stroke="currentColor" stroke-width="2"/>
              <path d="M16 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
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

interface LoginModalProps {
  isOpen: boolean;
  mode: 'both' | 'google' | 'wallet';
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

const { connected, disconnect, select, wallets } = useWallet();
const { status, signOut } = useAuth();
const router = useRouter();
const toast = useToast();
const config = useRuntimeConfig().public;

const googleLoading = ref(false);
const showWalletModal = ref(false);

// Compute what authentication methods are allowed
const allowGoogle = computed(() => props.mode === 'both' || props.mode === 'google');
const allowWallet = computed(() => props.mode === 'both' || props.mode === 'wallet');

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

// Google login logic (copied from original login page)
const selectGoogleLogin = async () => {
  googleLoading.value = true;
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
    const popup = window.open(
      url.toString(),
      'google-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
    
    if (!popup) {
      throw new Error('Popup blocked. Please allow popups for this site.');
    }
    
    // Listen for the popup to complete authentication
    const checkPopup = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(checkPopup);
          googleLoading.value = false;
          return;
        }
        
        // Check if popup has been redirected to our domain with a code
        if (popup.location.href.includes(window.location.origin)) {
          const popupUrl = new URL(popup.location.href);
          const code = popupUrl.searchParams.get('code');
          
          if (code) {
            clearInterval(checkPopup);
            popup.close();
            
            // Process the authentication code
            authenticateLogin(code);
          }
        }
      } catch (e) {
        // Cross-origin restrictions - popup hasn't returned to our domain yet
      }
    }, 1000);
    
  } catch (error) {
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
      },
      {
        redirect: false
      }
    );

    // Restore original endpoint
    config.auth.provider.endpoints.signIn = originalEndpoint;

    googleLoading.value = false;
    
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
      toast.error("No wallets found. Please install a Solana wallet like Phantom.");
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
    await select(walletName as any);
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
</script>

<style scoped>
.login-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.login-modal {
  background: #0a0a0a;
  color: #ffffff;
  border-radius: 16px;
  padding: 3rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  font-family: 'Outfit', sans-serif;
  text-align: center;
  position: relative;
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
  color: #ffffff;
}

.login-subtitle {
  font-size: 1rem;
  color: #a1a1aa;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.login-button {
  width: 100%;
  padding: 0.875rem 1.5rem;
  border: 1px solid #3f3f46;
  border-radius: 8px;
  background: #18181b;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.google-button:hover:not(:disabled) {
  background: #27272a;
  border-color: #52525b;
}

.google-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.wallet-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider {
  margin: 1.5rem 0;
  text-align: center;
}

.divider span {
  color: #71717a;
  font-size: 0.875rem;
}

.wallet-section {
  margin-bottom: 0;
}

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
  color: #71717a;
}

.modal-close-button:hover {
  background-color: #18181b;
  color: #ffffff;
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
  z-index: 10001;
}

.wallet-modal-content {
  background: #18181b;
  border-radius: 12px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  margin: 0 auto;
}

.wallet-modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
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
  border: 1px solid #3f3f46;
  border-radius: 8px;
  background: #27272a;
  cursor: pointer;
  transition: all 0.2s ease;
}

.wallet-item:hover {
  border-color: #10E80C;
  background: #2a2a2a;
}

.wallet-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
}

.wallet-name {
  font-size: 1rem;
  font-weight: 500;
  color: #ffffff;
}

/* Light mode overrides */
.login-modal:not(.dark-mode) {
  background: #ffffff;
  color: #000000;
}

.login-modal:not(.dark-mode) .login-title {
  color: #000000;
}

.login-modal:not(.dark-mode) .login-subtitle {
  color: #6b7280;
}

.login-modal:not(.dark-mode) .login-button {
  background: #f9fafb;
  border-color: #e5e7eb;
  color: #000000;
}

.login-modal:not(.dark-mode) .google-button:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.login-modal:not(.dark-mode) .divider span {
  color: #6b7280;
}

.login-modal:not(.dark-mode) .modal-close-button {
  color: #6b7280;
}

.login-modal:not(.dark-mode) .modal-close-button:hover {
  background-color: #f3f4f6;
  color: #000000;
}

.login-modal:not(.dark-mode) .wallet-modal-content {
  background: #ffffff;
  border: 1px solid #e5e7eb;
}

.login-modal:not(.dark-mode) .wallet-modal-title {
  color: #000000;
}

.login-modal:not(.dark-mode) .wallet-item {
  background: #f9fafb;
  border-color: #e5e7eb;
}

.login-modal:not(.dark-mode) .wallet-item:hover {
  background: #f3f4f6;
  border-color: #10E80C;
}

.login-modal:not(.dark-mode) .wallet-name {
  color: #000000;
}

@media (max-width: 640px) {
  .login-modal {
    padding: 2rem;
  }
  
  .login-title {
    font-size: 1.75rem;
  }
}
</style>