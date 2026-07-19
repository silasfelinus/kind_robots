// cypress/e2e/api/art.cy.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */

import {
  adminHeaders,
  createLoggedInTestUser,
  deleteTestUser,
  getApiEnv,
} from '../../support/api-auth'

let userId = 0

describe('ArtImage Management API Tests', () => {
  const invalidToken = 'someInvalidTokenValue'
  const adminUserId = 1

  let apiRoot = ''
  let artImageUrl = ''
  let artGenerateUrl = ''
  let apiKey = ''
  let adminToken = ''
  let userToken = ''
  let lolaTestServerId = 37
  let fixtureArtImageId: number | undefined
  let generatedArtImageId: number | undefined
  let generatedPath = ''

  before(() => {
    getApiEnv().then((env) => {
      apiRoot = env.apiBase
      adminToken = env.adminToken
      apiKey = env.adminToken
      artImageUrl = `${apiRoot}/art/image`
      artGenerateUrl = `${apiRoot}/art/generate`
    })

    cy.env(['API_KEY', 'LOLA_TEST_SERVER_ID']).then((env) => {
      apiKey = String(env.API_KEY || apiKey)

      const parsedValue = Number(env.LOLA_TEST_SERVER_ID ?? 37)
      lolaTestServerId = Number.isFinite(parsedValue) ? parsedValue : 37

      expect(apiKey, 'API_KEY or ADMIN_TOKEN').to.be.a('string').and.not.be.empty
      expect(adminToken, 'ADMIN_TOKEN').to.be.a('string').and.not.be.empty
      expect(lolaTestServerId, 'LOLA_TEST_SERVER_ID').to.be.a('number')
    })

    createLoggedInTestUser({ fresh: true }).then((auth) => {
      userToken = auth.token
      userId = auth.id
    })

    cy.then(() => {
      cy.request({
        method: 'POST',
        url: artImageUrl,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: {
          promptString:
            'surreal, a beautiful pancake sunrise over the mountains',
          steps: 10,
          path: ' ',
          seed: -1,
          imagePath: 'justfortesting',
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.log(
          'ArtImage fixture create response:',
          JSON.stringify(response.body),
        )

        expect(response.status, JSON.stringify(response.body)).to.eq(201)
        expect(response.body.success).to.be.true
        expect(response.body.data).to.be.an('object').that.is.not.empty
        expect(response.body.data).to.have.property('id')

        fixtureArtImageId = response.body.data.id
        generatedPath = response.body.data.path || response.body.data.imagePath

        expect(fixtureArtImageId).to.be.a('number')
        expect(generatedPath).to.be.a('string').and.not.be.empty
      })
    })
  })

  after(() => {
    if (fixtureArtImageId && adminToken) {
      cy.request({
        method: 'DELETE',
        url: `${artImageUrl}/${fixtureArtImageId}`,
        headers: adminHeaders(adminToken),
        failOnStatusCode: false,
      })
    }

    if (generatedArtImageId && adminToken) {
      cy.request({
        method: 'DELETE',
        url: `${artImageUrl}/${generatedArtImageId}`,
        headers: adminHeaders(adminToken),
        failOnStatusCode: false,
      })
    }

    deleteTestUser(apiRoot, adminToken, userId)
  })

  it('should not allow generating an ArtImage without machine auth', () => {
    cy.request({
      method: 'POST',
      url: artGenerateUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        promptString: 'A sunset over the ocean',
        artPrompt: 'A sunset over the ocean',
        steps: 20,
        cfg: 5,
        seed: -1,
        userId: adminUserId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.match(/authorization|token|auth/i)
    })
  })

  it('should not allow generating an ArtImage with an invalid bearer token', () => {
    cy.request({
      method: 'POST',
      url: artGenerateUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        promptString: 'A sunset over the ocean',
        artPrompt: 'A sunset over the ocean',
        steps: 20,
        cfg: 5,
        seed: -1,
        userId: adminUserId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.match(/invalid|expired|token/i)
    })
  })

  it.skip('should allow generating an ArtImage with a valid bearer token using Lola API test server', () => {
    cy.request({
      method: 'POST',
      url: artGenerateUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      timeout: 120000,
      failOnStatusCode: false,
      body: {
        title: 'Cypress Lola ArtImage Test',
        promptString: 'a small kind robot holding a glowing pancake',
        artPrompt: 'a small kind robot holding a glowing pancake',
        steps: 10,
        cfg: 3,
        cfgHalf: false,
        seed: -1,
        userId,
        serverId: lolaTestServerId,
        checkpoint: 'realcartoonPony_v1.safetensors',
        sampler: 'Euler',
        designer: 'cypress-admin',
        isPublic: true,
        isMature: false,
      },
    }).then((response) => {
      cy.log('Generate ArtImage response:', JSON.stringify(response.body))

      expect(response.status, JSON.stringify(response.body)).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty
      expect(response.body.data.serverId).to.eq(lolaTestServerId)

      generatedArtImageId = response.body.data.id
      generatedPath = response.body.data.path || response.body.data.imagePath

      expect(generatedArtImageId).to.be.a('number')
      expect(generatedPath).to.be.a('string').and.not.be.empty
    })
  })

  it('should get an ArtImage by ID', () => {
    expect(fixtureArtImageId).to.exist

    cy.request({
      method: 'GET',
      url: `${artImageUrl}/${fixtureArtImageId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.id).to.eq(fixtureArtImageId)
      expect(response.body.data).to.include.keys(['createdAt', 'updatedAt'])
    })
  })

  it('should get all ArtImages', () => {
    cy.request({
      method: 'GET',
      url: artImageUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('should allow updating an ArtImage with a valid authorization token', () => {
    expect(fixtureArtImageId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${artImageUrl}/${fixtureArtImageId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      failOnStatusCode: false,
      body: {
        path: 'updated-path-123.webp',
        imagePath: 'updated-path-123.webp',
        designer: 'updatedDesigner',
        isPublic: true,
      },
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.include({
        id: fixtureArtImageId,
        designer: 'updatedDesigner',
        isPublic: true,
      })
    })
  })

  it('should not allow updating an ArtImage without an authorization token', () => {
    expect(fixtureArtImageId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${artImageUrl}/${fixtureArtImageId}`,
      failOnStatusCode: false,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        designer: 'unauthorizedDesigner',
        isPublic: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.match(/authorization|token|bearer/i)
    })
  })

  it('should not allow updating an ArtImage with an invalid authorization token', () => {
    expect(fixtureArtImageId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${artImageUrl}/${fixtureArtImageId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
      body: {
        path: 'invalid-token-path.webp',
        designer: 'invalidTokenDesigner',
        isPublic: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.match(/invalid|expired|token/i)
    })
  })

  it('should not allow deleting an ArtImage without an authorization token', () => {
    expect(fixtureArtImageId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${artImageUrl}/${fixtureArtImageId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.match(/authorization|token|bearer/i)
    })
  })

  it('should not allow deleting an ArtImage with an invalid authorization token', () => {
    expect(fixtureArtImageId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${artImageUrl}/${fixtureArtImageId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.match(/invalid|expired|token/i)
    })
  })

  it('should allow deleting an ArtImage with a valid authorization token', () => {
    expect(fixtureArtImageId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${artImageUrl}/${fixtureArtImageId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include(String(fixtureArtImageId))

      fixtureArtImageId = undefined
    })
  })
})
