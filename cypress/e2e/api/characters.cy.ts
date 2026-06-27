/* eslint-disable @typescript-eslint/no-unused-expressions */
// cypress/e2e/api/character.cy.ts
import {
  adminHeaders,
  bearerHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
  jsonHeaders,
} from '../../support/api-auth'

describe('Character Management API Tests', () => {
  const badJwt = 'definitely-not-valid'
  const uniqueCharacterName = `Character-${Date.now()}`

  let apiBase = ''
  let baseUrl = ''
  let adminToken = ''
  let userJwt = ''
  let createdUserId: number | undefined
  let characterId: number | undefined

  before(() => {
    getApiEnv().then((env) => {
      apiBase = env.apiBase
      adminToken = env.adminToken
      baseUrl = `${apiBase}/characters`
    })

    createLoggedInTestUser({ fresh: true }).then((auth) => {
      userJwt = auth.token
      createdUserId = auth.id
    })
  })

  after(() => {
    if (characterId && adminToken) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/${characterId}`,
        headers: adminHeaders(adminToken),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiBase, adminToken, createdUserId)
  })

  it('should not allow creating a character without an authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: jsonHeaders(),
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
    })
  })

  it('should not allow creating a character with an invalid authorization token', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(badJwt),
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
    })
  })

  it('Create a New Character with Valid Authentication', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      headers: bearerHeaders(userJwt),
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
      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty

      characterId = response.body.data.id
      expect(characterId).to.be.a('number').and.to.be.greaterThan(0)
    })
  })

  it('Attempt to Update Character without Authentication (expect failure)', () => {
    expect(characterId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${characterId}`,
      headers: jsonHeaders(),
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
      headers: bearerHeaders(badJwt),
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
      headers: bearerHeaders(userJwt),
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
      headers: bearerHeaders(userJwt),
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
      headers: bearerHeaders(userJwt),
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
      headers: jsonHeaders(),
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
      headers: bearerHeaders(badJwt),
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
      headers: bearerHeaders(userJwt),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include(
        `Character with ID ${characterId} successfully deleted`,
      )
      characterId = undefined
    })
  })
})
