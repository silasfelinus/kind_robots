import { defineNuxtConfig } from 'nuxt/config'
import { createPinia } from 'pinia'

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
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
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
