<template>
  <div
    class="modal login-modal"
    :class="[{ 'is-active': modalState.isOpen }, { 'dark-mode': isDarkMode }]"
  >
    <div class="modal-background" @click="close"></div>
    <div class="login-card-container">
      <div class="login-card">
        <button
          class="delete modal-close-button"
          aria-label="close"
          @click="close"
        ></button>
        <div class="login-header">
          <logo width="120px" :animated="true" class="light-only" />
          <logo
            width="120px"
            :white="true"
            class="dark-only"
            :animated="true"
          />
        </div>

        <div class="login-content">
          <!-- SIGN UP -->
          <template v-if="isSignUpMode">
            <h1 class="login-title">Create Your Account</h1>
            <p class="login-subtitle">
              Sign up to build with the Nosana AI Platform
            </p>

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
            <div class="form-field">
              <input
                v-model="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                class="form-input"
                :disabled="emailLoading"
                required
                minlength="8"
              />
            </div>
            <div v-if="authError" class="auth-error">{{ authError }}</div>
            <p v-if="isSignupCaptchaEnabled" class="captcha-notice">
              This site is protected by reCAPTCHA and the Google
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
              and
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
              apply.
            </p>
            <div class="form-actions">
              <button
                type="submit"
                class="login-button email-button"
                :disabled="emailLoading"
                :class="{ 'is-loading': emailLoading }"
              >
                Create Account
              </button>
            </div>
            <div class="form-toggle">
              <span>
                Already have an account?
                <a href="#" @click.prevent="isSignUpMode = false">Sign in</a>
              </span>
            </div>
          </form>
        </template>

          <!-- SIGN IN -->
          <template v-else>
            <h1 class="login-title">Build with Nosana</h1>
            <p class="login-subtitle">
              Sign in or create an account to build with the Nosana AI Platform
            </p>

          <!-- Email / password -->
          <form
            v-if="modalState.mode === 'both'"
            @submit.prevent="handleEmailSubmit"
            class="email-form"
          >
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
            <div class="forgot-password-link">
              <NuxtLink to="/st-auth/reset-password" @click="close">Forgot password?</NuxtLink>
            </div>
            <div v-if="authError" class="auth-error">{{ authError }}</div>
            <div class="form-actions">
              <button
                type="submit"
                class="login-button email-button"
                :disabled="emailLoading"
                :class="{ 'is-loading': emailLoading }"
              >
                Sign In
              </button>
            </div>
            <div class="form-toggle">
              <span>
                Don't have an account?
                <a href="#" @click.prevent="isSignUpMode = true">Sign up</a>
              </span>
            </div>
          </form>

          <div v-if="modalState.mode === 'both'" class="divider"><span>OR</span></div>

          <!-- Google -->
          <button
            v-if="modalState.mode === 'both' || modalState.mode === 'google'"
            class="login-button google-button py-4"
            @click="selectGoogleLogin"
            @mousedown="prefetchAuthUrl('google')"
            @focus="prefetchAuthUrl('google')"
            @touchstart="prefetchAuthUrl('google')"
            :disabled="googleLoading"
            :class="{ 'is-loading': googleLoading }"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <!-- GitHub -->
          <button
            v-if="modalState.mode === 'both' || modalState.mode === 'google'"
            class="login-button github-button py-4"
            @click="selectGithubLogin"
            @mousedown="prefetchAuthUrl('github')"
            @focus="prefetchAuthUrl('github')"
            @touchstart="prefetchAuthUrl('github')"
            :disabled="githubLoading"
            :class="{ 'is-loading': githubLoading }"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>

          <div v-if="modalState.mode === 'both'" class="divider"><span>OR</span></div>

          <!-- Wallet -->
          <div class="wallet-section">
            <div v-if="connected && account" class="wallet-connection-status">
              <div class="status-indicator">
                <span class="status-dot connected"></span>
                <span class="status-text">Connected: {{ getWalletName() || "Unknown Wallet" }}</span>
              </div>
              <div v-if="account?.address" class="wallet-address">
                {{ account.address.substring(0, 8) }}...{{ account.address.substring(account.address.length - 6) }}
              </div>
              <div v-if="signingMessage" class="signing-status">
                <span class="status-dot signing"></span>
                Signing authentication message to login...
              </div>
              <div
                v-if="!signingMessage && !signMessageError && connected && account"
                class="sign-message-section"
              >
                <button class="sign-message-button" @click="handleSignMessage" :disabled="signingMessage">
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
              {{ signingMessage ? "Signing Message..." : "Connect Wallet" }}
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

          <!-- Wallet selection sub-modal -->
          <div v-if="showWalletModal" class="wallet-selection-modal" @click="showWalletModal = false">
            <div class="wallet-modal-content" @click.stop>
              <h3 class="wallet-modal-title">Select a Wallet</h3>
              <div class="wallet-list">
                <div
                  v-for="wallet in wallets"
                  :key="wallet.name"
                  class="wallet-item"
                  @click="selectWallet(wallet)"
                >
                  <img :src="wallet.icon" :alt="wallet.name" class="wallet-icon" />
                  <span class="wallet-name">{{ wallet.name }}</span>
                </div>
              </div>
            </div>
          </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useWallet, useSolanaWallets } from "@nosana/solana-vue";
