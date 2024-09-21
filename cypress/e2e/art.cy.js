/* eslint-disable no-undef */

describe('Art Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/art'
  const apiKey = Cypress.env('API_KEY')
  let artId // Store art ID for further operations
  let generatedPath // Store the dynamically generated path for verification

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
        path: ' ',
        seed: null,
        channelId: null,
        galleryId: null,
        promptId: null,
        pitchId: null,
      },
      failOnStatusCode: false, // Prevent Cypress from failing immediately if the status is not 200
    }).then((response) => {
      cy.log('API Response:', JSON.stringify(response.body))

      expect(response.status).to.eq(200)

      if (!response.body.success) {
        throw new Error(
          `API error occurred: ${response.body.message || 'Unknown error'}`,
        )
      }

      expect(response.body).to.have.property('art')
      expect(response.body.art).to.be.an('object')

      artId = response.body.art?.id
      generatedPath = response.body.art?.path // Capture the generated path

      cy.log('Captured artId:', artId)
      cy.log('Captured generatedPath:', generatedPath)

      if (!artId || !generatedPath) {
        throw new Error('Failed to capture art ID or path from response')
      }
    })
  })

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
      expect(response.status).to.eq(200)
      expect(response.body.art).to.be.an('object').that.is.not.empty
      artId = response.body.art.id
    })
  })

  it('Get Art by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${artId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)

      // Check that the path includes 'cafefred' and ends with '.webp'
      expect(response.body.art.path).to.include('cafefred')
      expect(response.body.art.path).to.match(/\.webp$/)

      // Ensure cfg is checked as a number
      expect(response.body.art.cfg).to.eq(7) // Compare cfg as a number

      expect(response.body.art).to.include({
        id: artId,
        userId: 1,
        promptId: 1,
        pitchId: 1,
        checkpoint: 'model-checkpoint-001',
        sampler: 'Euler',
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
        path: 'cafefred-1695613612691.webp', // Testing with a truncated path
        designer: 'newdesigner',
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)

      const expectedPathEnd = 'cafefred-1695613612691.webp'
      const actualPath = response.body.updatedArt.path

      // Ensure the path ends with the expected filename, allowing for truncation
      expect(actualPath).to.include(expectedPathEnd)

      expect(response.body.updatedArt).to.include({
        id: artId,
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
    })
  })
})
