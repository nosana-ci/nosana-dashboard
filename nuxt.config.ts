import svgLoader from "vite-svg-loader";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  css: [
    "~/assets/styles/global.scss",
    "bulma-o-steps/bulma-steps.css",
    "@creativebulma/bulma-tooltip/dist/bulma-tooltip.min.css",
  ],
  dir: {
    public: "static",
  },
  app: {
    head: {
      title: 'Nosana Deploy',
      htmlAttrs: {
        lang: 'en',
      },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },
  pwa: {
    manifest: {
      name: "Nosana Deploy",
      short_name: "nosana",
      theme_color: "#10E80C",
      background_color: "#ffffff",
      display: "standalone",
      description: "Nosana Deploy",
      icons: [
        {
          src: "icon.png",
          sizes: "150x150",
          type: "image/png",
        },
      ],
    },
  },
  modules: [
    "@nuxtjs/google-fonts",
    "@vueuse/nuxt",
    "@nuxtjs/color-mode",
    "@sidebase/nuxt-auth",
    "nuxt-gtag",
    "@vite-pwa/nuxt",
  ],
  googleFonts: {
    preload: true,
    families: {
      Outfit: [300, 400, 700],
      "Space Grotesk": [400],
    },
  },
  colorMode: {
    preference: "light", // default value of $colorMode.preference
    fallback: "light", // fallback value if not system preference found
    hid: "nuxt-color-mode-script",
    globalName: "__NUXT_COLOR_MODE__",
    componentName: "ColorScheme",
    classPrefix: "",
    classSuffix: "-mode",
    storageKey: "nuxt-color-mode",
    dataValue: "theme",
  },
  runtimeConfig: {
    public: {
      rpcUrl: process.env.RPC_URL,
      backend_url: process.env.NUXT_PUBLIC_BACKEND_URL,
      network: process.env.NETWORK || "mainnet",
      nodeDomain: process.env.NODE_DOMAIN,
      frpServer: process.env.FRP_SERVER || "node.k8s.prd.nos.ci",
      googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      twitterClientId: process.env.TWITTER_CLIENT_ID,
      twitterRedirectUri: process.env.TWITTER_REDIRECT_URI,
    },
  },
  gtag: {
    enabled: process.env.NODE_ENV === "production",
    id: "G-HNDP62SH8M",
  },
  auth: {
    baseURL: process.env.NUXT_PUBLIC_BACKEND_URL,
    provider: {
      type: "local",
      endpoints: {
        signIn: {
          path: "/api/auth/login",
          method: "post",
          propertyName: "token",
        },
        getSession: { path: "/api/auth/session", method: "get" },
        signOut: false,
      },
      token: {
        type: false,
        maxAgeInSeconds: 60 * 60 * 24 * 3, // 3 days
      },
      session: {
        dataType: {
          id: "string",
          name: "string",
          email: "string",
          address: "string",
          generatedAddress: "string",
          providerUsername: "string",
          type: "string",
          created_at: "string",
        },
      },
    },
    sessionRefresh: {
      enablePeriodically: false, // Disable automatic session refresh
      enableOnWindowFocus: true, // Enable refresh on window focus for cross-tab sync
    },
    globalAppMiddleware: false,
  },
  vite: {
    esbuild: {
      target: "esnext",
    },
    plugins: [
      svgLoader({
        defaultImport: "url",
        svgo: false
      }),
      nodePolyfills({
        // To exclude specific polyfills, add them to this list.
        exclude: [
          "fs", // Excludes the polyfill for `fs` and `node:fs`.
        ],
        // Whether to polyfill specific globals.
        globals: {
          Buffer: true, // can also be 'build', 'dev', or false
          global: true,
          process: true,
        },
        // Whether to polyfill `node:` protocol imports.
        protocolImports: true,
      }),
    ],
    resolve: {
      alias: {
        stream: "rollup-plugin-node-polyfills/polyfills/stream",
        events: "rollup-plugin-node-polyfills/polyfills/events",
      },
    },
    build: {
      target: "esnext",
      reportCompressedSize: false,
    },
    optimizeDeps: {
      include: ["@solana/web3.js", "buffer"],
      exclude: ["vue-demi"],
      esbuildOptions: {
        target: "esnext",
        define: {
          global: "globalThis",
        },
      },
    },
    define: {
      "process.env.BROWSER": true,
    },
    css: {
      preprocessorOptions: {
        scss: {
          sourceMap: false,
          additionalData: '@use "@/assets/styles/variables.scss" as *;',
          silenceDeprecations: ["slash-div"],
        },
      },
    },
    devBundler: "legacy",
    server: {
      watch: {
        usePolling: true,
        interval: 300,
      },
    },
  },
  components: true,
});
