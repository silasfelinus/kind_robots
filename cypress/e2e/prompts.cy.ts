// cypress/e2e/prompts.cy.ts

describe('Prompt Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/prompts'
  const apiKey = Cypress.env('API_KEY')
  let promptId: number | undefined // Define with undefined for clarity

  before(() => {
    // Create a prompt to reuse across tests
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
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

  it('Attempt to Update Prompt without Authentication (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { prompt: 'unauthorized bunny update' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Update Prompt with Authentication', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: { prompt: 'angel bunny' },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  it('Get Prompt by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.prompt).to.eq('angel bunny')
    })
  })

  it('Get All Prompts', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.prompts)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Attempt to Delete Prompt without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${promptId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Delete Prompt with Authentication', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${promptId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  // Cleanup: Ensure deletion if prompt was not removed during tests
  after(() => {
    if (promptId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${promptId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(200)
      })
    }
  })
})
