// /nuxt.config.ts
import tailwindcss from '@tailwindcss/vite'
import { DEFAULT_STARTUP_ANIMATION_SRC } from './utils/startupAnimations'

const requireEnv = (key: string) => {
  const value = process.env[key]

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  return value
}

const buildId =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.NUXT_PUBLIC_BUILD_ID ||
  'development'

const startupAnimationSrc = DEFAULT_STARTUP_ANIMATION_SRC

/*
 * The build targets 'esnext', so nothing lowers syntax and nothing polyfills
 * missing APIs. On engines that predate the newer array/object methods the
 * entry chunk throws during module evaluation — the observed production
 * failure was "e.split(...).at is not a function" from
 * effect-component-registry's pascalFromPath, thrown at ~1.9s, after which
 * Vue never mounts: the startup animation loops forever and its control tray
 * responds to hover (CSS) but not clicks (needs a mounted handler).
 *
 * This inline classic script runs during head parsing, before any deferred
 * module script, so every chunk (and node_modules) sees the patched builtins.
 * Covered: everything the built entry chunk actually references beyond ES2020
 * (verified by grepping the bundle): .at, Object.hasOwn, structuredClone,
 * String.replaceAll, and the ES2023 change-by-copy array methods.
 */
const legacyEnginePolyfillScript = `(() => {
  const def = (obj, name, value) => {
    try {
      Object.defineProperty(obj, name, { value, writable: true, configurable: true })
    } catch {}
  }

  const at = function at(n) {
    n = Math.trunc(n) || 0
    if (n < 0) n += this.length
    return n < 0 || n >= this.length ? undefined : this[n]
  }
  if (!Array.prototype.at) def(Array.prototype, 'at', at)
  if (!String.prototype.at) def(String.prototype, 'at', at)

  if (!Object.hasOwn) {
    def(Object, 'hasOwn', (obj, key) => Object.prototype.hasOwnProperty.call(obj, key))
  }

  if (!String.prototype.replaceAll) {
    def(String.prototype, 'replaceAll', function replaceAll(search, replacement) {
      if (search instanceof RegExp) return this.replace(search, replacement)
      const escaped = String(search).replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&')
      return this.replace(new RegExp(escaped, 'g'), replacement)
    })
  }

  if (!Array.prototype.toSorted) {
    def(Array.prototype, 'toSorted', function toSorted(cmp) { return this.slice().sort(cmp) })
  }
  if (!Array.prototype.toReversed) {
    def(Array.prototype, 'toReversed', function toReversed() { return this.slice().reverse() })
  }
  if (!Array.prototype.toSpliced) {
    def(Array.prototype, 'toSpliced', function toSpliced(...args) {
      const copy = this.slice()
      copy.splice(...args)
      return copy
    })
  }
  if (!Array.prototype.with) {
    def(Array.prototype, 'with', function withItem(index, value) {
      const copy = this.slice()
      const n = Math.trunc(index) || 0
      copy[n < 0 ? n + copy.length : n] = value
      return copy
    })
  }

  if (typeof structuredClone !== 'function') {
    const clone = (value, seen) => {
      if (value === null || typeof value !== 'object') return value
      if (seen.has(value)) return seen.get(value)
      if (value instanceof Date) return new Date(value.getTime())
      if (value instanceof RegExp) return new RegExp(value.source, value.flags)
      if (value instanceof Map) {
        const out = new Map()
        seen.set(value, out)
        value.forEach((v, k) => out.set(clone(k, seen), clone(v, seen)))
        return out
      }
      if (value instanceof Set) {
        const out = new Set()
        seen.set(value, out)
        value.forEach((v) => out.add(clone(v, seen)))
        return out
      }
      if (Array.isArray(value)) {
        const out = []
        seen.set(value, out)
        for (const item of value) out.push(clone(item, seen))
        return out
      }
      const out = {}
      seen.set(value, out)
      for (const key of Object.keys(value)) out[key] = clone(value[key], seen)
      return out
    }
    def(window, 'structuredClone', (value) => clone(value, new Map()))
  }
})()`

const startupPrehydrateScript = `(() => {
  // Preload only. This used to also stamp a cover class on <html> and manage
  // sessionStorage handoff state for a pre-hydration launch screen that no
  // longer exists; the boot cover is plain markup + CSS, and kind-loader owns
  // the decision about whether to play the intro.
  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = ${JSON.stringify(startupAnimationSrc)}
  link.fetchPriority = 'high'
  document.head.appendChild(link)
})()`

