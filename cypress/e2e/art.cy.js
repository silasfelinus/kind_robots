// cypress/e2e/art.cy.js
/* eslint-disable no-undef */

describe('Art Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/art'
  const apiKey = Cypress.env('API_KEY')
  const userToken = Cypress.env('USER_TOKEN')
  let artId // Store art ID for further operations
  let generatedPath // Store the dynamically generated path for verification

  // Create a new Art before running tests
  before(() => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        promptString: 'surreal, A beautiful pancake sunrise over the mountains',
        steps: 10,
        path: ' ',
        seed: null,
        userId: 9,
        promptId: null,
        galleryId: 21,
        channelId: 1,
        pitchId: null,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('art').that.is.an('object')
      artId = response.body.art.id
      generatedPath = response.body.art.path

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
        Authorization: `Bearer ${userToken}`, // Add Authorization header
      },
      body: {
        cfg: 7,
        cfgHalf: true,
        checkpoint: 'model-checkpoint-001',
        sampler: 'Euler',
        seed: -1,
        steps: 10,
        designer: 'kinddesigner',
        promptString: 'A beautiful sunrise over pancake mountains',
        galleryId: 21,
        userId: 9,
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
        Authorization: `Bearer ${userToken}`, // Add Authorization header
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.art.path).to.include('cafefred')
      expect(response.body.art.path).to.match(/\.webp$/)
      expect(response.body.art.cfg).to.eq(7)
      expect(response.body.art).to.include({
        id: artId,
        userId: 9,
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
        Authorization: `Bearer ${userToken}`, // Add Authorization header
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
        Authorization: `Bearer ${userToken}`, // Authorization header for update
      },
      body: {
        path: 'notreal.webp',
        designer: 'newdesigner',
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      const expectedPathEnd = 'notreal.webp'
      const actualPath = response.body.updatedArt.path
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
        Authorization: `Bearer ${userToken}`, // Authorization header for delete
      },
    }).then((response) => {
      expect(response.status).to.eq(200)

      // Verify that the art entry no longer exists
      cy.request({
        method: 'GET',
        url: `${baseUrl}/${artId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          Authorization: `Bearer ${userToken}`, // Authorization header for get verification
        },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(404)
      })
    })
  })
})
