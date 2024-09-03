// cypress/e2e/api/art.cy.js
/* eslint-disable no-undef */

describe('Art Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/art'
  const apiKey = Cypress.env('API_KEY')
  let artId // Store art ID for further operations

  it('Create New Art', () => {
    cy.request({
      method: 'POST',
      url: baseUrl + '/generate',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        galleryId: 21,
        path: '/images/cafefred/cafefred-1695613612690.webp',
        prompt: 'zebra accountant',
        promptId: 23,
        userId: 0,
        pitch: 'zebrapunk',
        pitchId: 2,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.newArt).to.be.an('object').that.is.not.empty
      artId = response.body.newArt.id // Ensure the correct ID is captured
      console.log('Created Art ID:', artId) // Log for debugging
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
      expect(response.body.arts)
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
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
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
