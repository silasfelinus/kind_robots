// cypress/e2e/api/art.cy.ts
/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('ArtImage Management API Tests', () => {
  const apiRoot = 'https://kind-robots.vercel.app/api'
  const artImageUrl = `${apiRoot}/art/image`
  const artGenerateUrl = `${apiRoot}/art/generate`
  const invalidToken = 'someInvalidTokenValue'
  const adminUserId = 1
  const testUserId = 9

  let apiKey = ''
  let adminToken = ''
  let userToken = ''
  let lolaTestServerId = 37
  let fixtureArtImageId: number | undefined
  let generatedArtImageId: number | undefined
  let generatedPath = ''

  before(() => {
    cy.env([
      'API_KEY',
      'ADMIN_TOKEN',
      'USER_TOKEN',
      'LOLA_TEST_SERVER_ID',
    ]).then((env) => {
      apiKey = String(env.API_KEY || '')
      adminToken = String(env.ADMIN_TOKEN || '')
      userToken = String(env.USER_TOKEN || '')

      const parsedValue = Number(env.LOLA_TEST_SERVER_ID ?? 37)
      lolaTestServerId = Number.isFinite(parsedValue) ? parsedValue : 37

      expect(apiKey, 'API_KEY').to.be.a('string').and.not.be.empty
      expect(adminToken, 'ADMIN_TOKEN').to.be.a('string').and.not.be.empty
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
      expect(lolaTestServerId, 'LOLA_TEST_SERVER_ID').to.be.a('number')
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
          userId: testUserId,
          promptId: null,
          pitchId: null,
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
    if (fixtureArtImageId) {
      cy.request({
        method: 'DELETE',
        url: `${artImageUrl}/${fixtureArtImageId}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        failOnStatusCode: false,
      })
    }

    if (generatedArtImageId) {
      cy.request({
        method: 'DELETE',
        url: `${artImageUrl}/${generatedArtImageId}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        failOnStatusCode: false,
      })
    }
  })

  it('should not allow generating an ArtImage without a bearer token', () => {
    cy.request({
      method: 'POST',
      url: artGenerateUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        promptString: 'A sunset over the ocean',
        artPrompt: 'A sunset over the ocean',
        steps: 20,
        cfg: 5,
        seed: -1,
        promptId: null,
        pitchId: null,
        userId: adminUserId,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.match(/authorization|bearer/i)
    })
  })

  it('should not allow generating an ArtImage with an invalid bearer token', () => {
    cy.request({
      method: 'POST',
      url: artGenerateUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        promptString: 'A sunset over the ocean',
        artPrompt: 'A sunset over the ocean',
        steps: 20,
        cfg: 5,
        seed: -1,
        promptId: null,
        pitchId: null,
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
        'x-api-key': apiKey,
        Authorization: `Bearer ${adminToken}`,
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
        promptId: null,
        pitchId: null,
        userId: adminUserId,
        serverId: lolaTestServerId,
        checkpoint: 'realcartoonPony_v1.safetensors',
        sampler: 'Euler',
        designer: 'cypress-admin',
        isPublic: false,
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
        'x-api-key': apiKey,
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
        isPublic: false,
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
        isPublic: false,
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
