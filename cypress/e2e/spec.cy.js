// cypress/e2e/spec.cy.js
describe('Dev Site Active', () => {
  it('passes', () => {
    cy.visit('http://localhost:3000/')
  })
})

describe('kindrobots.org  Active', () => {
  it('passes', () => {
    cy.visit('https://kindrobots.org/')
  })
})
