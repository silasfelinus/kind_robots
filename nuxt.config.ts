import { exec } from 'child_process'
import tailwindcss from '@tailwindcss/vite'

type ExecCallback = (
  error: Error | null,
  stdout: string,
  stderr: string,
) => void

export default defineNuxtConfig({
  vite: {
    plugins: [tailwindcss()],
    build: {
      target: 'esnext',
      minify: 'esbuild',
      chunkSizeWarningLimit: 500,
    },
    optimizeDeps: {
      include: ['vue', 'vue-router'],
    },
  },

  modules: [
    '@pinia/nuxt',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/image',
    'nuxt-oidc-auth',
  ],

  oidc: {
    defaultProvider: 'authelia',
    providers: {
      authelia: {
        clientId: 'kind-robots',
        clientSecret: process.env.AUTHELIA_CLIENT_SECRET!,
        authorizationUrl:
          'https://auth.acrocatranch.com/api/oidc/authorization',
        tokenUrl: 'https://auth.acrocatranch.com/api/oidc/token',
        userinfoUrl: 'https://auth.acrocatranch.com/api/oidc/userinfo',
        redirectUri:
          process.env.NUXT_OIDC_REDIRECT_URI ??
          'http://localhost:3000/auth/callback',
        scope: ['openid', 'profile', 'email'],
        userNameClaim: 'preferred_username',
      },
    },
    session: {
      expirationCheck: true,
      automaticRefresh: true,
    },
    middleware: {
      globalMiddlewareEnabled: false, // ← only protect pages that explicitly opt in
    },
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

  typescript: {
    tsConfig: {
      vueCompilerOptions: {
        plugins: [],
      },
    },
  },

  css: ['~/assets/css/tailwind.css'],

  runtimeConfig: {
    autheliaClientSecret: process.env.AUTHELIA_CLIENT_SECRET || '',
    oidcRedirectUri:
      process.env.NUXT_OIDC_REDIRECT_URI ||
      'http://localhost:3000/auth/callback',
    private: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
      GITHUB_ID: process.env.GITHUB_ID || '',
      GITHUB_SECRET: process.env.GITHUB_SECRET || '',
      GOOGLE_ID: process.env.GOOGLE_ID || '',
      GOOGLE_SECRET: process.env.GOOGLE_SECRET || '',
      AUTH_SECRET: process.env.AUTH_SECRET || '',
      JWT_SECRET: process.env.JWT_SECRET || '',
      SERVER_SECRET_KEY: process.env.SERVER_SECRET_KEY || '',
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
          console.log(stdout)
        }

        exec(command, callback)
      } else {
        console.log('Skipping component JSON generation in production mode.')
      }
    },
  },
})
