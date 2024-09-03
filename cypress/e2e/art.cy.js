// cypress/e2e/api/art.cy.js
/* eslint-disable no-undef */

describe('Art Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/art'
  const apiKey = Cypress.env('API_KEY')
  let artId // Store art ID for further operations

  it('Create New Art', () => {
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
        prompt: 'zebra accountant',
        userId: 1,
        pitch: 'zebracore',
      },
      failOnStatusCode: false, // Prevents Cypress from failing on non-2xx status
    }).then((response) => {
      expect(response.status).to.eq(200, 'Expected status code to be 200')
      expect(response.body.newArt).to.be.an('object').that.is.not.empty
      artId = response.body.newArt.id // Ensure the correct ID is captured
      console.log('Created Art ID:', artId) // Log for debugging

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
      expect(response.body.art.path).to.eq(
        '/images/cafefred/cafefred-1695613612690.webp',
      ) // Expect the correct path
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
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
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
