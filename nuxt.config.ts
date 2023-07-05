import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@nuxt/content', 'nuxt-icon', '@pinia/nuxt'],
  css: ['~/assets/css/tailwind.css'],
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
    layoutTransition: { name: 'default', mode: 'out-in' }
  }
})
