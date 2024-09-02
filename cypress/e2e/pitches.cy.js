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
      body: {
        title: 'Slothcore',
        pitch: 'Slothcore',
        creator: 'silasfelinus',
        playerId: 1,
        isMature: false,
        isPublic: true,
        PitchType: 'INSPIRATION',
      },
    }).then((response) => {
      console.log(response)
      expect(response.status).to.eq(200)
      pitchId = response.body.pitch.id // Assuming the API returns the created pitches
    })
  })

  it('Get All Pitches', () => {
    cy.request({
      method: 'GET',
      url: baseUrl + '/batch',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.pitches)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
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
      expect(response.body.pitch.title).to.eq('Updated Slothcore')
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
