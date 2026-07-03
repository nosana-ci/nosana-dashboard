<template>
  <div class="callback-page">
    <div class="callback-content">
      <Loader v-if="!error" />
      <p v-if="!error">Completing sign in...</p>
      <div v-else class="error-message">
        <p class="error-text">{{ error }}</p>
        <NuxtLink to="/" class="button is-primary">Back to home</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSuperTokens } from "~/composables/useSuperTokens";
import { trackEvent } from "~/utils/analytics";
import Loader from "~/components/Loader.vue";

definePageMeta({
  layout: false,
});

const { handleThirdPartyCallback } = useSuperTokens();
const error = ref<string | null>(null);
const router = useRouter();

onMounted(async () => {
  try {
    const response = await handleThirdPartyCallback();

    if (response.status === "OK") {
      const isSignUp = response.createdNewRecipeUser && response.user.loginMethods.length === 1;
      const eventType = isSignUp ? "sign_up" : "login";

      try {
        trackEvent(eventType, {
          user_id: response.user.id,
          provider: "google",
        });
      } catch (e) {
        console.warn("Error tracking event:", e);
      }

      const redirect = sessionStorage.getItem("postLoginRedirect") || "/account";
      sessionStorage.removeItem("postLoginRedirect");
      router.replace(redirect);
    } else if (response.status === "SIGN_IN_UP_NOT_ALLOWED") {
      error.value = response.reason || "Sign in not allowed. Please contact support.";
    } else if (response.status === "NO_EMAIL_GIVEN_BY_PROVIDER") {
      error.value = "No email provided by Google. Please use another form of login.";
    } else {
      error.value = "An error occurred during sign in. Please try again.";
    }
  } catch (err: any) {
    console.error("ThirdParty callback error:", err);
    if (err.isSuperTokensGeneralError === true) {
      error.value = err.message;
    } else {
      error.value = "Something went wrong during authentication.";
    }
  }
});
</script>

<style lang="scss" scoped>
.callback-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9f9f9;
}

.callback-content {
  text-align: center;
  
  p {
    margin-top: 1rem;
    color: #666;
    font-size: 1rem;
  }
}

.error-message {
  margin-top: 1rem;
}

.error-text {
  color: #d32f2f;
  font-weight: 500;
  margin-bottom: 1rem;
}

.dark-mode {
  .callback-page {
    background: #121212;
  }
  
  .callback-content p {
    color: #aaa;
  }
}
</style>
