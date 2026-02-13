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
let fetchUserPromise: Promise<void> | null = null;

// Fetch user profile
const fetchUserData = async () => {
  if (fetchUserPromise) return fetchUserPromise;

  fetchUserPromise = (async () => {
    if (!isAuthenticated.value) {
      userData.value = null;
      return;
    }

    try {
      const config = useRuntimeConfig().public;
      const response = await $fetch<User>(
        `${config.client_manager_url}/user/profile`,
        {
          credentials: "include",
        },
      );

      if (response && response.id) {
        userData.value = response;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      userData.value = null;
    } finally {
      fetchUserPromise = null;
    }
  })();

  return fetchUserPromise;
};

// Check session and fetch user data
const checkSession = async (shouldFetchUserData = true): Promise<boolean> => {
  if (checkSessionPromise) return checkSessionPromise;

  checkSessionPromise = (async () => {
    try {
      isLoading.value = true;
      const exists = await Session.doesSessionExist();
      isAuthenticated.value = exists;

      if (exists) {
        userId.value = await Session.getUserId();

        if (shouldFetchUserData) {
          await fetchUserData();
        }

        try {
          const verificationResponse =
            await EmailVerification.isEmailVerified();
          const verified =
            verificationResponse.status === "OK" &&
            verificationResponse.isVerified;
          isEmailVerified.value = verified;
        } catch (e) {
          console.error("Error checking email verification:", e);
          isEmailVerified.value = false;
        }
      } else {
        userId.value = null;
        userData.value = null;
        isEmailVerified.value = null;
      }

      return exists;
    } catch (error) {
      console.error("Error checking SuperTokens session:", error);
      isAuthenticated.value = false;
      userId.value = null;
      userData.value = null;
      isEmailVerified.value = null;
      return false;
    } finally {
      isLoading.value = false;
      checkSessionPromise = null;
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
      isAuthenticated.value = true;
      userId.value = response.user.id;
      await fetchUserData();
    }

    return response;
  };

  const signUp = async (email: string, password: string) => {
    const response = await EmailPassword.signUp({
      formFields: [
        { id: "email", value: email },
        { id: "password", value: password },
      ],
    });

    if (response.status === "OK") {
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
      isAuthenticated.value = true;
      userId.value = response.user.id;
      await fetchUserData();
    }

    return response;
  };

  const signOut = async () => {
    try {
      await Session.signOut();
      isAuthenticated.value = false;
      userId.value = null;
      userData.value = null;
    } catch (error) {
      console.error("Error signing out:", error);
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
      isEmailVerified.value = false;
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

  // Do initial check on first use
  if (import.meta.client && !initialCheckDone) {
    initialCheckDone = true;
    checkSession();
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
