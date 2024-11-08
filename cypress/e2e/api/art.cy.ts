/* eslint-disable @typescript-eslint/no-unused-expressions */
describe('Art Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/art'
  const apiKey = Cypress.env('API_KEY')
  let artId: number // Store art ID for further operations
  let generatedPath
  const invalidToken = 'someInvalidTokenValue'
  const userToken = Cypress.env('USER_TOKEN')

  before(() => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        promptString: 'surreal, A beautiful pancake sunrise over the mountains',
        steps: 10,
        path: ' ',
        seed: null,
        galleryId: null,
        promptId: null,
        pitchId: null,
        userId: 9,
      },
      failOnStatusCode: false,
    }).then((response) => {
      cy.log('API Response:', JSON.stringify(response.body))

      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty

      artId = response.body.data.id
      generatedPath = response.body.data.path
      if (!artId || !generatedPath) {
        throw new Error('Failed to capture art ID or path from response')
      }
    })
  })

  it('should not allow creating art without a bearer token', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/generate`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        promptString: 'A sunset over the ocean',
        steps: 20,
        cfg: 5,
        path: ' ',
        seed: null,
        galleryId: null,
        promptId: null,
        pitchId: null,
        userId: 9,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Authorization token required')
    })
  })

  it('should not allow creating art with an invalid bearer token', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/generate`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        promptString: 'A sunset over the ocean',
        steps: 20,
        cfg: 5,
        path: ' ',
        seed: null,
        galleryId: null,
        promptId: null,
        pitchId: null,
        userId: 9,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include(
        'Invalid or expired authorization token',
      )
    })
  })

  it('should allow creating art with a valid bearer token', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/generate`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        promptString: 'A sunset over the ocean',
        steps: 20,
        cfg: 7,
        path: ' ',
        seed: null,
        galleryId: null,
        promptId: null,
        pitchId: null,
        userId: 9,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty
      artId = response.body.data.id
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
      expect(response.body.success).to.be.true
      expect(response.body.data.path).to.include('cafefred')
      expect(response.body.data.path).to.match(/\.webp$/)
      expect(response.body.data.cfg).to.eq(7)
      expect(response.body.data).to.include.keys(['createdAt', 'updatedAt'])
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
      expect(response.body.success).to.be.true
      expect(response.body.data)
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
      expect(response.body.success).to.be.true
      expect(response.body.data).to.include({
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
      expect(response.body.success).to.be.false
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
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

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
      expect(response.body.success).to.be.false
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
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

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
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include(
        `Art entry with ID ${artId} deleted successfully`,
      )
    })
  })
})
