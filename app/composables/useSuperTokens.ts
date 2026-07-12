import { ref, readonly, watch } from "vue";
import Session from "supertokens-web-js/recipe/session";
import EmailPassword from "supertokens-web-js/recipe/emailpassword";
import EmailVerification from "supertokens-web-js/recipe/emailverification";
import {
  getAuthorisationURLWithQueryParamsAndSetState,
  signInAndUp,
} from "supertokens-web-js/recipe/thirdparty";

export interface User {
  id: string;
  email: string;
  name: string | null;
  providerUsername: string | null;
  generatedAddress: string;
  loginMethod?: string;
}

// Global state shared across all instances
const isAuthenticated = ref(false);
const isLoading = ref(true);
const isEmailVerified = ref<boolean | null>(null);
const userId = ref<string | null>(null);
const userData = ref<User | null>(null);

// Track if we've done initial load
let initialCheckDone = false;
let checkSessionPromise: Promise<boolean> | null = null;
let checkSessionPromiseToken: symbol | null = null;
let fetchUserPromise: Promise<void> | null = null;
let fetchUserPromiseVersion: number | null = null;
let fetchUserPromiseToken: symbol | null = null;
let sessionStateVersion = 0;

const isCurrentSessionState = (version: number) =>
  version === sessionStateVersion;

const clearSessionState = () => {
  isAuthenticated.value = false;
  isLoading.value = false;
  userId.value = null;
  userData.value = null;
  isEmailVerified.value = null;
};

