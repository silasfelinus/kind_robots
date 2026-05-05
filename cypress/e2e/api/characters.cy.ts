/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/api/character.cy.ts

describe('Character Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/characters'
  const invalidToken = 'someInvalidTokenValue'
  const uniqueCharacterName = `Character-${Date.now()}`

  let userToken = ''
  let characterId: number | undefined

  before(() => {
    cy.env(['USER_TOKEN']).then((env) => {
      userToken = String(env.USER_TOKEN || '')
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
    })
  })

  it('should not allow creating a character without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        name: uniqueCharacterName,
        honorific: 'Adventurer',
        species: 'Human',
        class: 'Warrior',
        level: 1,
        isPublic: false,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('should not allow creating a character with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        name: uniqueCharacterName,
        honorific: 'Adventurer',
        species: 'Human',
        class: 'Warrior',
        level: 1,
        isPublic: false,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token')
    })
  })

  it('Create a New Character with Valid Authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        name: uniqueCharacterName,
        honorific: 'Adventurer',
        species: 'Human',
        class: 'Warrior',
        level: 1,
        isPublic: false,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty

      characterId = response.body.data.id
    })
  })

  it('Attempt to Update Character without Authentication (expect failure)', () => {
    expect(characterId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${characterId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        name: 'Unauthorized Update',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('Attempt to Update Character with Invalid Token (expect failure)', () => {
    expect(characterId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${characterId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        name: 'Invalid Update Attempt',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('Update Character with Authentication', () => {
    expect(characterId).to.exist

    const updatedCharacterName = `Updated-${uniqueCharacterName}`

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${characterId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        name: updatedCharacterName,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.name).to.eq(updatedCharacterName)
    })
  })

  it('Retrieve Character by ID', () => {
    expect(characterId).to.exist

    cy.request({
      method: 'GET',
      url: `${baseUrl}/${characterId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.name).to.include('Updated-')
    })
  })

  it('Retrieve All Characters', () => {
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

  it('Attempt to Delete Character without Authentication (expect failure)', () => {
    expect(characterId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${characterId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('Attempt to Delete Character with Invalid Token (expect failure)', () => {
    expect(characterId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${characterId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })

  it('Delete Character with Authentication', () => {
    expect(characterId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${characterId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include(
        `Character with ID ${characterId} successfully deleted`,
      )
    })
  })
})
