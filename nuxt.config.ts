import svgLoader from 'vite-svg-loader';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: false,
  css: ["~/assets/styles/global.scss"],
  dir: {
    public: 'static',
  },
  modules: ['@nuxtjs/google-fonts', '@vueuse/nuxt', '@nuxtjs/color-mode'],
  googleFonts: {
    preload: true,
    families: {
      Outfit: [300, 400, 700],
      'Space Grotesk': [400]
    },
  },
  runtimeConfig: {
    public: {
      rpcUrl: process.env.RPC_URL,
      apiBase: process.env.API_BASE,
      network: process.env.NETWORK || 'devnet',
    }
  },
  vite: {
    esbuild: {
      target: "esnext",
    },
    plugins: [
      svgLoader({
        defaultImport: 'url',
      }),
      nodePolyfills({
        // To exclude specific polyfills, add them to this list.
        exclude: [
          'fs', // Excludes the polyfill for `fs` and `node:fs`.
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
        stream: 'rollup-plugin-node-polyfills/polyfills/stream',
        events: 'rollup-plugin-node-polyfills/polyfills/events',
      },
    },
    build: {
      target: "esnext"
    },
    optimizeDeps: {
      include: ["@solana/web3.js", "buffer"],
      esbuildOptions: {
        target: "esnext",
        define: {
          global: 'globalThis',
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
          additionalData: '@import "@/assets/styles/variables.scss";',
          silenceDeprecations: ['mixed-decls', 'slash-div']
        },
      },
    },
  },
})