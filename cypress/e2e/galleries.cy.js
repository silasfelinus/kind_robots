// cypress/e2e/api/galleries.cy.js
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
        },
      ],
    }).then((response) => {
      console.log(response)
      expect(response.status).to.eq(200)
      galleryId = response.body.galleries[0].id // Assuming the API returns the created galleries
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

  it('Get Gallery by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/id/${galleryId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.gallery.name).to.eq('Test Gallery')
    })
  })

  it('Update a Gallery', () => {
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
