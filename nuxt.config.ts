// /nuxt.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-08-13',

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
        clientSecret: process.env.AUTHELIA_CLIENT_SECRET || '',
        baseUrl: 'https://auth.acrocatranch.com',
        authorizationUrl:
          'https://auth.acrocatranch.com/api/oidc/authorization',
        tokenUrl: 'https://auth.acrocatranch.com/api/oidc/token',
        userInfoUrl: 'https://auth.acrocatranch.com/api/oidc/userinfo',
        redirectUri:
          process.env.NUXT_OIDC_PROVIDERS_AUTHELIA_REDIRECT_URI ||
          'https://kindrobots.org/auth/authelia/callback',
        scope: ['openid', 'profile', 'email'],
        userNameClaim: 'preferred_username',
      },
    },
    session: {
      expirationCheck: true,
      automaticRefresh: true,
    },
    middleware: {
      globalMiddlewareEnabled: false,
      customLoginPage: false,
    },
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
      global: true,
      extensions: ['.vue'],
      ignore: ['abandonware/**/*.vue'],
    },
  ],

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
      process.env.NUXT_OIDC_PROVIDERS_AUTHELIA_REDIRECT_URI ||
      'https://kindrobots.org/auth/authelia/callback',

    openaiApiKey: process.env.OPENAI_API_KEY || '',
    githubId: process.env.GITHUB_ID || '',
    githubSecret: process.env.GITHUB_SECRET || '',
    googleId: process.env.GOOGLE_ID || '',
    googleSecret: process.env.GOOGLE_SECRET || '',
    authSecret: process.env.AUTH_SECRET || '',
    jwtSecret: process.env.JWT_SECRET || '',
    serverSecretKey: process.env.SERVER_SECRET_KEY || '',
  },

  devtools: {
    enabled: false,
  },

  hooks: {
    'build:before': async () => {
      if (process.env.NODE_ENV !== 'development') {
        console.log('Skipping component JSON generation in production mode.')
        return
      }

      const { exec } = await import('node:child_process')

      exec(
        'node utils/scripts/create-component-json.mjs',
        (error, stdout, stderr) => {
          if (error) {
            console.error('Failed to generate components JSON:', error)
            return
          }

          if (stderr) {
            console.error('stderr:', stderr)
          }

          console.log(stdout)
        },
      )
    },
  },
})
