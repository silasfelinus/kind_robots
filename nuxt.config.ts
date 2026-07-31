// /nuxt.config.ts
import { execFileSync } from 'node:child_process'
import tailwindcss from '@tailwindcss/vite'

const requireEnv = (key: string) => {
  const value = process.env[key]

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

function generateWonderLabComponentMetadata(): void {
  try {
    const output = execFileSync(
      process.execPath,
      ['utils/scripts/create-component-json.mjs'],
      { encoding: 'utf8' },
    )
    console.log(output.trim())
  } catch (error) {
    console.error('Failed to generate WonderLab component metadata:', error)
    throw error
  }
}

const buildId =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.NUXT_PUBLIC_BUILD_ID ||
  'development'

const startupAnimationSrc = '/images/startup-animations/launch-04.webp'

const startupPrehydrateScript = `(() => {
  const FORCE_KEY = 'kind-robots-force-full-startup-v1'
  const SEEN_KEY = 'kind-robots-startup-build-v1'
  const COVER_CLASS = 'kr-full-startup'
  const ANIMATION_SRC = ${JSON.stringify(startupAnimationSrc)}

  let forced = false
  let reloading = false

  try {
    forced = sessionStorage.getItem(FORCE_KEY) === '1'
  } catch {}

  try {
    const navigation = performance.getEntriesByType('navigation')[0]
    reloading = navigation?.type === 'reload'
  } catch {}

  const shouldCover = forced || !reloading

  if (shouldCover) {
    if (!reloading) {
      try {
        localStorage.removeItem(SEEN_KEY)
      } catch {}
    }

    document.documentElement.classList.add(COVER_CLASS)

    const preload = document.createElement('link')
    preload.rel = 'preload'
    preload.as = 'image'
    preload.href = ANIMATION_SRC
    preload.fetchPriority = 'high'
    document.head.appendChild(preload)
  }
})()`

/*
 * Webfonts must never be able to stall the app.
 *
 * These were CSS \`@import url(...)\` statements inside component <style> blocks
 * (login-page.vue, sponsor-page.vue). Vite hoists those into the bundled global
 * stylesheet, and a pending stylesheet blocks script execution — so hydration of
 * the whole application waited on fonts.googleapis.com. Measured at 12.7s in one
 * environment, and unbounded for anyone whose network blocks Google Fonts
 * (ad/tracker blockers, DNS filtering, school and corporate networks). The
 * symptom is total: the startup animation never fades and its controls never
 * become interactive, because no Vue ever mounts to run them.
 *
 * media="print" makes the browser fetch the sheet without treating it as
 * render-blocking; the onload handler promotes it once it has arrived. If it
 * never arrives, the app is entirely unaffected.
 */
const asyncFontHrefs = [
  'https://fonts.googleapis.com/css2?family=Syne:wght@800&display=swap',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap',
]

const asyncFontScript = `(() => {
  const HREFS = ${JSON.stringify(asyncFontHrefs)}

  // Deliberately deferred to the load event. Appending a stylesheet from a
  // parser-inserted script — even with media="print" — makes it a pending
  // stylesheet that blocks the parser and every script after it, which is the
  // exact failure being fixed here (measured: the renderer stayed blocked for
  // as long as fonts.googleapis.com hung). After load, nothing is left to block.
  const addFontLinks = () => {
    for (const href of HREFS) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.media = 'print'
      link.addEventListener('load', () => { link.media = 'all' }, { once: true })
      document.head.appendChild(link)
    }
  }

  if (document.readyState === 'complete') addFontLinks()
  else window.addEventListener('load', addFontLinks, { once: true })
})()`

generateWonderLabComponentMetadata()

export default defineNuxtConfig({
  compatibilityDate: '2026-06-01',
  app: {
    head: {
      script: [
        {
          innerHTML: startupPrehydrateScript,
          tagPosition: 'head',
        },
        {
          innerHTML: asyncFontScript,
          tagPosition: 'head',
        },
      ],
    },
  },
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
    vue: {
      template: {
        transformAssetUrls: {
          // `/images/...` is served by the external media origin at runtime.
          includeAbsolute: false,
        },
      },
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      chunkSizeWarningLimit: 500,
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', 'canvas-confetti'],
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

  css: ['~/assets/css/startup-cover.css', '~/assets/css/tailwind.css'],

  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    githubId: process.env.GITHUB_ID || '',
    githubSecret: process.env.GITHUB_SECRET || '',
    githubToken: process.env.GITHUB_TOKEN || '',
    // AppMaker GitHub App (appmaker/t-007/t-008, GITHUB-APP-DESIGN.md).
    appmakerGhAppId: process.env.APPMAKER_GH_APP_ID || '',
    appmakerGhAppKey: process.env.APPMAKER_GH_APP_KEY || '',
    appmakerGhWebhookSecret: process.env.APPMAKER_GH_WEBHOOK_SECRET || '',
    googleId: process.env.GOOGLE_ID || '',
    googleSecret: process.env.GOOGLE_SECRET || '',
    authSecret: process.env.AUTH_SECRET || '',
    jwtSecret: process.env.JWT_SECRET || '',
    serverSecretKey: process.env.SERVER_SECRET_KEY || '',
    // Brevo (Sendinblue) transactional email + newsletter contact sync.
    brevoApiKey: process.env.BREVO_API_KEY || '',
    brevoSenderEmail: process.env.BREVO_SENDER_EMAIL || 'hello@kindrobots.org',
    brevoSenderName: process.env.BREVO_SENDER_NAME || 'Kind Robots',
    brevoNewsletterListId: process.env.BREVO_NEWSLETTER_LIST_ID || '',
    public: {
      appBaseUrl: process.env.APP_BASE_URL || 'https://kindrobots.org',
      buildId,
    },
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
})