import { useToast } from "vue-toastification";
import { trackEvent } from "~/utils/analytics";
import WalletIcon from "~/components/WalletIcon.vue";
import { useNosanaWallet } from "~/composables/useNosanaWallet";
import { useSuperTokens } from "~/composables/useSuperTokens";
import { useOAuthLogin } from "~/composables/useOAuthLogin";
import { useLoginModal } from "~/composables/useLoginModal";
import { useModalScrollLock } from "~/composables/useModalScrollLock";
import { createAuthCookiesKey } from "~/utils/createAuthCookiesKey";

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const { modalState, closeModal, notifySuccess } = useLoginModal();
const { lockScroll, unlockScroll } = useModalScrollLock();
const MODAL_ID = "login-modal";

const { connected, disconnect, connect, account } = useWallet();
const { wallets } = useSolanaWallets();
const { generateAuthHeaders, signMessageError } = useNosanaWallet();
const {
  signIn,
  signUp,
  signOut,
  checkSession,
  isEmailVerified,
  sendVerificationEmail,
} = useSuperTokens();

const toast = useToast();
const config = useRuntimeConfig().public;
const colorMode = useColorMode();
const recaptchaSiteKey = config.recaptcha_site_key as string | undefined;
const isSignupCaptchaEnabled = computed(() => Boolean(recaptchaSiteKey));
const isDarkMode = computed(() => colorMode.value === "dark");

const publicKey = computed(() => {
  if (!account.value?.address) return null;
  return {
    toString: () => account.value!.address,
    toBase58: () => account.value!.address,
  };
});

// Form state
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const emailLoading = ref(false);
const authError = ref("");
const isSignUpMode = ref(false);

const googleLoading = ref(false);
const githubLoading = ref(false);
const showWalletModal = ref(false);
const signingMessage = ref(false);
const currentWalletName = ref<string | null>(null);

// Lock background scroll while the modal is open; reset transient form state on close.
watch(
  () => modalState.value.isOpen,
  (isOpen) => {
    if (isOpen) {
      lockScroll(MODAL_ID);
    } else {
      unlockScroll(MODAL_ID);
      authError.value = "";
      showWalletModal.value = false;
    }
  },
);

const close = () => closeModal();

