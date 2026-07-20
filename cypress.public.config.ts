import { defineConfig } from 'cypress'

const baseUrl = process.env.CYPRESS_BASE_URL

if (!baseUrl) {
  throw new Error('CYPRESS_BASE_URL is required for public acceptance tests.')
}

export default defineConfig({
  e2e: {
    baseUrl,
    specPattern: 'cypress/public/**/*.cy.ts',
    supportFile: false,
  },
  retries: {
    runMode: 1,
    openMode: 0,
  },
  video: false,
})
