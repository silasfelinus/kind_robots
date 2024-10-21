import { exec } from 'child_process'

// Define a type for exec's callback
type ExecCallback = (
  error: Error | null,
  stdout: string,
  stderr: string,
) => void

export default defineNuxtConfig({
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  },
  // Including the necessary modules/plugins
  modules: [// Pinia state management
  '@pinia/nuxt', // Tailwind CSS for styling
  '@nuxtjs/tailwindcss', // Nuxt Content for Markdown, JSON, etc.
  '@nuxt/content', // Stripe module for payments
  '@unlok-co/nuxt-stripe', // ESLint module for linting
  '@nuxt/eslint', // Automatic icon imports
  '@nuxt/icon', '@nuxt/image'],

  // Vite configuration, specifically aliasing
  srcDir: '.',

  pinia: {
    storesDirs: ['./stores/**'],
  },

  // Setting a compatibility date for Nuxt features
  compatibilityDate: '2024-08-13',

  // Stripe configuration for server and client sides
  stripe: {
    server: {
      key: 'sk_test_123', // Server-side key
      options: {
        apiVersion: '2024-04-10', // API version
      },
    },
    client: {
      key: 'pk_test_123', // Client-side key
      options: {},
    },
  },

icon: {
    customCollections: [
      {
        prefix: 'my-icon',
        dir: './assets/my-icons'
      },
    ],
  },
  // Global CSS
  css: ['~/assets/css/tailwind.css'],

  // Runtime configuration for sensitive keys and secrets
  runtimeConfig: {
    public: {
      stripePublicKey: process.env.STRIPE_PUBLIC_KEY, // Public stripe key
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
    enabled: false, // Disable devtools in production
  },

  // Adding the build hook to run the script
  hooks: {
    'build:before': async () => {
      const command = 'node utils/scripts/create-component-json.mjs'

      const callback: ExecCallback = (error, stdout) => {
        if (error) {
          console.error('Failed to generate components JSON:', error)
          return
        }
        console.log(stdout)
      }

      exec(command, callback)
    },
  },
})