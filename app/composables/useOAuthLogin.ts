import { ref } from "vue";
import { useToast } from "vue-toastification";
import { trackEvent } from "~/utils/analytics";
import { useSuperTokens } from "~/composables/useSuperTokens";

export type OAuthProvider = "google" | "github";

// Safari only treats a page navigation as user-initiated if it happens
// synchronously inside the click handler — any `await` first and
// `window.location.href` is silently dropped, no error. So the redirect
// URL is fetched ahead of the click (on mousedown/focus/touchstart) and
// the click itself just assigns the already-known URL.
//
// SuperTokens also keeps only one OAuth attempt's state in sessionStorage
// at a time, so whichever provider was fetched most recently is the only
// one whose cached URL is still usable — `readyProvider` tracks that.
export function useOAuthLogin() {
  const { getThirdPartyAuthUrl } = useSuperTokens();
  const toast = useToast();

  const authUrls: Record<OAuthProvider, ReturnType<typeof ref<string | null>>> = {
    google: ref(null),
    github: ref(null),
  };
  const readyProvider = ref<OAuthProvider | null>(null);
  let inFlight: OAuthProvider | null = null;
  let started = false;

  const redirectUriFor = (provider: OAuthProvider) =>
    `${window.location.origin}/st-auth/callback/${provider}`;

  const prefetch = async (provider: OAuthProvider) => {
    if (started) return;
    if (readyProvider.value === provider && authUrls[provider].value) return;
    if (inFlight === provider) return;

    inFlight = provider;
    try {
      const url = await getThirdPartyAuthUrl(provider, redirectUriFor(provider));
      if (started) return;
      authUrls[provider].value = url;
      readyProvider.value = provider;
    } catch (error) {
      console.error(`Error pre-fetching ${provider} auth url:`, error);
    } finally {
      if (inFlight === provider) inFlight = null;
    }
  };

  // Navigates to the provider and back to /st-auth/callback/<provider> in
  // this same tab. Throws on failure so the caller can reset its own
  // loading state; on success the page navigates away.
  const start = async (provider: OAuthProvider, redirectPath?: string) => {
    started = true;
    trackEvent("auth_start", { auth_method: provider });

    if (redirectPath) {
      sessionStorage.setItem("postLoginRedirect", redirectPath);
    }

    const cachedUrl = authUrls[provider].value;
    if (cachedUrl && readyProvider.value === provider) {
      window.location.href = cachedUrl;
      return;
    }

    // Prefetch hadn't landed yet (e.g. a very fast click). Chrome/Firefox
    // are fine with this; Safari may silently drop the navigation.
    try {
      const url = await getThirdPartyAuthUrl(provider, redirectUriFor(provider));
      window.location.href = url;
    } catch (error: any) {
      started = false;
      console.error(`Error starting ${provider} login:`, error);
      toast.error(
        error.isSuperTokensGeneralError === true
          ? error.message
          : `Error starting ${provider} login`,
      );
      throw error;
    }
  };

  return { prefetch, start };
}
