import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@nuxt/content', 'nuxt-icon', '@pinia/nuxt'],
  css: ['~/assets/css/tailwind.css'],
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
