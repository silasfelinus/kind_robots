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

  // Test error handling when the fetch fails
  it('handles failures when fetching users', () => {
    cy.intercept('/api/users', {
      statusCode: 500,
      body: {
        success: false,
        message: 'Internal Server Error',
      },
    }).as('getUsersFail')

    cy.request({
      url: '/api/users',
      failOnStatusCode: false, // Prevent Cypress from failing the test on non-2xx status codes
    }).then((response) => {
      expect(response.status).to.eq(500)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.eq('Internal Server Error')
    })
  })
})
