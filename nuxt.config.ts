// /nuxt.config.ts
import tailwindcss from '@tailwindcss/vite'

const requireEnv = (key: string) => {
  const value = process.env[key]

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

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
    defaultProvider: 'oidc',

    providers: {
      oidc: {
        clientId: requireEnv('AUTHELIA_CLIENT_ID'),
        clientSecret: requireEnv('AUTHELIA_CLIENT_SECRET'),
        redirectUri: requireEnv('NUXT_OIDC_REDIRECT_URI'),

        authorizationUrl:
          'https://auth.acrocatranch.com/api/oidc/authorization',
        tokenUrl: 'https://auth.acrocatranch.com/api/oidc/token',
        userInfoUrl: 'https://auth.acrocatranch.com/api/oidc/userinfo',

        scope: ['openid', 'profile', 'email'],
        responseType: 'code',
        grantType: 'authorization_code',
        authenticationScheme: 'header',
        tokenRequestType: 'form',
        pkce: true,
        state: true,
        nonce: true,
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
      extensions: ['.vue'],
      ignore: ['abandonware/**/*.vue'],
    },
    {
      path: '~/components',
      pathPrefix: false,
      global: true,
      extensions: ['.vue'],
      pattern: ['**/gallery-gallery.vue', '**/lab-gallery.vue'],
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
