import { exec } from 'child_process'

// Define a type for exec's callback
type ExecCallback = (
  error: Error | null,
  stdout: string,
  stderr: string,
) => void

export default defineNuxtConfig({
  vite: {
    build: {
      target: 'esnext', // Target modern JavaScript features
      minify: 'esbuild', // Use esbuild for minification (faster than Terser)
      chunkSizeWarningLimit: 500, // Customize chunk size warning (in KB)
    },
    optimizeDeps: {
      include: ['vue', 'vue-router'], // Pre-bundle necessary dependencies for faster builds
    },
  },

  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/image',
  ],

  components: [
    {
      path: '~/components/content',
      pathPrefix: false,
      extensions: ['.vue'],
      global: true,
    },
    {
      path: '~/components/abandonware',
      global: false,
      ignore: ['**/*.vue'], // completely skip all .vue files
    },
  ],

  // Compatibility and feature settings
  compatibilityDate: '2024-08-13',

  icon: {
    customCollections: [
      {
        prefix: 'kind-icon',
        dir: './assets/icons',
      },
    ],
  },

  // Global CSS
  css: ['~/assets/css/tailwind.css'],

  runtimeConfig: {
    private: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      GITHUB_ID: process.env.GITHUB_ID || '',
      GITHUB_SECRET: process.env.GITHUB_SECRET || '',
      GOOGLE_ID: process.env.GOOGLE_ID || '',
      GOOGLE_SECRET: process.env.GOOGLE_SECRET || '',
      AUTH_SECRET: process.env.AUTH_SECRET || '',
      JWT_SECRET: process.env.JWT_SECRET || '',
    },
  },

  devtools: {
    enabled: false, // Disable devtools in production
  },

  // Adding the build hook to run the script
  hooks: {
    'build:before': async () => {
      if (process.env.NODE_ENV === 'development') {
        const command = 'node utils/scripts/create-component-json.mjs'

        const callback: ExecCallback = (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to generate components JSON:', error)
            return
          }
          if (stderr) {
            console.error('stderr:', stderr)
          }
          console.log(stdout)
        }

        exec(command, callback)
      } else {
        console.log('Skipping component JSON generation in production mode.')
      }
    },
  },
})
