import { ref, readonly, watch } from "vue";
import Session from "supertokens-web-js/recipe/session";
import EmailPassword from "supertokens-web-js/recipe/emailpassword";
import {
    getAuthorisationURLWithQueryParamsAndSetState,
    signInAndUp
} from "supertokens-web-js/recipe/thirdparty";

export interface User {
    id: string;
    email: string;
    name: string | null;
    providerUsername: string | null;
    generatedAddress: string;
    createdAt: string;
    updatedAt: string;
  }


// Global state shared across all instances
const isAuthenticated = ref(false);
const isLoading = ref(true);
const userId = ref<string | null>(null);
const userData = ref<User | null>(null);

// Track if we've done initial load
let initialCheckDone = false;

interface UserProfileResponse {
    status: "OK";
    user: User;
    sessionHandle: string;
  }
  
  export function useSuperTokens() {
      const config = useRuntimeConfig().public;
  
      // Fetch user profile from backend
      const fetchUserData = async () => {
          if (!isAuthenticated.value) {
              userData.value = null;
              return;
          }
  
          try {
              const response = await $fetch<UserProfileResponse>(`${config.identity_manager_url}/user/profile`, {
                  credentials: 'include'
              });
  
              if (response.status === "OK") {
                  userData.value = response.user;
              }
          } catch (error) {
              console.error("Error fetching user profile:", error);
              userData.value = null;
          }
      };
  
      // Check session and fetch user data
      const checkSession = async (): Promise<boolean> => {
          try {
              isLoading.value = true;
              const exists = await Session.doesSessionExist();
              isAuthenticated.value = exists;
  
              if (exists) {
                  userId.value = await Session.getUserId();
                  await fetchUserData();
              } else {
                  userId.value = null;
                  userData.value = null;
              }
  
              return exists;
          } catch (error) {
              console.error("Error checking SuperTokens session:", error);
              isAuthenticated.value = false;
              userId.value = null;
              userData.value = null;
              return false;
          } finally {
              isLoading.value = false;
          }
      };
  
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
              await fetchUserData();
          }
  
          return response;
      };
  
      const getThirdPartyAuthUrl = async (thirdPartyId: string, redirectUri: string): Promise<string> => {
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
  
      const getAccessTokenPayload = async () => {
          try {
              return await Session.getAccessTokenPayloadSecurely();
          } catch (error) {
              console.error("Error getting access token payload:", error);
              return null;
          }
      };
  
      // Auto-fetch user data when authenticated changes
      watch(isAuthenticated, async (newValue) => {
          if (newValue && !userData.value) {
              await fetchUserData();
          }
      });
  
      // Do initial check on first use
      if (!initialCheckDone) {
          initialCheckDone = true;
          checkSession();
      }
  
      return {
          isAuthenticated: readonly(isAuthenticated),
          isLoading: readonly(isLoading),
          userId: readonly(userId),
          userData: readonly(userData) as Readonly<Ref<User | null>>,
          checkSession,
          signIn,
          signUp,
          signOut,
          getAccessTokenPayload,
          getThirdPartyAuthUrl,
          handleThirdPartyCallback,
          refresh: checkSession,
      };
  }