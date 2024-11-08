/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/pitches.cy.ts

describe('Pitch Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/pitches'
  const userToken = Cypress.env('USER_TOKEN')
  const invalidToken = 'someInvalidTokenValue'
  let pitchId: number | undefined // Define with undefined for clarity
  const uniquePitchName = `Pitch-${Date.now()}` // Generate a unique pitch name

  // Step 1: Attempt to create a pitch with various authentication scenarios

  it('should not allow creating a pitch without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        pitch: uniquePitchName,
        PitchType: 'INSPIRATION',
        userId: 9,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include(
        'Authorization token is required',
      )
    })
  })

  it('should not allow creating a pitch with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        pitch: uniquePitchName,
        PitchType: 'INSPIRATION',
        userId: 9,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Create a New Pitch with Valid Authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        pitch: uniquePitchName,
        PitchType: 'INSPIRATION',
        userId: 9,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty
      pitchId = response.body.data.id
    })
  })

  // Step 2: Attempt to update pitch without authentication
  it('Attempt to Update Pitch without Authentication (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${pitchId}`,
      headers: { 'Content-Type': 'application/json' },
      body: { pitch: 'Unauthorized Update' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
    })
  })

  // Step 3: Attempt to update pitch with invalid token
  it('Attempt to Update Pitch with Invalid Token (expect failure)', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: { pitch: 'Invalid Update Attempt' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized with invalid token
    })
  })

  // Step 4: Update pitch with valid authentication
  it('Update Pitch with Authentication', () => {
    const updatedPitchName = `Updated-${uniquePitchName}`
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: { pitch: updatedPitchName },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.pitch).to.eq(updatedPitchName)
    })
  })

  // Step 5: Retrieve pitch by ID
  it('Retrieve Pitch by ID', () => {
    cy.wrap(pitchId).should('exist') // Ensure pitchId exists
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.pitch.pitch).to.eq(`Updated-${uniquePitchName}`)
    })
  })

  // Step 6: Retrieve all pitches
  it('Retrieve All Pitches', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/batch`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  // Step 7: Attempt to delete pitch without authentication
  it('Attempt to Delete Pitch without Authentication (expect failure)', () => {
    cy.wrap(pitchId).should('exist') // Ensure pitchId exists
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${pitchId}`,
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized without token
    })
  })

  // Step 8: Attempt to delete pitch with invalid token
  it('Attempt to Delete Pitch with Invalid Token (expect failure)', () => {
    cy.wrap(pitchId).should('exist') // Ensure pitchId exists
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401) // Unauthorized with invalid token
    })
  })

  // Step 9: Delete pitch with valid authentication
  it('Delete Pitch with Authentication', () => {
    cy.wrap(pitchId).should('exist') // Ensure pitchId exists
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include(
        `Pitch with ID ${pitchId} successfully deleted`,
      )
    })
  })
})
