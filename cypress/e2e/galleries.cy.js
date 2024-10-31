// cypress/e2e/galleries.cy.js
/* eslint-disable no-undef */

describe('Gallery Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/galleries'
  const apiKey = Cypress.env('API_KEY')
  let galleryId // Store gallery ID for further operations

  it('Create New Gallery', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: [
        {
          name: 'Test Gallery',
          content: '/images/testgallery/gallery.json',
          description: 'A gallery for testing purposes',
          highlightImage: '/images/testgallery/highlight.webp',
          userId: 9,
        },
      ],
    }).then((response) => {
      console.log(response)
      expect(response.status).to.eq(200)
      expect(response.body.newGalleries).to.be.an('array').that.is.not.empty
      galleryId = response.body.newGalleries[0].id // Ensure the correct ID is captured
      console.log('Created Gallery ID:', galleryId) // Log for debugging
    })
  })

  it('Get Gallery by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/id/${galleryId}`, // Ensure galleryId is not undefined
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.gallery.name).to.eq('Test Gallery') // Expect the correct name
    })
  })

  it('Get All Galleries', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.galleries)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('Update a Gallery', () => {
    // Attempt update without API key (expect failure)
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/batch`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: [
        {
          name: 'Test Gallery',
          description: 'Updated description for the gallery',
        },
      ],
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Expect forbidden status without API key
    })

    // Attempt update with API key (expect success)
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/batch`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: [
        {
          name: 'Test Gallery',
          description: 'Updated description for the gallery',
        },
      ],
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  it('Delete a Gallery', () => {
    // Attempt delete without API key (expect failure)
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/id/${galleryId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Expect forbidden status without API key
    })

    // Attempt delete with API key (expect success)
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/id/${galleryId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })
})
