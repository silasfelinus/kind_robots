export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxt/content', 'nuxt-icon', '@unlok-co/nuxt-stripe'],
  stripe: {
    // Server
    server: {
      key: 'sk_test_123',
      options: {
        // your api options override for stripe server side
        apiVersion: '2022-11-15', // optional, default is '2022-11-15'
      },
      // CLIENT
    },
    client: {
      key: 'pk_test_123',
      // your api options override for stripe client side
      options: {},
    },
  },
  css: ['~/assets/css/tailwind.css'],
  runtimeConfig: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    GOOGLE_ID_KEY: process.env.GOOGLE_ID,
    GOOGLE_SECRET: process.env.GOOGLE_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    JWT_SECRET: process.env.JWT_SECRET,
  },
  content: {
    documentDriven: true,
  },
  devtools: {
    enabled: true
  }
});
