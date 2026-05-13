import SuperTokens from "supertokens-web-js";
import Session from "supertokens-web-js/recipe/session";
import EmailPassword from "supertokens-web-js/recipe/emailpassword";
import ThirdParty from "supertokens-web-js/recipe/thirdparty";
import EmailVerification from "supertokens-web-js/recipe/emailverification";

const getRequestUrl = (input: RequestInfo | URL) => {
  if (typeof input === "string") {
    return input;
  }

  if (typeof URL !== "undefined" && input instanceof URL) {
    return input.toString();
  }

  return input.url;
};

const shouldUseSessionInterception = (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
) => {
  const requestCredentials =
    init?.credentials ??
    (typeof Request !== "undefined" && input instanceof Request
      ? input.credentials
      : undefined);

  if (requestCredentials === "include") {
    return true;
  }

  const requestUrl = getRequestUrl(input);

  try {
    const pathname = new URL(requestUrl, window.location.origin).pathname;
    return pathname.startsWith("/auth") || pathname.startsWith("/api/auth");
  } catch {
    return false;
  }
};

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  if (
    config.public.maintenance &&
    typeof localStorage !== "undefined" &&
    !localStorage.getItem("skipMaintenance")
  ) {
    return;
  }
  SuperTokens.init({
    appInfo: {
      appName: "Nosana Deploy",
      apiDomain: config.public.apiBase,
      apiBasePath: "/auth",
    },
    recipeList: [
      Session.init({
        ...(config.public.cookie_domain && {
          sessionTokenBackendDomain: config.public.cookie_domain,
        }),
      }),
      EmailPassword.init(),
      ThirdParty.init(),
      EmailVerification.init(),
    ],
  });

  const windowWithSuperTokens = window as Window & {
    __supertokensOriginalFetch?: typeof window.fetch;
  };

  const originalFetch = windowWithSuperTokens.__supertokensOriginalFetch?.bind(window);
  const interceptedFetch = window.fetch.bind(window);

  if (!originalFetch) {
    return;
  }

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (shouldUseSessionInterception(input, init)) {
      return interceptedFetch(input, init);
    }

    return originalFetch(input, init);
  }) as typeof window.fetch;
});
