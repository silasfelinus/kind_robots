// cypress/e2e/api/art.cy.js
/* eslint-disable no-undef */

describe('Art Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/art'
  const apiKey = Cypress.env('API_KEY')
  let artId // Store art ID for further operations

  // Test the basic POST route to register a new Art without generating it
  // Test the basic POST route to register a new Art without generating it
  it('Register New Art', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        galleryId: 21,
        path: ' ',
        userId: 1,
        promptString: 'A beautiful sunrise over the mountains',
        designer: 'kinddesigner',
        seed: null,
        steps: null,
        isPublic: true,
        isMature: false,
        promptId: null,
        pitchId: null,
        channelId: null,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200, 'Expected status code to be 200')
      expect(response.body.newArt).to.be.an('object').that.is.not.empty
      artId = response.body.newArt?.id // Ensure the correct ID is captured
      console.log('Registered Art ID:', artId) // Log for debugging

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
        galleryId: 21,
        path: '/images/cafefred/cafefred-1695613612690.webp',
        userId: 1,
        cfg: '7.5',
        checkpoint: 'model-checkpoint-001',
        sampler: 'Euler',
        seed: 12345,
        steps: 50,
        designer: 'kinddesigner',
        promptString: 'A beautiful sunrise over the mountains',
        isPublic: true,
        isMature: false,
        promptId: 1,
        pitchId: 1,
        channelId: 3,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200, 'Expected status code to be 200')
      expect(response.body.newArt).to.be.an('object').that.is.not.empty
      artId = response.body.newArt.id // Ensure the correct ID is captured
      console.log('Generated Art ID:', artId) // Log for debugging

      if (!artId) {
        throw new Error('Failed to capture art ID from response')
      }
    })
  })

  it('Get Art by ID', () => {
    if (!artId) {
      throw new Error('artId is undefined, cannot fetch art by ID')
    }
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
    if (!artId) {
      throw new Error('artId is undefined, cannot update art by ID')
    }
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
    if (!artId) {
      throw new Error('artId is undefined, cannot delete art by ID')
    }
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