// Fetch user profile
const fetchUserData = async (version = sessionStateVersion) => {
  if (fetchUserPromise && fetchUserPromiseVersion === version) {
    return fetchUserPromise;
  }

  fetchUserPromiseVersion = version;
  const token = Symbol("fetchUser");
  fetchUserPromiseToken = token;

  fetchUserPromise = (async () => {
    if (!isAuthenticated.value) {
      userData.value = null;
      return;
    }

    try {
      const config = useRuntimeConfig().public;
      const response = await $fetch<User>(
        `${config.apiBase}/api/user/profile`,
        {
          credentials: "include",
        },
      );

      if (response && response.id && isCurrentSessionState(version)) {
        userData.value = response;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      if (isCurrentSessionState(version)) {
        userData.value = null;
      }
    } finally {
      if (fetchUserPromiseToken === token) {
        fetchUserPromise = null;
        fetchUserPromiseVersion = null;
        fetchUserPromiseToken = null;
      }
    }
  })();

  return fetchUserPromise;
};

// Check session and fetch user data
const checkSession = async (shouldFetchUserData = true): Promise<boolean> => {
  if (checkSessionPromise) return checkSessionPromise;

  const version = sessionStateVersion;
  const token = Symbol("checkSession");
  checkSessionPromiseToken = token;

  checkSessionPromise = (async () => {
    try {
      isLoading.value = true;
      const exists = await Session.doesSessionExist();

      if (!isCurrentSessionState(version)) {
        return isAuthenticated.value;
      }

      if (exists) {
        const sessionUserId = await Session.getUserId();

        if (!isCurrentSessionState(version)) {
          return isAuthenticated.value;
        }

        try {
          const verificationResponse =
            await EmailVerification.isEmailVerified();
          const verified =
            verificationResponse.status === "OK" &&
            verificationResponse.isVerified;

          if (!isCurrentSessionState(version)) {
            return isAuthenticated.value;
          }

          isAuthenticated.value = true;
          userId.value = sessionUserId;
          isEmailVerified.value = verified;

          if (verified && shouldFetchUserData) {
            await fetchUserData(version);
          }
        } catch (e) {
          console.error("Error checking email verification:", e);
          if (isCurrentSessionState(version)) {
            isAuthenticated.value = true;
            userId.value = sessionUserId;
            isEmailVerified.value = null;

            if (shouldFetchUserData) {
              await fetchUserData(version);
            }
          }
        }
      } else {
        clearSessionState();
      }

      return exists;
    } catch (error) {
      console.error("Error checking SuperTokens session:", error);
      if (isCurrentSessionState(version)) {
        clearSessionState();
      }
      return false;
    } finally {
      if (isCurrentSessionState(version)) {
        isLoading.value = false;
      }
      if (checkSessionPromiseToken === token) {
        checkSessionPromise = null;
        checkSessionPromiseToken = null;
      }
    }
  })();

  return checkSessionPromise;
};

export function useSuperTokens() {
  const signIn = async (email: string, password: string) => {
    const response = await EmailPassword.signIn({
      formFields: [
        { id: "email", value: email },
        { id: "password", value: password },
      ],
    });

    if (response.status === "OK") {
      sessionStateVersion += 1;
      isAuthenticated.value = true;
      userId.value = response.user.id;
      await fetchUserData(sessionStateVersion);
    }

    return response;
  };

  const signUp = async (
    email: string,
    password: string,
    captchaToken?: string,
  ) => {
    const response = await EmailPassword.signUp({
      formFields: [
        { id: "email", value: email },
        { id: "password", value: password },
      ],
      ...(captchaToken
        ? {
            options: {
              preAPIHook: async ({ url, requestInit }) => {
                const rawBody =
                  typeof requestInit.body === "string" ? requestInit.body : "{}";
                const parsedBody = JSON.parse(rawBody) as Record<string, unknown>;

                return {
                  url,
                  requestInit: {
                    ...requestInit,
                    body: JSON.stringify({
                      ...parsedBody,
                      captchaToken,
                    }),
                  },
                };
              },
            },
          }
        : {}),
    });

    if (response.status === "OK") {
      sessionStateVersion += 1;
      isAuthenticated.value = true;
      userId.value = response.user.id;
    }

    return response;
  };

  const getThirdPartyAuthUrl = async (
    thirdPartyId: string,
    redirectUri: string,
  ): Promise<string> => {
    const authUrl = await getAuthorisationURLWithQueryParamsAndSetState({
      thirdPartyId,
      frontendRedirectURI: redirectUri,
    });
    return authUrl;
  };

  const handleThirdPartyCallback = async () => {
    const response = await signInAndUp();

    if (response.status === "OK") {
      sessionStateVersion += 1;
      isAuthenticated.value = true;
      userId.value = response.user.id;
      await fetchUserData(sessionStateVersion);
    }

    return response;
  };

  const signOut = async () => {
    const version = sessionStateVersion + 1;
    sessionStateVersion = version;
    checkSessionPromise = null;
    try {
      await Session.signOut();
      if (isCurrentSessionState(version)) {
        clearSessionState();
      }
    } catch (error) {
      console.error("Error signing out:", error);
      if (isCurrentSessionState(version)) {
        clearSessionState();
      }
      throw error;
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    const response = await EmailPassword.sendPasswordResetEmail({
      formFields: [{ id: "email", value: email }],
    });
    return response;
  };

  const resetPassword = async (newPassword: string) => {
    const response = await EmailPassword.submitNewPassword({
      formFields: [{ id: "password", value: newPassword }],
    });
    return response;
  };

  const checkEmailVerification = async (): Promise<boolean> => {
    try {
      const response = await EmailVerification.isEmailVerified();
      const verified = response.status === "OK" && response.isVerified;
      isEmailVerified.value = verified;
      return verified;
    } catch (error) {
      console.error("Error checking email verification:", error);
      isEmailVerified.value = null;
      return false;
    }
  };

  const sendVerificationEmail = async () => {
    try {
      const response = await EmailVerification.sendVerificationEmail();
      return response;
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw error;
    }
  };

  const verifyEmail = async () => {
    try {
      const response = await EmailVerification.verifyEmail();
      if (response.status === "OK") {
        isEmailVerified.value = true;
        // Fetch user data after successful verification
        await fetchUserData();
      }
      return response;
    } catch (error) {
      console.error("Error verifying email:", error);
      throw error;
    }
  };

  const getAccessTokenPayload = async () => {
    try {
      return await Session.getAccessTokenPayloadSecurely();
    } catch (error) {
      console.error("Error getting access token payload:", error);
      return null;
    }
  };

  if (import.meta.client && !initialCheckDone) {
    initialCheckDone = true;
    const cookies = document.cookie.split(";");
    const hasSessionCookie = cookies.some(
      (c) =>
        c.trim().startsWith("sIdBucket=") ||
        c.trim().startsWith("sAccessToken="),
    );
    if (hasSessionCookie) {
      checkSession();
    } else {
      isLoading.value = false;
    }
  }

  return {
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    isEmailVerified: readonly(isEmailVerified),
    userId: readonly(userId),
    userData: readonly(userData) as Readonly<Ref<User | null>>,
    checkSession,
    signIn,
    signUp,
    signOut,
    getAccessTokenPayload,
    getThirdPartyAuthUrl,
    handleThirdPartyCallback,
    sendPasswordResetEmail,
    resetPassword,
    checkEmailVerification,
    sendVerificationEmail,
    verifyEmail,
    refresh: checkSession,
  };
}
