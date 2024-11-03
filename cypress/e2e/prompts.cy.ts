// cypress/e2e/prompts.cy.ts

describe('Prompt Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/prompts'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let promptId: number | undefined // Define with undefined for clarity
  const uniquePrompt = `devil bunny ${Date.now()}`

  // Step 1: Attempt to create a prompt with various authentication scenarios

  it('should not allow creating a prompt without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        galleryId: 21,
        userId: 9,
        prompt: uniquePrompt,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow creating a prompt with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        galleryId: 21,
        userId: 9,
        prompt: uniquePrompt,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Create a New Prompt with Valid Authentication', () => {
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
        prompt: uniquePrompt,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      promptId = response.body.newPrompt.id
    })
  })

  // Step 2: Attempt to update prompt without authentication
  it('Attempt to Update Prompt without Authentication (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { prompt: 'unauthorized bunny update' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  // Step 3: Attempt to update prompt with invalid token
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
      expect(response.status).to.eq(401)
    })
  })

  // Step 4: Update prompt with valid authentication
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

  // Step 5: Retrieve prompt by ID
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

  // Step 6: Retrieve all prompts
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

  // Step 7: Attempt to delete prompt without authentication
  it('Attempt to Delete Prompt without Authentication (expect failure)', () => {
    cy.wrap(promptId).should('exist') // Ensure promptId exists
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${promptId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  // Step 8: Attempt to delete prompt with invalid token
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
      expect(response.status).to.eq(401)
    })
  })

  // Step 9: Delete prompt with valid authentication
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
