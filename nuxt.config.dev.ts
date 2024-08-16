export default defineNuxtConfig({
  // Including the necessary modules/plugins
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxt/content',
    '@unlok-co/nuxt-stripe',
    '@nuxt/eslint',
    // Exclude @nuxt/icon in development
    // '@nuxt/icon'
  ],

  // Vite configuration, specifically aliasing
  vite: {
    resolve: {
      alias: {
        '@': '.', // Alias '@' to the project root directory
      },
    },
  },
  srcDir: '.',

  pinia: {
    storesDirs: ['./stores/**'],
  },

  // Setting a compatibility date for Nuxt features
  compatibilityDate: '2024-08-13',

  // Stripe configuration for server and client sides
  stripe: {
    server: {
      key: 'sk_test_123',
      options: {
        apiVersion: '2024-04-10',
      },
    },
    client: {
      key: 'pk_test_123',
      options: {},
    },
  },

  // Global CSS
  css: ['~/assets/css/tailwind.css'],

  // Runtime configuration for sensitive keys and secrets
  runtimeConfig: {
    public: {
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
    },
    private: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GITHUB_ID: process.env.GITHUB_ID,
      GITHUB_SECRET: process.env.GITHUB_SECRET,
      GOOGLE_ID_KEY: process.env.GOOGLE_ID,
      GOOGLE_SECRET: process.env.GOOGLE_SECRET,
      AUTH_SECRET: process.env.AUTH_SECRET,
      JWT_SECRET: process.env.JWT_SECRET,
    },
  },

  // Nuxt content module configuration
  content: {
    documentDriven: true,
  },

  // Control over Nuxt devtools
  devtools: {
    enabled: false,
  },
})
