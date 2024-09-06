// vite.config.mjs
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()], // Add the Vue plugin

  server: {
    hmr: {
      overlay: false, // Prevents Cypress from crashing on HMR warnings/errors
    },
  },
  build: {
    target: 'esnext',
  },
})