// reCAPTCHA — loaded lazily on first sign-up attempt, guarded against duplicates.
const ensureRecaptchaLoaded = () => {
  if (!isSignupCaptchaEnabled.value || !import.meta.client) return;
  if (document.querySelector('script[data-nosana-recaptcha]')) return;
  const script = document.createElement("script");
  script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(recaptchaSiteKey ?? "")}`;
  script.async = true;
  script.defer = true;
  script.setAttribute("data-nosana-recaptcha", "true");
  document.head.appendChild(script);
};

const waitForRecaptcha = async () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (window.grecaptcha?.ready) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("reCAPTCHA failed to load");
};

const getSignupCaptchaToken = async () => {
  if (!isSignupCaptchaEnabled.value) return undefined;
  ensureRecaptchaLoaded();
  await waitForRecaptcha();
  return await new Promise<string>((resolve, reject) => {
    window.grecaptcha?.ready(() => {
      window.grecaptcha
        ?.execute(recaptchaSiteKey!, { action: "signup" })
        .then(resolve)
        .catch(() => reject(new Error("Captcha verification failed")));
    });
  });
};

const getWalletName = () => {
  if (currentWalletName.value) return currentWalletName.value;
  if (account.value) {
    const wallet = wallets.value?.find((w: any) =>
      w.accounts?.some((acc: any) => acc.address === account.value?.address),
    );
    return wallet?.name || "Connected Wallet";
  }
  return null;
};

const handleDisconnect = async () => {
  try {
    await disconnect();
    currentWalletName.value = null;
    toast.info("Wallet disconnected");
  } catch (error) {
    toast.error("Failed to disconnect wallet");
  }
};

const clearWalletAuthState = async () => {
  const sessionCookie = useCookie<{ address?: string } | null>("nosana-wallet-session");
  const addresses = new Set<string>();
  if (sessionCookie.value?.address) addresses.add(sessionCookie.value.address);
  if (account.value?.address) addresses.add(account.value.address);
  for (const address of addresses) {
    const authCookie = useCookie(createAuthCookiesKey(address));
    authCookie.value = null;
  }
  sessionCookie.value = null;
  currentWalletName.value = null;
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("nosana-wallet");
  }
  if (connected.value) {
    await disconnect();
  }
};

const clearSuperTokensAuthState = async () => {
  try {
    await signOut();
  } catch (error) {
    console.warn("Failed to clear SuperTokens session before wallet login:", error);
  }
};

// Auto-detect wallet name on (auto-)connect
watch(
  [connected, account, wallets],
  () => {
    if (
      connected.value &&
      account.value &&
      !currentWalletName.value &&
      wallets.value &&
      wallets.value.length > 0
    ) {
      const wallet = wallets.value.find((w: any) =>
        w.accounts?.some((acc: any) => acc.address === account.value?.address),
      );
      if (wallet?.name) currentWalletName.value = wallet.name;
    }
  },
  { immediate: true },
);

const handleEmailSubmit = async () => {
  authError.value = "";

  if (isSignUpMode.value && password.value !== confirmPassword.value) {
    authError.value = "Passwords do not match";
    return;
  }

  trackEvent("auth_start", { auth_method: "email" });

  emailLoading.value = true;
  try {
    await clearWalletAuthState();

    const captchaToken = isSignUpMode.value
      ? await getSignupCaptchaToken()
      : undefined;

    const response = isSignUpMode.value
      ? await signUp(email.value, password.value, captchaToken)
      : await signIn(email.value, password.value);

    if (response.status === "OK") {
      toast.success(
        isSignUpMode.value ? "Account created successfully!" : "Signed in successfully!",
      );
      trackEvent("auth_success", { auth_method: "email" });
      await checkSession(false);

      // Unverified accounts can't deploy — guide them to verification.
      // (The draft was persisted before the modal opened, so it survives.)
      if (isEmailVerified.value === false) {
        if (isSignUpMode.value) {
          try {
            await sendVerificationEmail();
          } catch (e) {
            console.error("Failed to send verification email:", e);
          }
          closeModal();
          await navigateTo(
            `/st-auth/verify-email?email=${encodeURIComponent(email.value)}`,
          );
          return;
        }
        closeModal();
        await navigateTo("/st-auth/verify-email");
        return;
      }

      notifySuccess();
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
    if (error instanceof Response) {
      const data = await error
        .clone()
        .json()
        .catch(async () => ({ message: await error.clone().text() }));
      authError.value = data?.message || `Request failed (${error.status})`;
      return;
    }
    authError.value = error?.message || "An error occurred. Please try again.";
  } finally {
    emailLoading.value = false;
  }
};

const { prefetch: prefetchAuthUrl, start: startOAuthLogin } = useOAuthLogin();

const handleOAuthLogin = async (
  provider: "google" | "github",
  loadingRef: { value: boolean },
) => {
  loadingRef.value = true;

  clearWalletAuthState().catch((error) =>
    console.error("Error clearing wallet auth state:", error),
  );

  try {
    await startOAuthLogin(provider, modalState.value.redirectPath);
  } catch {
    loadingRef.value = false;
  }
};

const selectGoogleLogin = () => handleOAuthLogin("google", googleLoading);
const selectGithubLogin = () => handleOAuthLogin("github", githubLoading);

const handleWalletConnect = async () => {
  try {
    await clearSuperTokensAuthState();
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
    const isMobileWallet =
      walletName?.toLowerCase().includes("mobile") || wallet.id?.toLowerCase().includes("mobile");

    await connect(wallet);

    await new Promise((resolve) => setTimeout(resolve, isMobileWallet ? 1000 : 500));

    if (!connected.value || !account.value) {
      if (isMobileWallet) return;
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

    if (isMobileWallet) {
      toast.success('Wallet connected! Please click "Sign Message" to login.');
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (!connected.value || !account.value) {
      toast.warning("Wallet connection lost. Please reconnect.");
      return;
    }

    await signAuthMessage(walletName);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRedirectError =
      errorMessage.includes("redirect") ||
      errorMessage.includes("navigation") ||
      errorMessage.includes("aborted");
    if (!isRedirectError) {
      toast.error(`Failed to connect to ${walletName}: ${errorMessage}`);
    } else {
      toast.info("Redirecting to wallet app...");
    }
  }
};

const handleSignMessage = async () => {
  if (!currentWalletName.value) {
    toast.error("No wallet name stored. Please reconnect.");
    return;
  }
  if (!connected.value || !account.value) {
    toast.error("Wallet not connected. Please reconnect.");
    return;
  }
  if (signMessageError) signMessageError.value = false;
  await signAuthMessage(currentWalletName.value);
};

const retrySignMessage = async () => {
  if (!currentWalletName.value) {
    toast.error("No wallet name stored. Please reconnect.");
    return;
  }
  if (signMessageError) signMessageError.value = false;
  await new Promise((resolve) => setTimeout(resolve, 500));
  await signAuthMessage(currentWalletName.value);
};

const signAuthMessage = async (walletName: string) => {
  signingMessage.value = true;
  const sessionCookie = useCookie<{
    authenticated: boolean;
    address: string;
    timestamp: number;
  } | null>("nosana-wallet-session");

  try {
    if (!connected.value || !account.value) {
      const errorMsg = "Wallet disconnected before signing. Please reconnect.";
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }

    const isMobileWallet = walletName?.toLowerCase().includes("mobile");
    if (isMobileWallet) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (!connected.value || !account.value) {
        const errorMsg = "Wallet disconnected before signing. Please reconnect.";
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
    }

    try {
      await generateAuthHeaders();
    } catch (signError: any) {
      const errorMsg = signError?.message || String(signError);
      if (errorMsg.includes("mobile wallet protocol") || errorMsg.includes("no installed wallet")) {
        toast.error(
          "Mobile wallet not found for signing. Please ensure Phantom/Jupiter is installed and try reconnecting.",
        );
        if (!connected.value || !account.value) {
          toast.warning("Wallet is disconnected. Please reconnect and try again.");
        }
      } else {
        toast.error(`Failed to sign message: ${errorMsg}`);
      }
      if (!connected.value || !account.value) {
        toast.warning("Wallet disconnected during signing.");
      }
      signingMessage.value = false;
      return;
    }

    if (signMessageError) signMessageError.value = false;

    const walletAddress = publicKey.value?.toString();
    if (walletAddress) {
      sessionCookie.value = {
        authenticated: true,
        address: walletAddress,
        timestamp: Date.now(),
      };
    }

    try {
      trackEvent("wallet_authorized", { user_id: walletAddress, wallet: walletName });
    } catch (error) {
      console.warn("Error tracking wallet authorized:", error);
    }

    notifySuccess();
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

.login-modal {
  overflow: hidden;

  &.dark-mode {
    .login-card {
      background: $black-bis;
      color: $white;

      h1 {
        color: $white;
      }
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
        color: $white !important;

        &:hover {
          color: $primary;
        }
      }
    }
  }
}

.modal-background {
  background: rgba(0, 0, 0, 0.8);
}

.login-card-container {
  pointer-events: auto;
  z-index: 10000;
  width: 100%;
  max-width: 500px;
  margin: 1rem;
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

.modal-close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
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
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

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

.captcha-notice {
  margin-bottom: 1rem;
  font-size: 0.75rem;
  line-height: 1.5;
  color: $grey;

  a {
    color: inherit;
    text-decoration: underline;
  }
}

:global(.grecaptcha-badge) {
  visibility: hidden;
}

.form-actions {
  margin-bottom: 1rem;
}

.forgot-password-link {
  text-align: right;
  margin-bottom: 1rem;
  margin-top: -0.5rem;

  a {
    font-size: 0.875rem;
    color: $grey;
    text-decoration: none;

    &:hover {
      color: $primary;
      text-decoration: underline;
    }
  }
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

.login-modal.dark-mode {
  .login-subtitle {
    color: $grey-light;
  }

  .forgot-password-link {
    a {
      color: $grey-light;

      &:hover {
        color: $primary;
      }
    }
  }

  .divider span {
    color: $grey-light;
  }

  .login-button {
    background: $black-ter;
    border-color: $grey-dark;
    color: $white;

    &:hover:not(:disabled) {
      background: color.scale($black-ter, $lightness: 5%);
      border-color: $grey;
    }
  }

  .google-button,
  .wallet-button {
    background: $black-ter;
    border-color: $grey-dark;

    &:hover:not(:disabled) {
      background: color.scale($black-ter, $lightness: 5%);
      border-color: $grey;
    }
  }

  .github-button {
    border-color: #24292e;
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
  0%,
  100% {
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
