// cypress/e2e/prompts.cy.ts

describe('Prompt Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/prompts'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let promptId: number | undefined // Define with undefined for clarity

  before(() => {
    // Create a prompt to reuse across tests
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        galleryId: 21,
        userId: 9,
        prompt: 'devil bunny',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      promptId = response.body.newPrompt.id
    })
  })

  // Test: Update Prompt without authentication
  it('Attempt to Update Prompt without Authentication (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { prompt: 'unauthorized bunny update' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
    })
  })

  // Test: Update Prompt with invalid token
  it('Attempt to Update Prompt with Invalid Token (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: { prompt: 'invalid token bunny update' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized with invalid token
    })
  })

  // Test: Update Prompt with valid authentication
  it('Update Prompt with Authentication', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: { prompt: 'angel bunny' },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  // Test: Retrieve Prompt by ID
  it('Get Prompt by ID', () => {
    cy.wrap(promptId).should('exist') // Ensure promptId exists
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.prompt).to.eq('angel bunny')
    })
  })

  // Test: Retrieve All Prompts
  it('Get All Prompts', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.prompts)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  // Test: Delete Prompt without authentication
  it('Attempt to Delete Prompt without Authentication (expect failure)', () => {
    cy.wrap(promptId).should('exist') // Ensure promptId exists
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${promptId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
    })
  })

  // Test: Delete Prompt with invalid token
  it('Attempt to Delete Prompt with Invalid Token (expect failure)', () => {
    cy.wrap(promptId).should('exist') // Ensure promptId exists
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized with invalid token
    })
  })

  // Test: Delete Prompt with valid authentication
  it('Delete Prompt with Authentication', () => {
    cy.wrap(promptId).should('exist') // Ensure promptId exists
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })
})
