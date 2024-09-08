// cypress/e2e/api/art.cy.js
/* eslint-disable no-undef */

describe('Art Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/art'
  const apiKey = Cypress.env('API_KEY')
  let artId // Store art ID for further operations

  // Create a new Art before running tests
  before(() => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/generate`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        promptString: 'surreal, A beautiful pancake sunrise over the mountains',
        steps: 10,
        userId: 1,
        pitch: 'surreal',
      },
      failOnStatusCode: false, // Prevent Cypress from failing immediately if the status is not 200
    }).then((response) => {
      // Log response for debugging purposes
      cy.log('API Response:', JSON.stringify(response.body))

      // Check if response status is 200
      expect(response.status).to.eq(200, 'Expected status code to be 200')

      // Check if the response contains an error message
      if (!response.body.success) {
        throw new Error(
          `API error occurred: ${response.body.message || 'Unknown error'}`,
        )
      }

      // Validate if the response contains an art object
      expect(response.body).to.have.property('art') // Check that 'art' property exists
      expect(response.body.art).to.be.an('object') // Check that 'art' is indeed an object

      // Capture the artId
      artId = response.body.art?.id

      // Log the captured artId for debugging
      cy.log('Captured artId:', artId)

      // Fail the test if artId is undefined
      if (!artId) {
        throw new Error('Failed to capture art ID from response')
      }
    })
  })

  // Test the generate route to create a new Art including generating it
  it('Create New Art with Generation', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/generate`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        cfg: 7,
        cfgHalf: true,
        checkpoint: 'model-checkpoint-001',
        sampler: 'Euler',
        seed: -1,
        steps: 10,
        designer: 'kinddesigner',
        pitch: 'Beauty',
        promptString: 'A beautiful sunrise over the mountains',
        galleryId: 21,
        userId: 1,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200, 'Expected status code to be 200')
      expect(response.body.art).to.be.an('object').that.is.not.empty
      artId = response.body.art.id // Ensure the correct ID is captured
    })
  })

  it('Get Art by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/id/${artId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.art).to.include({
        id: artId,
        path: '/images/cafefred/cafefred-1695613612690.webp',
        userId: 1,
        promptId: 1,
        pitchId: 1,
        cfg: '7.5',
        checkpoint: 'model-checkpoint-001',
        sampler: 'Euler',
        seed: 12345,
        steps: 50,
        designer: 'kinddesigner',
        isPublic: true,
        isMature: false,
        channelId: 3,
      })
      expect(response.body.art).to.include.keys(['createdAt', 'updatedAt'])
    })
  })

  it('Get All Art', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.artEntries)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Update an Art', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${artId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        path: '/images/cafefred/cafefred-1695613612691.webp',
        designer: 'newdesigner',
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.updatedArt).to.include({
        id: artId,
        path: '/images/cafefred/cafefred-1695613612691.webp',
        designer: 'newdesigner',
        isPublic: false,
      })
    })
  })

  it('Delete an Art', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${artId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)

      // Try to get the deleted Art to ensure it has been deleted
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${artId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        failOnStatusCode: false,
      }).then((getResponse) => {
        expect(getResponse.status).to.eq(404, 'Expected 404 after deletion')
      })
    })
  })
})
