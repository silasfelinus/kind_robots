import { defineConfig } from 'cypress'
import {
  clearCypressApiSeed,
  ensureCypressApiSeed,
  isSeedUserId,
} from './cypress/support/cypress-seed/api-seed-node'

export default defineConfig({
  e2e: {
    baseUrl: 'https://kind-robots.vercel.app',
    setupNodeEvents(on, config) {
      on('before:run', async () => {
        await ensureCypressApiSeed(config.env as Record<string, unknown>)
      })

      on('task', {
        async 'cypressSeed:get'() {
          return ensureCypressApiSeed(config.env as Record<string, unknown>)
        },

        async 'cypressSeed:isSeedUser'(userId: number) {
          return isSeedUserId(config.env as Record<string, unknown>, userId)
        },

        'cypressSeed:clear'() {
          clearCypressApiSeed()
          return null
        },
      })

      return config
    },
  },

  projectId: 'm98sgq',

  allowCypressEnv: false,

  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
    },
  },
})
