import { ref, readonly } from "vue";
import Session from "supertokens-web-js/recipe/session";
import EmailPassword from "supertokens-web-js/recipe/emailpassword";

const isAuthenticated = ref(false);
const isLoading = ref(true);
const userId = ref<string | null>(null);

export function useSuperTokensSession() {

    const checkSession = async (): Promise<boolean> => {
        try {
            isLoading.value = true;
            const exists = await Session.doesSessionExist();
            isAuthenticated.value = exists;

            if (exists) {
                userId.value = await Session.getUserId();
            } else {
                userId.value = null;
            }

            return exists;
        } catch (error) {
            console.error("Error checking SuperTokens session:", error);
            isAuthenticated.value = false;
            userId.value = null;
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

    const signOut = async () => {
        try {
            await Session.signOut();
            isAuthenticated.value = false;
            userId.value = null;
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

    return {
        isAuthenticated: readonly(isAuthenticated),
        isLoading: readonly(isLoading),
        userId: readonly(userId),
        checkSession,
        signIn,
        signUp,
        signOut,
        getAccessTokenPayload,
    };
}
