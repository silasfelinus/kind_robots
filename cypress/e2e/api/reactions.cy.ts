import { createLoggedInTestUser } from '../../support/api-auth'
// cypress/e2e/api/reactions.cy.ts

describe('Reaction Management API Tests', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api'
  const invalidToken = 'someInvalidTokenValue'
  let userId = 0
  let userToken = ''
  let apiKey = ''
  let artImageId: number | undefined
  let reactionId: number | undefined

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${userToken}`,
  })

  const cleanupHeaders = () => ({
    ...authHeaders(),
    ...(apiKey ? { 'x-api-key': apiKey } : {}),
  })

  before(() => {
    cy.env(['API_KEY', 'BETA_ADMIN_TOKEN']).then((env) => {
      apiKey = String(env.BETA_ADMIN_TOKEN || env.API_KEY || '')
    })

    return createLoggedInTestUser().then((auth) => {
      userToken = auth.token
      userId = auth.id
    })
  })

  after(() => {
    if (reactionId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/reactions/${reactionId}`,
        headers: cleanupHeaders(),
        failOnStatusCode: false,
      }).then(() => {
        reactionId = undefined
      })
    }

    if (artImageId) {
      cy.request({
        method: 'DELETE',
        url: `${baseUrl}/art/image/${artImageId}`,
        headers: cleanupHeaders(),
        failOnStatusCode: false,
      }).then(() => {
        artImageId = undefined
      })
    }
  })

  it('Create a New ArtImage Fixture', () => {
    const stamp = Date.now()

    cy.request({
      method: 'POST',
      url: `${baseUrl}/art/image`,
      headers: authHeaders(),
      body: {
        promptString: 'surreal, A beautiful pancake sunrise over the mountains',
        artPrompt: 'surreal, A beautiful pancake sunrise over the mountains',
        steps: 10,
        path: `/images/testing/reaction-fixture-${stamp}.webp`,
        imagePath: `/images/testing/reaction-fixture-${stamp}.webp`,
        fileName: `reaction-fixture-${stamp}.webp`,
        fileType: 'webp',
        seed: -1,
        userId,
        isPublic: false,
        isMature: false,
        isActive: true,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.have.property('id')

      artImageId = response.body.data.id

      expect(artImageId).to.be.a('number')
    })
  })

  it('should not allow creating a reaction without an authorization token', () => {
    expect(artImageId).to.exist

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        userId,
        reactionType: 'LOVED',
        reactionCategory: 'ART_IMAGE',
        artImageId,
        comment: 'Love this pancake sunrise art!',
        rating: 5,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.include('Invalid or expired token.')
    })
  })

  it('should not allow creating a reaction with an invalid authorization token', () => {
    expect(artImageId).to.exist

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      body: {
        userId,
        reactionType: 'LOVED',
        reactionCategory: 'ART_IMAGE',
        artImageId,
        comment: 'Love this pancake sunrise art!',
        rating: 5,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.message).to.match(
        /authorization token|invalid or expired token/i,
      )
    })
  })

  it('Create a New ArtImage Reaction with Authentication', () => {
    expect(artImageId).to.exist

    cy.request({
      method: 'POST',
      url: `${baseUrl}/reactions`,
      headers: authHeaders(),
      body: {
        userId,
        reactionType: 'LOVED',
        reactionCategory: 'ART_IMAGE',
        artImageId,
        comment: 'Love this pancake sunrise art!',
        rating: 5,
        chatId: null,
      },
    }).then((response) => {
      expect(response.status).to.eq(201)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.have.property('id')
      expect(response.body.data.artImageId).to.eq(artImageId)

      reactionId = response.body.data.id

      expect(reactionId).to.be.a('number')
    })
  })

  it('Edit the ArtImage Reaction with Authentication', () => {
    expect(reactionId).to.exist

    cy.request({
      method: 'PATCH',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: authHeaders(),
      body: {
        reactionType: 'CLAPPED',
        reactionCategory: 'ART_IMAGE',
        comment: 'Actually, clapping for this artwork!',
        rating: 4,
      },
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.have.property('rating', 4)
      expect(response.body.data.comment).to.eq(
        'Actually, clapping for this artwork!',
      )
    })
  })

  it('Attempt to Delete Reaction without Authentication (expect failure)', () => {
    expect(reactionId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('message').and.to.be.a('string')
      expect(response.body.message).to.match(
        /authorization token|invalid or expired token/i,
      )
    })
  })

  it('Attempt to Delete Reaction with Invalid Token (expect failure)', () => {
    expect(reactionId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${invalidToken}`,
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body).to.have.property('message').and.to.be.a('string')
      expect(response.body.message).to.match(
        /authorization token|invalid or expired token/i,
      )
    })
  })

  it('Delete the ArtImage Reaction with Authentication', () => {
    expect(reactionId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/reactions/${reactionId}`,
      headers: cleanupHeaders(),
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('success', true)
      expect(response.body.message).to.include(
        `Reaction with ID ${reactionId} successfully deleted`,
      )

      reactionId = undefined
    })
  })

  it('Delete the Created ArtImage Fixture with Authentication', () => {
    expect(artImageId).to.exist

    cy.request({
      method: 'DELETE',
      url: `${baseUrl}/art/image/${artImageId}`,
      headers: cleanupHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect([200, 204, 404]).to.include(response.status)

      artImageId = undefined
    })
  })
})
