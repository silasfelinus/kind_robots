// cypress/e2e/api/pitches.cy.js
/* eslint-disable no-undef */

describe('Pitch Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/pitches'
  const apiKey = Cypress.env('API_KEY')
  let pitchId // Store pitch ID for further operations

  it('Create New Pitches', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: [
        {
          title: 'Slothcore',
          pitch: 'Slothcore',
          creator: 'silasfelinus',
          userId: 1,
          isMature: false,
          isPublic: true,
        },
      ],
    }).then((response) => {
      expect(response.status).to.eq(200)
      pitchId = response.body[0].id // Assuming the API returns the created pitches
    })
  })

  it('Get All Pitches', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.length.greaterThan(0)
    })
  })

  it('Update a Pitch', () => {
    cy.request({
      method: 'PUT',
      url: `${baseUrl}/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        title: 'Updated Slothcore',
        pitch: 'Updated pitch content',
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.title).to.eq('Updated Slothcore')
    })
  })

  it('Delete a Pitch', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })
})