export default defineNuxtConfig({
  compatibilityDate: '2026-06-01',
  app: {
    head: {
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, viewport-fit=cover',
        },
        // Matches the light theme's primary (terracotta) in assets/css/tailwind.css;
        // also set as pwa.manifest.theme_color below for the install-prompt chrome.
        { name: 'theme-color', content: '#b4653a' },
      ],
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
      script: [
        // Must stay first: patches builtins the rest of the bundle assumes.
        {
          innerHTML: legacyEnginePolyfillScript,
          tagPosition: 'head',
        },
        {
          innerHTML: startupPrehydrateScript,
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
      target: 'es2020',
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
    '@vite-pwa/nuxt',
  ],

  // ai-art-academy/t-066: installability foundation for t-062/t-063's mobile
  // delivery path. This is intentionally not a full offline application: pages
  // are SSR/API-driven, so precaching hundreds of route-local JS chunks does
  // not make an offline refresh work. It only makes every install/update fetch
  // the whole product. Keep the service worker + manifest for installability
  // and precache only the small, stable install chrome.
  pwa: {
    registerType: 'autoUpdate',
    // ruler-hooked/t-015: `installPrompt` gates the entire custom-install-flow
    // block in @vite-pwa/nuxt's client plugin (dist/runtime/plugins/
    // pwa.client.js) -- without it set, `beforeinstallprompt` is never
    // listened for and `$pwa.showInstallPrompt` / `$pwa.install()` are
    // permanently inert no-ops, regardless of the VitePwaManifest fix from
    // ai-art-academy/t-062+t-063. Turning it on is what makes the shared
    // `usePWA()` composable's install affordance usable anywhere in the app;
    // ruler-hooked-page.vue is the first (and so far only) place that wires
    // up UI for it. String value names the localStorage key the module uses
    // to remember a user's "don't ask again" dismissal.
    client: {
      installPrompt: 'kr-pwa-install-dismissed',
    },
    manifest: {
      name: 'Kind Robots',
      short_name: 'Kind Robots',
      description: 'A friendly AI playground for humans and robots.',
      theme_color: '#b4653a',
      background_color: '#f7f1e3',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
        {
          src: '/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      // No JS/CSS glob here on purpose. Route-local assets should be fetched
      // when their feature is visited, not downloaded during PWA installation.
      globPatterns: [
        'icon-192x192.png',
        'icon-512x512.png',
        'apple-touch-icon.png',
        'favicon.ico',
      ],
      navigateFallback: null,
      // ruler-hooked/t-015: the game already plays fully offline once loaded
      // (its state lives in localStorage, see components/ruler-hooked) --
      // the gap was the *document* itself not surviving an offline reload.
      // Nitro doesn't put long-lived cache headers on SSR HTML the way it
      // does on hashed build output, so a hard reload with no network fails
      // even after a first visit. Cache just this one route's rendered
      // document (network-first, so a return visit still gets fresh content
      // when online) rather than widening the install-chrome-only precache
      // policy above -- see that budget note for why the rest of the site
      // stays install-only. This does not attempt to cover client-side SPA
      // navigation *into* the route from elsewhere while offline, only a
      // full reload/open of a URL that has been fully loaded before.
      runtimeCaching: [
        {
          urlPattern: /^https?:\/\/[^/]+\/plan\/projects\/ruler-hooked\/?$/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'ruler-hooked-document',
            networkTimeoutSeconds: 3,
            expiration: {
              maxEntries: 1,
              maxAgeSeconds: 60 * 60 * 24 * 30,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
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

  /*
   * Keep retired public entry points useful instead of turning bookmarks into
   * dead ends. Memory Dungeon moved from /memory to /play/memory when Lab was
   * dissolved. WonderLab was retired on 2026-08-11, so its legacy entry point
   * now falls back to the broader Plan channel rather than keeping the museum
   * implementation alive.
   *
   * Storymaker was renamed to Storybook on 2026-08-02 (interface-vision t-002).
   * 301 redirects are intentional because these legacy paths are permanent
   * compatibility aliases, not temporary routing experiments.
   */
  routeRules: {
    '/memory': { redirect: { to: '/play/memory', statusCode: 301 } },
    '/wonderlab': { redirect: { to: '/plan', statusCode: 301 } },
    '/storymaker': { redirect: { to: '/storybook', statusCode: 301 } },
  },

  nitro: {
    prerender: {
      crawlLinks: false,
      routes: [],
    },
  },
})
