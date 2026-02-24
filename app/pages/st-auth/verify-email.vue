<template>
  <div class="login-page" :class="{ 'dark-mode': isDarkMode }">
    <div class="content-wrapper">
      <div class="world-map-background">
        <img src="/img/worldmap.png" alt="" class="world-map-image" />
      </div>
      <div class="login-card-container">
        <div class="login-card">
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
            <!-- Loading state while session is being established -->
            <template v-if="!isReady">
              <h1 class="login-title">Verify your email to get access</h1>
              <div class="form-actions" style="margin-top: 2rem">
                <div class="login-button email-button is-loading">Loading</div>
              </div>
            </template>

            <!-- Success: Email verified - just show success message -->
            <template v-else-if="isVerified">
              <div class="success-message">
                <div class="success-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="#10E80C"
                      fill-opacity="0.1"
                    />
                    <path
                      d="M7 13L10 16L17 9"
                      stroke="#10E80C"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
                <p class="success-text">Email verified</p>
                <p class="success-subtext">
                  Your email has been successfully verified
                </p>
                <div class="form-actions">
                  <button
                    @click="goToAccount"
                    class="login-button email-button"
                  >
                    Continue to Account
                  </button>
                </div>
              </div>
            </template>

            <!-- Request verification email form -->
            <template v-else>
              <h1 class="login-title">Verify your email to get access</h1>
              <p v-if="userEmail" class="login-subtitle">
                We've sent a verification code to<br />
                <strong>{{ userEmail }}</strong>
              </p>
              <p v-else class="login-subtitle">
                Check your email for the verification code
              </p>

              <!-- Error message -->
              <div v-if="error" class="auth-error">
                {{ error }}
              </div>

              <!-- Success: Email sent -->
              <div v-if="emailSent" class="success-message">
                <div class="success-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="#10E80C"
                      fill-opacity="0.1"
                    />
                    <path
                      d="M7 13L10 16L17 9"
                      stroke="#10E80C"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
                <p class="success-text">Email sent</p>
              </div>

              <!-- Resend button -->
              <form
                v-if="!emailSent"
                @submit.prevent="handleSendVerification"
                class="email-form"
              >
                <div class="form-actions">
                  <button
                    type="submit"
                    class="login-button email-button"
                    :disabled="loading || !isReady"
                    :class="{ 'is-loading': loading }"
                  >
                    Resend Verification Email
                  </button>
                </div>
                <div class="form-toggle">
                  <a href="/" @click.prevent="goToLogin">Back to Sign In</a>
                </div>
              </form>

              <!-- Back to sign in after email sent -->
              <div v-else class="form-toggle">
                <a href="/" @click.prevent="goToLogin">Back to Sign In</a>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import Logo from "~/components/Logo.vue";
import { useSuperTokens } from "~/composables/useSuperTokens";

definePageMeta({
  layout: false,
});

const router = useRouter();
const route = useRoute();
const toast = useToast();
const {
  sendVerificationEmail,
  verifyEmail,
  checkEmailVerification,
  userData,
  checkSession,
} = useSuperTokens();

const colorMode = useColorMode();
const isDarkMode = computed(() => colorMode.value === "dark");

const token = ref<string | null>(null);
const hasToken = computed(() => !!token.value);

const userEmail = computed(() => {
  const queryEmail = route.query.email as string;
  return queryEmail || userData.value?.email || "";
});

const loading = ref(false);
const error = ref("");
const emailSent = ref(false);
const isVerified = ref(false);
const isReady = ref(false);

onMounted(async () => {
  await checkSession(false);
  isReady.value = true;

  token.value = (route.query.token as string) || null;

  if (hasToken.value) {
    await handleVerifyEmail();
  }
});

const goToLogin = () => {
  router.push("/");
};

const goToAccount = () => {
  router.push("/account");
};

const handleSendVerification = async () => {
  error.value = "";
  loading.value = true;

  try {
    const response = await sendVerificationEmail();

    if (response.status === "OK") {
      emailSent.value = true;
    } else if (response.status === "EMAIL_ALREADY_VERIFIED_ERROR") {
      isVerified.value = true;
    } else {
      error.value = "Failed to send verification email. Please try again.";
    }
  } catch (err: any) {
    console.error("Verification email error:", err);
    error.value = err?.message || "An error occurred. Please try again.";
  } finally {
    loading.value = false;
  }
};

const handleVerifyEmail = async () => {
  error.value = "";
  loading.value = true;

  try {
    const response = await verifyEmail();

    if (response.status === "OK") {
      isVerified.value = true;
      toast.success("Email verified successfully!");
    } else if (response.status === "EMAIL_VERIFICATION_INVALID_TOKEN_ERROR") {
      error.value =
        "Invalid or expired verification code. Please request a new one.";
      token.value = null;
    } else {
      error.value = "Failed to verify email. Please try again.";
    }
  } catch (err: any) {
    console.error("Verification error:", err);
    error.value = err?.message || "An error occurred. Please try again.";
    token.value = null;
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
@import "~/assets/styles/variables";

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
    }

    .login-title {
      color: $white;
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

    .success-text {
      color: $white;
    }
  }
}

.content-wrapper {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.world-map-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  will-change: transform;
  display: flex;
  align-items: center;
  justify-content: center;
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

  strong {
    color: $black;
  }
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
  text-align: center;
  letter-spacing: 0.25em;

  &:focus {
    outline: none;
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.1);
  }

  &::placeholder {
    color: $grey;
    letter-spacing: normal;
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
    animation: spin 1s linear infinite;
  }
}

.email-button.is-loading::after {
  border-color: $white transparent $white transparent;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.success-message {
  padding: 1rem 0;
}

.success-icon {
  margin-bottom: 1.5rem;
}

.success-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: $black;
  margin-bottom: 0.5rem;
}

.success-subtext {
  font-size: 1rem;
  color: $grey;
  margin-bottom: 1.5rem;
  line-height: 1.5;

  strong {
    color: $black;
  }
}
</style>
