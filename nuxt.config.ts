import svgLoader from 'vite-svg-loader';

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
      jobs_address: process.env.JOBS_ADDRESS,
      rewards_address: process.env.REWARDS_ADDRESS,
      staking_address: process.env.STAKING_ADDRESS,
      pools_address: process.env.POOLS_ADDRESS,
      pool_address: process.env.POOL_ADDRESS,
      nos_address: process.env.NOS_ADDRESS
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
    ],
    build: {
      target: "esnext",
    },
    optimizeDeps: {
      include: ["@solana/web3.js", "buffer"],
      esbuildOptions: {
        target: "esnext",
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
        },
      },
    },
  },
})
