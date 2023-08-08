import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxt/content',
    'nuxt-icon',
    '@sidebase/nuxt-auth',
    '@nuxthq/studio'
  ],
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
  }
})
