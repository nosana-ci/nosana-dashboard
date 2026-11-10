<template>
  <div class="callback-page">
    <div class="callback-content">
      <Loader v-if="!error" />
      <p v-if="!error">{{ connectReturnTo ? "Connecting GitHub..." : "Completing sign in..." }}</p>
      <div v-else class="error-message">
        <p class="error-text">{{ error }}</p>
        <NuxtLink v-if="connectReturnTo" :to="connectReturnTo" class="button is-primary">
          Back
        </NuxtLink>
        <NuxtLink v-else to="/" class="button is-primary">Back to home</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSuperTokens } from "~/composables/useSuperTokens";
import { trackEvent, trackPixelEvent } from "~/utils/analytics";
import Loader from "~/components/Loader.vue";
import { apiErrorMessage, connectGithub, takePendingGithubConnect } from "~/composables/useCampaign";

definePageMeta({
  layout: false,
});

const { handleThirdPartyCallback } = useSuperTokens();
const error = ref<string | null>(null);
const connectReturnTo = ref<string | null>(null);
const router = useRouter();

const completeConnect = async (query: URLSearchParams) => {
  const code = query.get("code");
  if (!code) {
    error.value =
      query.get("error") === "access_denied"
        ? "GitHub connection was cancelled."
        : "GitHub did not return an authorization code. Please try again.";
    return;
  }
  try {
    await connectGithub(code, query.get("state")!);
    router.replace(connectReturnTo.value!);
  } catch (err: any) {
    error.value = apiErrorMessage(err, "Could not connect GitHub. Please try again.");
  }
};

onMounted(async () => {
  const query = new URLSearchParams(window.location.search);
  const pendingConnect = takePendingGithubConnect(query.get("state"));
  if (pendingConnect) {
    connectReturnTo.value = pendingConnect.returnTo;
    return completeConnect(query);
  }

  try {
    const response = await handleThirdPartyCallback();

    if (response.status === "OK") {
      const isSignUp = response.createdNewRecipeUser && response.user.loginMethods.length === 1;
      const eventType = isSignUp ? "sign_up" : "login";

      try {
        trackEvent(eventType, {
          user_id: response.user.id,
          provider: "github",
        });
        trackPixelEvent(isSignUp ? "sign_up" : "login", { provider: "github" });
      } catch (e) {
        console.warn("Error tracking event:", e);
      }

      const redirect =
        sessionStorage.getItem("postLoginRedirect") || "/deployments/create";
      sessionStorage.removeItem("postLoginRedirect");
      router.replace(redirect);
    } else if (response.status === "SIGN_IN_UP_NOT_ALLOWED") {
      error.value = response.reason || "Sign in not allowed. Please contact support.";
    } else if (response.status === "NO_EMAIL_GIVEN_BY_PROVIDER") {
      error.value = "No email provided by GitHub. Please use another form of login.";
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
