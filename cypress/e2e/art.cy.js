/* eslint-disable no-undef */

describe('Art Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/art'
  const apiKey = Cypress.env('API_KEY')
  let artId // Store art ID for further operations
  let generatedPath
  const invalidToken = 'someInvalidTokenValue'
  const userToken = Cypress.env('USER_TOKEN')

  // Create a new Art before running tests
  before(() => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/`,
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
        userId: 9,
      },
      failOnStatusCode: false,
    }).then((response) => {
      cy.log('API Response:', JSON.stringify(response.body))

      expect(response.status).to.eq(200)
      if (!response.body.success) {
        throw new Error(
          `API error occurred: ${response.body.message || 'Unknown error'}`,
        )
      }

      artId = response.body.art?.id
      generatedPath = response.body.art?.path
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
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.art.path).to.include('cafefred')
      expect(response.body.art.path).to.match(/\.webp$/)
      expect(response.body.art.cfg).to.eq(7)
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

  it('should allow updating an art entry with a valid authorization token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${artId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        path: 'updated-path-123.webp',
        designer: 'updatedDesigner',
        isPublic: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.updatedArt).to.include({
        id: artId,
        designer: 'updatedDesigner',
        isPublic: true,
      })
    })
  })

  it('should not allow updating an art entry without an authorization token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${artId}`,
      failOnStatusCode: false,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        designer: 'unauthorizedDesigner',
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow updating an art entry with an invalid authorization token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${artId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
      body: {
        path: 'invalid-token-path.webp',
        designer: 'invalidTokenDesigner',
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Test delete cases here

  it('should not allow deleting an art entry without an authorization token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${artId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow deleting an art entry with an invalid authorization token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${artId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  // Finally, delete the art entry with a valid token

  it('should allow deleting an art entry with a valid authorization token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${artId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.message).to.include(
        `Art entry with ID ${artId} deleted successfully`,
      )
    })
  })
})
