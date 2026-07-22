// /cypress/e2e/stylist-access.cy.ts

describe('Hair Studio access', () => {
  it('keeps the legacy /stylist route public', () => {
    cy.visit('/stylist')

    cy.location('pathname', { timeout: 15000 }).should('eq', '/stylist')
    cy.contains('Hair Studio').should('exist')
  })

  it('serves the canonical project route without an admin gate', () => {
    cy.visit('/projects/build/stylist')

    cy.location('pathname', { timeout: 15000 }).should(
      'eq',
      '/projects/build/stylist',
    )
    cy.contains('Hair Studio').should('exist')
  })
})
