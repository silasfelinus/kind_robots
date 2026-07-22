// /cypress/e2e/stylist-access.cy.ts

describe('Superkate services and Hair Studio access', () => {
  it('keeps the Superkate services page public and separate from Hair Studio', () => {
    cy.visit('/stylist')

    cy.location('pathname', { timeout: 15000 }).should('eq', '/stylist')
    cy.contains('Superkate Services').should('exist')
    cy.contains('Calculator').should('exist')
    cy.contains('Hair Studio').should('not.exist')
  })

  it('serves Hair Studio as a public Lab page', () => {
    cy.visit('/hair-studio')

    cy.location('pathname', { timeout: 15000 }).should('eq', '/hair-studio')
    cy.contains('Hair Studio').should('exist')
    cy.contains('Preview a new color or cut').should('exist')
  })

  it('removes the obsolete combined project route', () => {
    cy.request({
      url: '/projects/build/stylist',
      failOnStatusCode: false,
    }).its('status').should('eq', 404)
  })
})
