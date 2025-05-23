import { exec } from 'child_process'

// Define a type for exec's callback
type ExecCallback = (
  error: Error | null,
  stdout: string,
  stderr: string,
) => void

export default defineNuxtConfig({
  build: {
    // Enables parallel processing during build to speed up the process
    parallel: true,

    // Extract CSS into separate files for better caching and smaller build size
    extractCSS: true,

    // Optimize CSS files by minifying them
    optimizeCSS: true,

    // Enable build cache for faster rebuilds (good for CI/CD or incremental builds)
    cache: true,

    // Reduce unnecessary bundle size and speed up build by removing unused code
    splitChunks: {
      layouts: true,
      pages: true,
      commons: true,
    },

    // Enable the modern build for better performance in modern browsers
    modern: 'client',

    // Allows webpack to use more parallel threads during the build
    optimization: {
      minimize: true,
      splitChunks: {
        chunks: 'all',
      },
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

  // Vite configuration, specifically aliasing
  srcDir: '.',

  pinia: {
    storesDirs: ['./stores/**'],
  },

  components: {
    global: true,
    dirs: ['~/components/content'],
  },

  // Setting a compatibility date for Nuxt features
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

  // ✅ Fix: Remove Type Casting and Let Nuxt Infer
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

  // Control over Nuxt devtools
  devtools: {
    enabled: false, // Disable devtools in production
  },

  // Adding the build hook to run the script
  hooks: {
    'build:before': async () => {
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
    },
  },
})
