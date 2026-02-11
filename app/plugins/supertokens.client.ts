import SuperTokens from "supertokens-web-js";
import Session from "supertokens-web-js/recipe/session";
import EmailPassword from "supertokens-web-js/recipe/emailpassword";
import ThirdParty from "supertokens-web-js/recipe/thirdparty";

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig();

    SuperTokens.init({
        appInfo: {
            appName: "Nosana Deploy",
            apiDomain: config.public.client_manager_url as string,
            apiBasePath: "/auth",
        },
        recipeList: [
            Session.init(),
            EmailPassword.init(),
            ThirdParty.init(),
        ],
    });
});
