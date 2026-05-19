/* eslint-disable @typescript-eslint/no-unused-expressions */

describe('ArtImage Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/art'
  const invalidToken = 'someInvalidTokenValue'

  let apiKey = ''
  let userToken = ''
  let lolaTestServerId = 24
  let artImageId: number
  let generatedPath = ''

  before(() => {
    cy.env(['API_KEY', 'USER_TOKEN', 'LOLA_TEST_SERVER_ID']).then((env) => {
      apiKey = String(env.API_KEY || '')
      userToken = String(env.USER_TOKEN || '')

      const parsedValue = Number(env.LOLA_TEST_SERVER_ID ?? 24)
      lolaTestServerId = Number.isFinite(parsedValue) ? parsedValue : 24

      expect(apiKey, 'API_KEY').to.be.a('string').and.not.be.empty
      expect(userToken, 'USER_TOKEN').to.be.a('string').and.not.be.empty
      expect(lolaTestServerId, 'LOLA_TEST_SERVER_ID').to.be.a('number')
    })

    cy.then(() => {
      cy.request({
        method: 'POST',
        url: `${baseUrl}/image`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          Authorization: `Bearer ${userToken}`,
        },
        body: {
          promptString:
            'surreal, A beautiful pancake sunrise over the mountains',
          artPrompt: 'surreal, A beautiful pancake sunrise over the mountains',
          steps: 10,
          path: '/images/test/pancake-sunrise.webp',
          imagePath: '/images/test/pancake-sunrise.webp',
          fileName: 'pancake-sunrise.webp',
          fileType: 'webp',
          seed: null,
          userId: 9,
          isPublic: false,
          isMature: false,
          isActive: true,
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.log('ArtImage create response:', JSON.stringify(response.body))

        expect(response.status).to.eq(201)
        expect(response.body.success).to.be.true
        expect(response.body.data).to.be.an('object').that.is.not.empty

        artImageId = response.body.data.id
        generatedPath = response.body.data.path || response.body.data.imagePath

        if (!artImageId || !generatedPath) {
          throw new Error('Failed to capture ArtImage ID or path from response')
        }
      })
    })
  })

  it('should not allow generating an ArtImage without a bearer token', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/generate`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: {
        promptString: 'A sunset over the ocean',
        steps: 20,
        cfg: 5,
        seed: null,
        promptId: null,
        pitchId: null,
        userId: 9,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('Authorization token required')
    })
  })

  it('should not allow generating an ArtImage with an invalid bearer token', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/generate`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        promptString: 'A sunset over the ocean',
        steps: 20,
        cfg: 5,
        seed: null,
        promptId: null,
        pitchId: null,
        userId: 9,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include(
        'Invalid or expired authorization token',
      )
    })
  })

  it('should allow generating an ArtImage with a valid bearer token using Lola API test server', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/generate`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        Authorization: `Bearer ${userToken}`,
      },
      timeout: 120000,
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
        userId: 9,
        serverId: lolaTestServerId,
        checkpoint: 'realcartoonPony_v1.safetensors',
        sampler: 'Euler',
        designer: 'silasfelinus',
        collection: 'cafefred',
        collectionLabel: 'cafefred',
        isPublic: false,
        isMature: false,
      },
      failOnStatusCode: false,
    }).then((response) => {
      cy.log('Generate ArtImage response:', JSON.stringify(response.body))

      expect(response.status).to.eq(201)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.be.an('object').that.is.not.empty
      expect(response.body.data.serverId).to.eq(lolaTestServerId)

      artImageId = response.body.data.id
      generatedPath = response.body.data.path || response.body.data.imagePath

      expect(artImageId).to.be.a('number')
    })
  })

  it('should get an ArtImage by ID', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/${artImageId}`,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data.id).to.eq(artImageId)
      expect(response.body.data).to.include.keys(['createdAt', 'updatedAt'])
    })
  })

  it('should get all ArtImages', () => {
    cy.request({
      method: 'GET',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data)
        .to.be.an('array')
        .and.have.length.greaterThan(0)
    })
  })

  it('should allow updating an ArtImage with a valid authorization token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${artImageId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: {
        path: 'updated-path-123.webp',
        imagePath: 'updated-path-123.webp',
        designer: 'updatedDesigner',
        isPublic: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.data).to.include({
        id: artImageId,
        designer: 'updatedDesigner',
        isPublic: true,
      })
    })
  })

  it('should not allow updating an ArtImage without an authorization token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${artImageId}`,
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
      expect(response.body.message).to.include('authorization')
    })
  })

  it('should not allow updating an ArtImage with an invalid authorization token', () => {
    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/${artImageId}`,
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
      expect(response.body.message).to.include('token')
    })
  })

  it('should not allow deleting an ArtImage without an authorization token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${artImageId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('authorization')
    })
  })

  it('should not allow deleting an ArtImage with an invalid authorization token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${artImageId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.be.false
      expect(response.body.message).to.include('token')
    })
  })

  it('should allow deleting an ArtImage with a valid authorization token', () => {
    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/${artImageId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.success).to.be.true
      expect(response.body.message).to.include(String(artImageId))
    })
  })
})
