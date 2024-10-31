// cypress/e2e/pitches.cy.ts

describe('Pitch Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/pitches'
  const apiKey = Cypress.env('API_KEY')
  let pitchId: number | undefined // Define with undefined for clarity
  const uniquePitchName = `Pitch-${Date.now()}` // Generate a unique pitch name

  before(() => {
    // Create a pitch before running tests
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        pitch: uniquePitchName,
        PitchType: 'INSPIRATION', // Adjust to match schema’s `PitchType`
        userId: 9,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      pitchId = response.body.pitch.id // Capture ID for use in other tests
    })
  })

  it('Attempt to Update Pitch without Authentication (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${pitchId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { pitch: 'Unauthorized Update' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Update Pitch with Authentication', () => {
    const updatedPitchName = `Updated-${uniquePitchName}`
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: { pitch: updatedPitchName },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.pitch.pitch).to.eq(updatedPitchName)
    })
  })

  it('Retrieve Pitch by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.pitch.pitch).to.eq(`Updated-${uniquePitchName}`)
    })
  })

  it('Retrieve All Pitches', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/batch`,
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

  it('Attempt to Delete Pitch without Authentication (expect failure)', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${pitchId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(403) // Forbidden without API key
    })
  })

  it('Delete Pitch with Authentication', () => {
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

  after(() => {
    if (pitchId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${pitchId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(200)
        cy.log('Reverted Pitch ID:', pitchId)
      })
    }
  })
})
