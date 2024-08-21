// cypress/e2e/api/users.cy.js
/* eslint-disable no-undef */
describe('Users API Endpoint', () => {
  // Test successful fetch of users
  it('successfully fetches users', () => {
    cy.request('/api/users').then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body).to.have.property('users')
    })
  })
})
