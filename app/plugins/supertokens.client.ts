import SuperTokens from "supertokens-web-js";
import Session from "supertokens-web-js/recipe/session";
import EmailPassword from "supertokens-web-js/recipe/emailpassword";
import ThirdParty from "supertokens-web-js/recipe/thirdparty";
import EmailVerification from "supertokens-web-js/recipe/emailverification";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  SuperTokens.init({
    appInfo: {
      appName: "Nosana Deploy",
      apiDomain: config.public.client_manager_url,
      apiBasePath: "/auth",
    },
    recipeList: [
        Session.init(),
        // Session.init({
        //     ...(config.public.cookie_domain && {
        //       sessionTokenBackendDomain: config.public.cookie_domain,
        //     }),
        //   }),
      EmailPassword.init(),
      ThirdParty.init(),
      EmailVerification.init(),
    ],
  });
});
