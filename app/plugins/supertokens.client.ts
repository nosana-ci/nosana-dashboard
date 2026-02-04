/**
 * SuperTokens Client Plugin
 * 
 * Initializes the SuperTokens SDK on the client side for session management
 * and email/password authentication.
 */
import SuperTokens from "supertokens-web-js";
import Session from "supertokens-web-js/recipe/session";
import EmailPassword from "supertokens-web-js/recipe/emailpassword";

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();

    SuperTokens.init({
        appInfo: {
            appName: "Nosana Deploy",
            apiDomain: "http://localhost:3001",
            // apiDomain: config.public.backend_url as string,
            apiBasePath: "/auth",
        },
        recipeList: [
            Session.init(),
            EmailPassword.init(),
        ],
    });
});
