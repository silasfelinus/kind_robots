import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/content',
    'nuxt-icon',
    '@pinia/nuxt',
    '@sidebase/nuxt-auth'
  ],
  pinia: {
    autoImports: [
      'defineStore' // import { defineStore } from 'pinia'
    ]
  },
  css: ['~/assets/css/tailwind.css'],
  auth: {
    provider: {
      type: 'authjs'
    }
  },
  runtimeConfig: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    GOOGLE_ID_KEY: process.env.GOOGLE_ID,
    GOOGLE_SECRET: process.env.GOOGLE_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET
  },
  content: {
    documentDriven: true
  },
  devtools: {
    enabled: false
  },
  app: {
    pageTransition: {
      name: 'rotate',
      mode: 'out-in' // default
    },
    layoutTransition: {
      name: 'bounce',
      mode: 'out-in' // default
    }
  }
})
