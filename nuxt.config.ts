import svgLoader from "vite-svg-loader";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  devServer: {
  },
  devtools: { enabled: true },
  routeRules: {
    '/**': { ssr: false },
    '/deploy/**': { ssr: true, prerender: true },
  },
  hooks: {
    // prerender template routes for custom preview link
    async 'nitro:config'(nitroConfig) {
      const apiBase = process.env.NUXT_PUBLIC_API_BASE;
      if (!apiBase) return;

      try {
        const res = await fetch(`${apiBase}/api/jobs/templates/grouped`);
        if (!res.ok) return;

        const data = await res.json();
        const templates: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : typeof data === 'object' && data
              ? Object.values(data).flat() as any[]
              : [];

        const routes: string[] = [];
        for (const t of templates) {
          if (t?.id) routes.push(`/deploy/${t.id}`);
          if (t?.variants?.length) {
            for (const v of t.variants) {
              if (v?.id) routes.push(`/deploy/${v.id}`);
              else if (v?.variant_id) routes.push(`/deploy/${t.id}-${v.variant_id}`);
            }
          }
        }

        nitroConfig.prerender ??= {};
        nitroConfig.prerender.routes = [
          ...(nitroConfig.prerender.routes ?? []),
          ...routes,
        ];
      } catch (e) {
        console.warn('[prerender] Failed to fetch templates for route generation:', e);
      }
    },
  },
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
      meta: [
        { name: 'description', content: 'Instant GPU Rental at Scale for AI & High-Performance Workloads' },
        { property: 'og:title', content: 'Deploy AI on Nosana' },
        { property: 'og:description', content: 'Instant GPU Rental at Scale for AI & High-Performance Workloads' },
        { property: 'og:image', content: 'https://nosana.com/og/home.png' },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Deploy AI on Nosana' },
        { name: 'twitter:description', content: 'Instant GPU Rental at Scale for AI & High-Performance Workloads' },
        { name: 'twitter:image', content: 'https://nosana.com/og/home.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: 'any' },
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
      maintenance: process.env.NUXT_PUBLIC_MAINTENANCE === "true",
      rpcUrl: process.env.RPC_URL,
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      recaptcha_site_key: process.env.NUXT_PUBLIC_RECAPTCHA_SITE_KEY,
      network: process.env.NETWORK || "mainnet",
      nodeDomain: process.env.NODE_DOMAIN,
      frpServer: process.env.FRP_SERVER || "node.k8s.prd.nos.ci",
      cookie_domain: process.env.NUXT_PUBLIC_COOKIE_DOMAIN,
      stripe_publishable_key: process.env.NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    },
  },
  gtag: {
    enabled: process.env.NODE_ENV === "production",
    id: "G-HNDP62SH8M",
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
