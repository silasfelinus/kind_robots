/// <reference types="cypress" />

export type CleanupRequest = {
  label: string
  method?: 'DELETE' | 'POST' | 'PATCH'
  url: string
  headers?: Record<string, string>
  body?: unknown
  expectedStatuses?: number[]
}

declare global {
  namespace Cypress {
    interface Chainable {
      registerApiCleanup(request: CleanupRequest): Chainable<unknown>
    }
  }
}

Cypress.Commands.add('registerApiCleanup', (request: CleanupRequest) => {
  return cy.task('cypressCleanup:register', request, { log: false })
})
