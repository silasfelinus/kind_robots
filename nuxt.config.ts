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
  compatibilityDate: '2026-06-01',
  content: {
    experimental: {
      sqliteConnector: 'native',
    },
  },
  sourcemap: {
    server: false,
    client: false,
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      target: 'esnext',
      minify: 'esbuild',
      chunkSizeWarningLimit: 500,
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', 'canvas-confetti', 'open-simplex-noise'],
    },
  },

  modules: [
    '@pinia/nuxt',
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/image',
  ],

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
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    githubId: process.env.GITHUB_ID || '',
    githubSecret: process.env.GITHUB_SECRET || '',
    githubToken: process.env.GITHUB_TOKEN || '',
    googleId: process.env.GOOGLE_ID || '',
    googleSecret: process.env.GOOGLE_SECRET || '',
    authSecret: process.env.AUTH_SECRET || '',
    jwtSecret: process.env.JWT_SECRET || '',
    serverSecretKey: process.env.SERVER_SECRET_KEY || '',
  },

  devtools: {
    enabled: false,
  },
  nitro: {
    prerender: {
      crawlLinks: false,
      routes: [],
    },
  },

  hooks: {
    'build:before': async () => {
      if (process.env.NODE_ENV !== 'development') {
        console.log('Skipping component JSON generation in production mode.')
        return
      }
      const { execSync } = await import('node:child_process')
      try {
        const out = execSync('node utils/scripts/create-component-json.mjs')
        console.log(out.toString())
      } catch (err) {
        console.error('Failed to generate components JSON:', err)
      }
    },
  },
})
