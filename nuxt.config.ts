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

  modules: [
  '@pinia/nuxt', 
  '@nuxtjs/tailwindcss', 
  '@nuxt/content', 
  '@nuxt/eslint', 
  '@nuxt/icon', 
  '@nuxt/image'
  ],

  // Vite configuration, specifically aliasing
  srcDir: '.',

  pinia: {
    storesDirs: ['./stores/**'],
  },

  // Setting a compatibility date for Nuxt features
  compatibilityDate: '2024-08-13',


icon: {
    customCollections: [
      {
        prefix: 'kind-icon',
        dir: './assets/icons'
      },
    ],
  },
  // Global CSS
  css: ['~/assets/css/tailwind.css'],

  // Runtime configuration for sensitive keys and secrets
  runtimeConfig: {

    private: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GITHUB_ID: process.env.GITHUB_ID,
      GITHUB_SECRET: process.env.GITHUB_SECRET,
      GOOGLE_ID: process.env.GOOGLE_ID,
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