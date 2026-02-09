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
}


// Global state shared across all instances
const isAuthenticated = ref(false);
const isLoading = ref(true);
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
            const response = await $fetch<User>(`${config.identity_manager_url}/user/profile`, {
                credentials: 'include'
            });

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
const checkSession = async (): Promise<boolean> => {
    if (checkSessionPromise) return checkSessionPromise;

    checkSessionPromise = (async () => {
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
            checkSessionPromise = null;
        }
    })();

    return checkSessionPromise;
};

// Global watcher
if (import.meta.client) {
    watch(isAuthenticated, async (newValue) => {
        if (newValue && !userData.value) {
            await fetchUserData();
        }
    });
}

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

    // Do initial check on first use
    if (import.meta.client && !initialCheckDone) {
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