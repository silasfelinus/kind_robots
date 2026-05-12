/* eslint-disable no-undef */
// cypress/e2e/spec.cy.js
describe('Dev Site Active', () => {
  it('passes', () => {
    cy.visit('http://kind-robots.vercel.app/')
  })
})

describe('kind-robots.vercel.app  Active', () => {
  it('passes', () => {
    cy.visit('https://kind-robots.vercel.app/')
  })
})
