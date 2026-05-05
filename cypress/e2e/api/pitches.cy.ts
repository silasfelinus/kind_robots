/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/api/pitches.cy.ts

describe('Pitch Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/pitches'
  const invalidToken = 'someInvalidTokenValue'
  const uniquePitchName = `Pitch-${Date.now()}`

  let userToken = ''
  let pitchId: number | undefined

  before(() => {
    cy.env(['USER_TOKEN']).then((env) => {
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
    })
  })

  it('should not allow creating a pitch without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        pitch: uniquePitchName,
        PitchType: 'BRAINSTORM',
        userId: 9,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
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
        PitchType: 'BRAINSTORM',
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
        PitchType: 'BRAINSTORM',
        userId: 9,
        CreationSource: 'HUMAN',
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty

      pitchId = response.body.data.id

      expect(pitchId).to.be.a('number')
    })
  })

  it('Attempt to Update Pitch without Authentication (expect failure)', () => {
    expect(pitchId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        pitch: 'Unauthorized Update',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('Attempt to Update Pitch with Invalid Token (expect failure)', () => {
    expect(pitchId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        pitch: 'Invalid Update Attempt',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('Update Pitch with Authentication', () => {
    expect(pitchId).to.exist

    const updatedPitchName = `Updated-${uniquePitchName}`

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        pitch: updatedPitchName,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.pitch).to.eq(updatedPitchName)
    })
  })

  it('Retrieve Pitch by ID', () => {
    expect(pitchId).to.exist

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
      expect(response.body.data.pitch).to.eq(`Updated-${uniquePitchName}`)
    })
  })

  it('Retrieve All Pitches', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
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

  it('Attempt to Delete Pitch without Authentication (expect failure)', () => {
    expect(pitchId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('Attempt to Delete Pitch with Invalid Token (expect failure)', () => {
    expect(pitchId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${pitchId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('Delete Pitch with Authentication', () => {
    expect(pitchId).to.exist

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
