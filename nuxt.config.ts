// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ["~/assets/styles/global.scss"],
  modules: ['@nuxtjs/google-fonts', '@vueuse/nuxt'],
  googleFonts: {
    preload: true,
    families: {
      Outfit: [300, 400, 700],
      'Space Grotesk': [400] 
    },
  },
  ssr: false,
  vite: {
    // esbuild: {
    //   target: "esnext",
    // },
    // build: {
    //   target: "esnext",
    // },
    // optimizeDeps: {
    //   include: ["@solana/web3.js", "buffer"],
    //   esbuildOptions: {
    //     target: "esnext",
    //   },
    // },
    // define: {
    //   "process.env.BROWSER": true,
    // },

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
