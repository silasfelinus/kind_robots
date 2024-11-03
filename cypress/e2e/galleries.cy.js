// cypress/e2e/galleries.cy.js
/* eslint-disable no-undef */

describe('Gallery Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/galleries'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let galleryId // Store gallery ID for further operations

  // Step 1: Create a new gallery for testing
  it('Create New Gallery', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        name: 'Test Gallery',
        content: '/images/testgallery/gallery.json',
        description: 'A gallery for testing purposes',
        highlightImage: '/images/testgallery/highlight.webp',
        userId: 9,
        url: 'https://art-collections/natures-wonders',
        custodian: 'Curated by ArtBot',
        imagePaths:
          '/images/collection1/image1.webp,/images/collection1/image2.webp',
        isMature: false,
        isPublic: true,
        channelId: null,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      galleryId = response.body.gallery?.id // Capture the gallery ID for further tests
    })
  })

  // Step 2: Retrieve the created gallery by ID
  it('Get Gallery by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/id/${galleryId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.gallery.name).to.eq('Test Gallery')
    })
  })

  // Step 3: Retrieve all galleries
  it('Get All Galleries', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.galleries)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  // Step 4: Update gallery details with and without authentication
  it('Update Gallery Details', () => {
    // Attempt update without token (expect failure)
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/id/${galleryId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        description: 'Updated description without token',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
    })

    // Attempt update with invalid token
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/id/${galleryId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        description: 'Updated description with invalid token',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized with invalid token
    })

    // Attempt update with valid token (expect success)
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/id/${galleryId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        description: 'Updated description for the gallery',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.gallery.description).to.eq(
        'Updated description for the gallery',
      )
    })
  })

  // Step 5: Delete the gallery with and without authentication
  it('Delete a Gallery', () => {
    // Attempt delete without token (expect failure)
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/id/${galleryId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
    })

    // Attempt delete with invalid token
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/id/${galleryId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized with invalid token
    })

    // Attempt delete with valid token (expect success)
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/id/${galleryId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include(
        `Gallery with ID ${galleryId} deleted successfully`,
      )
    })
  })
})
