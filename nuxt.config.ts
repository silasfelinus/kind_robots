// /nuxt.config.ts
import { exec } from 'child_process'

type ExecCallback = (
  error: Error | null,
  stdout: string,
  stderr: string,
) => void

export default defineNuxtConfig({
  vite: {
    build: {
      target: 'esnext',
      minify: 'esbuild',
      chunkSizeWarningLimit: 500,
    },
    optimizeDeps: {
      include: ['vue', 'vue-router'],
    },
  },

  experimental: {
    appManifest: false,
  },

  nitro: {
    esbuild: {
      options: {
        target: 'es2022',
      },
    },
    rollupConfig: {
      external: ['@prisma/client', '@prisma/client/runtime'],
    },
    externals: {
      inline: [],
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

  tailwindcss: {
    viewer: false,
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
      global: true,
      extensions: ['.vue'],
      watch: true,
      ignore: ['abandonware/**/*.vue'],
    },
  ],

  compatibilityDate: '2024-08-13',

  icon: {
    customCollections: [
      {
        prefix: 'kind-icon',
        dir: './assets/icons',
      },
    ],
  },

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
    enabled: false,
  },

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
          if (stdout) {
            console.log(stdout)
          }
        }

        exec(command, callback)
      } else {
        console.log('Skipping component JSON generation in production mode.')
      }
    },
  },
})
